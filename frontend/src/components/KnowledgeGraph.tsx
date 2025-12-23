import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import KnowledgeGraph3D from './KnowledgeGraph3D';

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
        const currentKey = `${repository}:${branch}`;
        const cachedData = graphCache.get(currentKey);
        if (cachedData) {
            setGraphData(cachedData);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        fetch(`http://localhost:3000/api/knowledge-graph?repository=${encodeURIComponent(repository)}&branch=${encodeURIComponent(branch)}`)
            .then(res => res.json())
            .then((data: GraphData) => {
                setGraphData(data);
                graphCache.set(currentKey, data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching knowledge graph:', err);
                setError('Failed to load knowledge graph');
                setLoading(false);
            });
    }, [repository, branch]);

    const getNodeColor = (node: GraphNode) => {
        switch (node.group) {
            case 1: return '#4CAF50';
            case 2: return '#2196F3';
            case 3: return '#FF9800';
            case 4: return '#9C27B0';
            case 5: return '#00BCD4';
            default: return '#9E9E9E';
        }
    };

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        setShowNodeDetails(true);
        if (node.url) {
            window.open(node.url, '_blank');
        }
    };

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

    // Loading State
    if (loading) {
        return (
            <div className="glass-card overflow-hidden animate-fade-in">
                <div className="card-header-gradient">
                    <h3 className="text-xl font-semibold">Knowledge Graph</h3>
                </div>
                <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                        <div className="spinner-lg text-primary-500 mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading graph data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error or Empty State
    if (error || !graphData || graphData.nodes.length === 0) {
        return (
            <div className="glass-card overflow-hidden animate-fade-in">
                <div className="card-header-gradient">
                    <h3 className="text-xl font-semibold">Knowledge Graph</h3>
                </div>
                <div className="flex flex-col items-center justify-center h-[500px] p-6">
                    <div className="alert-warning max-w-md">
                        <span>{error || 'No graph data available. Please sync data from GitHub first.'}</span>
                    </div>
                    {graphData?.stats && (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <span className="badge-secondary">{graphData.stats.people} people</span>
                            <span className="badge-secondary">{graphData.stats.modules} modules</span>
                            <span className="badge-secondary">{graphData.stats.decisions} decisions</span>
                            {graphData.stats.commits && <span className="badge-secondary">{graphData.stats.commits} commits</span>}
                            {graphData.stats.files && <span className="badge-secondary">{graphData.stats.files} files</span>}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="glass-card overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-primary text-white p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Knowledge Graph - {repository}</h3>
                            <p className="text-sm text-white/75">Branch: {branch}</p>
                        </div>

                        <div className="flex flex-wrap gap-3 items-center">
                            {/* View Mode Toggle */}
                            <div className="flex rounded-lg overflow-hidden bg-white/10">
                                <button
                                    onClick={() => setViewMode('2d')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === '2d'
                                        ? 'bg-white text-primary-600'
                                        : 'text-white hover:bg-white/20'
                                        }`}
                                >
                                    2D View
                                </button>
                                <button
                                    onClick={() => setViewMode('3d')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === '3d'
                                        ? 'bg-white text-primary-600'
                                        : 'text-white hover:bg-white/20'
                                        }`}
                                >
                                    3D View
                                </button>
                            </div>

                            {/* Filter Dropdown */}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg bg-white/10 text-white border-0 focus:ring-2 focus:ring-white/50 cursor-pointer"
                            >
                                <option value="all" className="text-gray-900">All Types</option>
                                <option value="people" className="text-gray-900">People Only</option>
                                <option value="modules" className="text-gray-900">Modules Only</option>
                                <option value="decisions" className="text-gray-900">Decisions Only</option>
                                <option value="commits" className="text-gray-900">Commits Only</option>
                                <option value="files" className="text-gray-900">Files Only</option>
                            </select>

                            {/* Stats */}
                            {graphData.stats && (
                                <div className="flex gap-2 flex-wrap">
                                    <span className="px-2 py-1 text-xs rounded-full bg-white/20">{graphData.stats.people} people</span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-white/20">{graphData.stats.modules} modules</span>
                                    {graphData.stats.commits && (
                                        <span className="px-2 py-1 text-xs rounded-full bg-white/20">{graphData.stats.commits} commits</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Graph Container */}
                <div className="bg-gray-50 dark:bg-slate-800">
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
                                    const fontSize = 10 / globalScale;
                                    const size = node.importance ? 5 * Math.sqrt(node.importance) : 5;

                                    ctx.font = `bold ${fontSize}px Sans-Serif`;
                                    const textWidth = ctx.measureText(label).width;
                                    const bckgDimensions = [textWidth + fontSize * 0.6, fontSize + fontSize * 0.4];

                                    ctx.fillStyle = getNodeColor(node);
                                    ctx.beginPath();
                                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                                    ctx.fill();

                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                                    ctx.lineWidth = 1;
                                    const rectX = node.x - bckgDimensions[0] / 2;
                                    const rectY = node.y + size + 5;
                                    ctx.fillRect(rectX, rectY, bckgDimensions[0], bckgDimensions[1]);
                                    ctx.strokeRect(rectX, rectY, bckgDimensions[0], bckgDimensions[1]);

                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillStyle = '#000000';
                                    ctx.fillText(label, node.x, rectY + bckgDimensions[1] / 2);
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: '600px', position: 'relative', overflow: 'hidden' }}>
                            <KnowledgeGraph3D
                                graphData={filteredData || graphData}
                                onNodeClick={handleNodeClick}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Legend */}
                <div className="p-4 bg-gray-100 dark:bg-slate-700/50">
                    <div className="flex flex-wrap justify-center gap-4 mb-2">
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#4CAF50]"></span>
                            People
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#2196F3]"></span>
                            Modules
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#FF9800]"></span>
                            Decisions
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#9C27B0]"></span>
                            Commits
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#00BCD4]"></span>
                            Files
                        </span>
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {viewMode === '3d'
                            ? 'Drag to rotate • Scroll to zoom • Right-click to pan'
                            : 'Click nodes to view details • Drag to pan • Scroll to zoom'}
                    </p>
                </div>
            </div>

            {/* Node Details Modal */}
            {showNodeDetails && selectedNode && (
                <div
                    className="modal-backdrop"
                    onClick={() => setShowNodeDetails(false)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-primary text-white p-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Node Details</h3>
                            <button
                                onClick={() => setShowNodeDetails(false)}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{selectedNode.label}</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="mb-2">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Type:</span>{' '}
                                        <span className="badge-secondary">{selectedNode.type}</span>
                                    </p>
                                    <p className="mb-2">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Connections:</span>{' '}
                                        <span className="text-gray-800 dark:text-gray-200">{selectedNode.connections || 0}</span>
                                    </p>
                                    {selectedNode.importance && (
                                        <p className="mb-2">
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Importance:</span>{' '}
                                            <span className="text-gray-800 dark:text-gray-200">{selectedNode.importance.toFixed(2)}</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    {selectedNode.commits && (
                                        <p className="mb-2">
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Commits:</span>{' '}
                                            <span className="text-gray-800 dark:text-gray-200">{selectedNode.commits}</span>
                                        </p>
                                    )}
                                    {selectedNode.files && (
                                        <p className="mb-2">
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Files:</span>{' '}
                                            <span className="text-gray-800 dark:text-gray-200">{selectedNode.files}</span>
                                        </p>
                                    )}
                                    {selectedNode.date && (
                                        <p className="mb-2">
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Date:</span>{' '}
                                            <span className="text-gray-800 dark:text-gray-200">{selectedNode.date}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            {selectedNode.message && (
                                <div className="mt-4">
                                    <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Message:</p>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedNode.message}</p>
                                </div>
                            )}
                            {selectedNode.path && (
                                <div className="mt-4">
                                    <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Path:</p>
                                    <code className="block bg-gray-100 dark:bg-slate-700 p-2 rounded text-sm">
                                        {selectedNode.path}
                                    </code>
                                </div>
                            )}
                            {selectedNode.url && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => window.open(selectedNode.url, '_blank')}
                                        className="btn-primary"
                                    >
                                        View on GitHub →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default KnowledgeGraph;
