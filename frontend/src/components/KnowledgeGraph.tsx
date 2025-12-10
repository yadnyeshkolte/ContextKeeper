import React, { useEffect, useState } from 'react';
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

const KnowledgeGraph: React.FC = () => {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:3000/api/knowledge-graph')
            .then(res => res.json())
            .then((data: GraphData) => {
                setGraphData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching knowledge graph:', err);
                setError('Failed to load knowledge graph');
                setLoading(false);
            });
    }, []);

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
            <div className="knowledge-graph" style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
                <h2>Knowledge Graph</h2>
                <div style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p>Loading graph data...</p>
                </div>
            </div>
        );
    }

    if (error || !graphData || graphData.nodes.length === 0) {
        return (
            <div className="knowledge-graph" style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
                <h2>Knowledge Graph</h2>
                <div style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <p>{error || 'No graph data available. Please collect data from GitHub or Slack first.'}</p>
                    {graphData?.stats && (
                        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                            <p>Stats: {graphData.stats.people} people, {graphData.stats.modules} modules, {graphData.stats.decisions} decisions</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="knowledge-graph" style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
            <h2>Knowledge Graph</h2>
            {graphData.stats && (
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                    <strong>Graph Stats:</strong> {graphData.stats.people} people, {graphData.stats.modules} modules, {graphData.stats.decisions} decisions
                </div>
            )}
            <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#fafafa'
            }}>
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
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <span><span style={{ color: '#4CAF50' }}>●</span> People</span>
                    <span><span style={{ color: '#2196F3' }}>●</span> Modules</span>
                    <span><span style={{ color: '#FF9800' }}>●</span> Decisions</span>
                </div>
                <p style={{ textAlign: 'center', marginTop: '5px' }}>Click on decision nodes to view details</p>
            </div>
        </div>
    );
};

export default KnowledgeGraph;
