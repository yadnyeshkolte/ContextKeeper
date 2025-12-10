import React, { useEffect, useRef } from 'react';

// Define types for the graph data
interface GraphNode {
    id: string;
    group: number;
    label: string;
}

interface GraphLink {
    source: string;
    target: string;
    value: number;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

const KnowledgeGraph: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // In a real app, use react-force-graph or D3
        // For now we just render a placeholder or simple canvas
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '<h3>Knowledge Graph Visualization Placeholder</h3><p>Graph node rendering would happen here using D3 or react-force-graph.</p>';

        fetch('http://localhost:3000/api/knowledge-graph')
            .then(res => res.json())
            .then((data: GraphData) => {
                const pre = document.createElement('pre');
                pre.style.textAlign = 'left';
                pre.style.backgroundColor = '#f4f4f4';
                pre.style.padding = '10px';
                pre.innerText = JSON.stringify(data, null, 2);
                container.appendChild(pre);
            })
            .catch(err => console.error(err));

    }, []);

    return (
        <div className="knowledge-graph" style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
            <h2>Knowledge Graph</h2>
            <div ref={containerRef} style={{ minHeight: '300px' }}>Loading Graph...</div>
        </div>
    );
};

export default KnowledgeGraph;
