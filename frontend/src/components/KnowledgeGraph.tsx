import React, { useEffect, useState } from 'react';
import { Card, Spinner, Alert, Badge, Button, ButtonGroup, Form, Modal } from 'react-bootstrap';
import ForceGraph2D from 'react-force-graph-2d';
import KnowledgeGraph3D from './KnowledgeGraph3D';

// Define types for the graph data
interface GraphNode {
    id: string;
    group: number;
    label: string;
    type?: string;
    url?: string;
    importance?: number;
    connections?: number;
    commits?: number;
    files?: number;
    sha?: string;
    message?: string;
    date?: string;
    path?: string;
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
        commits?: number;
        files?: number;
    };
    branch?: string;
    repository?: string;
}

interface KnowledgeGraphProps {
    repository: string;
    branch: string;
}

// Module-level cache that persists across component mounts/unmounts
const graphCache = new Map<string, GraphData>();

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ repository, branch }) => {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [showNodeDetails, setShowNodeDetails] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        // Create a unique key for this repository + branch combination
        const currentKey = `${repository}:${branch}`;

        // Check if we have cached data for this key
        const cachedData = graphCache.get(currentKey);
        if (cachedData) {
            setGraphData(cachedData);
            setLoading(false);
            return;
        }

        // No cached data, fetch from API
        setLoading(true);
        setError(null);

        fetch(`http://localhost:3000/api/knowledge-graph?repository=${encodeURIComponent(repository)}&branch=${encodeURIComponent(branch)}`)
            .then(res => res.json())
            .then((data: GraphData) => {
                setGraphData(data);
                graphCache.set(currentKey, data); // Cache the data
                setLoading(false);
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
            case 4: return '#9C27B0'; // Commits - Purple
            case 5: return '#00BCD4'; // Files - Cyan
            default: return '#9E9E9E'; // Default - Gray
        }
    };

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        setShowNodeDetails(true);
        if (node.url) {
            window.open(node.url, '_blank');
        }
    };

    // Filter nodes by type
    const getFilteredData = (): GraphData | null => {
        if (!graphData || filterType === 'all') return graphData;

        const typeMap: { [key: string]: number } = {
            'people': 1,
            'modules': 2,
            'decisions': 3,
            'commits': 4,
            'files': 5
        };

        const targetGroup = typeMap[filterType];
        if (!targetGroup) return graphData;

        const filteredNodes = graphData.nodes.filter(node => node.group === targetGroup);
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = graphData.links.filter(link =>
            nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
        );

        return {
            ...graphData,
            nodes: filteredNodes,
            links: filteredLinks
        };
    };

    const filteredData = getFilteredData();

    if (loading) {
        return (
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    Knowledge Graph
                </Card.Header>
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
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    Knowledge Graph
                </Card.Header>
                <Card.Body className="text-center" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Alert variant="warning">
                        {error || 'No graph data available. Please sync data from GitHub first.'}
                    </Alert>
                    {graphData?.stats && (
                        <div className="mt-3">
                            <Badge bg="secondary" className="me-2">{graphData.stats.people} people</Badge>
                            <Badge bg="secondary" className="me-2">{graphData.stats.modules} modules</Badge>
                            <Badge bg="secondary" className="me-2">{graphData.stats.decisions} decisions</Badge>
                            {graphData.stats.commits && <Badge bg="secondary" className="me-2">{graphData.stats.commits} commits</Badge>}
                            {graphData.stats.files && <Badge bg="secondary">{graphData.stats.files} files</Badge>}
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    }

    return (
        <>
            <Card className="shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                <Card.Header className="bg-gradient text-white" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '1.5rem'
                }}>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h5 className="mb-1">Knowledge Graph - {repository}</h5>
                            <small className="opacity-75">Branch: {branch}</small>
                        </div>

                        <div className="d-flex gap-3 align-items-center flex-wrap">
                            {/* View Mode Toggle */}
                            <ButtonGroup size="sm">
                                <Button
                                    variant={viewMode === '2d' ? 'light' : 'outline-light'}
                                    onClick={() => setViewMode('2d')}
                                >
                                    2D View
                                </Button>
                                <Button
                                    variant={viewMode === '3d' ? 'light' : 'outline-light'}
                                    onClick={() => setViewMode('3d')}
                                >
                                    3D View
                                </Button>
                            </ButtonGroup>

                            {/* Filter Dropdown */}
                            <Form.Select
                                size="sm"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                style={{ width: 'auto' }}
                            >
                                <option value="all">All Types</option>
                                <option value="people">People Only</option>
                                <option value="modules">Modules Only</option>
                                <option value="decisions">Decisions Only</option>
                                <option value="commits">Commits Only</option>
                                <option value="files">Files Only</option>
                            </Form.Select>

                            {/* Statistics Badges */}
                            {graphData.stats && (
                                <div className="d-flex gap-2">
                                    <Badge bg="light" text="dark">{graphData.stats.people} people</Badge>
                                    <Badge bg="light" text="dark">{graphData.stats.modules} modules</Badge>
                                    {graphData.stats.commits && <Badge bg="light" text="dark">{graphData.stats.commits} commits</Badge>}
                                </div>
                            )}
                        </div>
                    </div>
                </Card.Header>

                <Card.Body className="p-0" style={{ backgroundColor: '#fafafa' }}>
                    {viewMode === '2d' ? (
                        <div style={{ width: '100%', height: '600px' }}>
                            <ForceGraph2D
                                graphData={filteredData || graphData}
                                nodeLabel="label"
                                nodeColor={getNodeColor}
                                nodeRelSize={6}
                                linkColor={() => '#999'}
                                linkWidth={(link: any) => Math.min(link.value || 1, 2) * 0.5}
                                onNodeClick={handleNodeClick}
                                width={window.innerWidth > 1200 ? 1200 : window.innerWidth - 100}
                                height={600}
                                nodeCanvasObject={(node: any, ctx, globalScale) => {
                                    const label = node.label;
                                    const fontSize = 10 / globalScale; // Reduced from 14 to 10
                                    const size = node.importance ? 5 * Math.sqrt(node.importance) : 5;

                                    ctx.font = `bold ${fontSize}px Sans-Serif`;
                                    const textWidth = ctx.measureText(label).width;
                                    const bckgDimensions = [textWidth + fontSize * 0.6, fontSize + fontSize * 0.4];

                                    // Draw node circle with size based on importance
                                    ctx.fillStyle = getNodeColor(node);
                                    ctx.beginPath();
                                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                                    ctx.fill();

                                    // Draw label background with border
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                                    ctx.lineWidth = 1;
                                    const rectX = node.x - bckgDimensions[0] / 2;
                                    const rectY = node.y + size + 5;
                                    ctx.fillRect(rectX, rectY, bckgDimensions[0], bckgDimensions[1]);
                                    ctx.strokeRect(rectX, rectY, bckgDimensions[0], bckgDimensions[1]);

                                    // Draw label text with better contrast
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillStyle = '#000000';
                                    ctx.fillText(label, node.x, rectY + bckgDimensions[1] / 2);
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ height: '600px' }}>
                            <KnowledgeGraph3D
                                graphData={filteredData || graphData}
                                onNodeClick={handleNodeClick}
                            />
                        </div>
                    )}
                </Card.Body>

                <Card.Footer className="bg-light">
                    <div className="d-flex justify-content-center gap-4 flex-wrap mb-2">
                        <span><span style={{ color: '#4CAF50', fontSize: '20px' }}>●</span> People</span>
                        <span><span style={{ color: '#2196F3', fontSize: '20px' }}>●</span> Modules</span>
                        <span><span style={{ color: '#FF9800', fontSize: '20px' }}>●</span> Decisions</span>
                        <span><span style={{ color: '#9C27B0', fontSize: '20px' }}>●</span> Commits</span>
                        <span><span style={{ color: '#00BCD4', fontSize: '20px' }}>●</span> Files</span>
                    </div>
                    <p className="text-center text-muted small mb-0">
                        {viewMode === '3d' ? 'Drag to rotate • Scroll to zoom • Right-click to pan' : 'Click nodes to view details • Drag to pan • Scroll to zoom'}
                    </p>
                </Card.Footer>
            </Card>

            {/* Node Details Modal */}
            <Modal show={showNodeDetails} onHide={() => setShowNodeDetails(false)} size="lg">
                <Modal.Header closeButton className="bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Modal.Title>Node Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedNode && (
                        <div>
                            <h5 className="mb-3">{selectedNode.label}</h5>
                            <div className="row">
                                <div className="col-md-6">
                                    <p><strong>Type:</strong> <Badge bg="secondary">{selectedNode.type}</Badge></p>
                                    <p><strong>Connections:</strong> {selectedNode.connections || 0}</p>
                                    {selectedNode.importance && (
                                        <p><strong>Importance Score:</strong> {selectedNode.importance.toFixed(2)}</p>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    {selectedNode.commits && <p><strong>Commits:</strong> {selectedNode.commits}</p>}
                                    {selectedNode.files && <p><strong>Files:</strong> {selectedNode.files}</p>}
                                    {selectedNode.date && <p><strong>Date:</strong> {selectedNode.date}</p>}
                                </div>
                            </div>
                            {selectedNode.message && (
                                <div className="mt-3">
                                    <strong>Message:</strong>
                                    <p className="text-muted">{selectedNode.message}</p>
                                </div>
                            )}
                            {selectedNode.path && (
                                <div className="mt-3">
                                    <strong>Path:</strong>
                                    <code className="d-block bg-light p-2 rounded">{selectedNode.path}</code>
                                </div>
                            )}
                            {selectedNode.url && (
                                <div className="mt-3">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => window.open(selectedNode.url, '_blank')}
                                    >
                                        View on GitHub →
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default KnowledgeGraph;

