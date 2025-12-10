import React, { useEffect, useState, useRef } from 'react';
import { Card, Spinner, Alert, Badge } from 'react-bootstrap';
import ForceGraph2D from 'react-force-graph-2d';

// Define types for the graph data
interface GraphNode {
    id: string;
    group: number;
    label: string;
    type?: string;
    url?: string;
}

interface GraphLink {
    source: string;
    target: string;
    value: number;
    type?: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
    stats?: {
        people: number;
        modules: number;
        decisions: number;
    };
}

interface KnowledgeGraphProps {
    repository: string;
    branch: string;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ repository, branch }) => {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastFetchedKey = useRef<string>('');

    useEffect(() => {
        // Create a unique key for this repository + branch combination
        const currentKey = `${repository}:${branch}`;

        // Only fetch if we haven't already fetched for this combination
        if (lastFetchedKey.current === currentKey) {
            return;
        }

        setLoading(true);
        setError(null);

        fetch(`http://localhost:3000/api/knowledge-graph?repository=${encodeURIComponent(repository)}&branch=${encodeURIComponent(branch)}`)
            .then(res => res.json())
            .then((data: GraphData) => {
                setGraphData(data);
                setLoading(false);
                lastFetchedKey.current = currentKey;
            })
            .catch(err => {
                console.error('Error fetching knowledge graph:', err);
                setError('Failed to load knowledge graph');
                setLoading(false);
            });
    }, [repository, branch]);

    // Color mapping for different node types
    const getNodeColor = (node: GraphNode) => {
        switch (node.group) {
            case 1: return '#4CAF50'; // People - Green
            case 2: return '#2196F3'; // Modules - Blue
            case 3: return '#FF9800'; // Decisions - Orange
            default: return '#9E9E9E'; // Default - Gray
        }
    };

    const handleNodeClick = (node: any) => {
        if (node.url) {
            window.open(node.url, '_blank');
        }
    };

    if (loading) {
        return (
            <Card>
                <Card.Header as="h5">Knowledge Graph</Card.Header>
                <Card.Body className="text-center" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">Loading graph data...</p>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    if (error || !graphData || graphData.nodes.length === 0) {
        return (
            <Card>
                <Card.Header as="h5">Knowledge Graph</Card.Header>
                <Card.Body className="text-center" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Alert variant="warning">
                        {error || 'No graph data available. Please sync data from GitHub first.'}
                    </Alert>
                    {graphData?.stats && (
                        <div className="mt-3">
                            <Badge bg="secondary" className="me-2">{graphData.stats.people} people</Badge>
                            <Badge bg="secondary" className="me-2">{graphData.stats.modules} modules</Badge>
                            <Badge bg="secondary">{graphData.stats.decisions} decisions</Badge>
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card>
            <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Knowledge Graph - {repository} ({branch})</h5>
                    {graphData.stats && (
                        <div>
                            <Badge bg="success" className="me-2">{graphData.stats.people} people</Badge>
                            <Badge bg="primary" className="me-2">{graphData.stats.modules} modules</Badge>
                            <Badge bg="warning">{graphData.stats.decisions} decisions</Badge>
                        </div>
                    )}
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                <div style={{ backgroundColor: '#fafafa' }}>
                    <ForceGraph2D
                        graphData={graphData}
                        nodeLabel="label"
                        nodeColor={getNodeColor}
                        nodeRelSize={6}
                        linkColor={() => '#999'}
                        linkWidth={(link: any) => link.value || 1}
                        onNodeClick={handleNodeClick}
                        width={800}
                        height={500}
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const label = node.label;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px Sans-Serif`;
                            const textWidth = ctx.measureText(label).width;
                            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                            // Draw node circle
                            ctx.fillStyle = getNodeColor(node);
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
                            ctx.fill();

                            // Draw label background
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                            ctx.fillRect(
                                node.x - bckgDimensions[0] / 2,
                                node.y - bckgDimensions[1] / 2 + 8,
                                bckgDimensions[0],
                                bckgDimensions[1]
                            );

                            // Draw label text
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#333';
                            ctx.fillText(label, node.x, node.y + 8);
                        }}
                    />
                </div>
            </Card.Body>
            <Card.Footer>
                <div className="d-flex justify-content-center gap-3">
                    <span><span style={{ color: '#4CAF50' }}>●</span> People</span>
                    <span><span style={{ color: '#2196F3' }}>●</span> Modules</span>
                    <span><span style={{ color: '#FF9800' }}>●</span> Decisions</span>
                </div>
                <p className="text-center text-muted small mb-0 mt-2">Click on decision nodes to view details</p>
            </Card.Footer>
        </Card>
    );
};

export default KnowledgeGraph;
