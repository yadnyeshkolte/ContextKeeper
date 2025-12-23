import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
// @ts-ignore
import SpriteText from 'three-spritetext';

// Define types for the graph data
interface GraphNode {
    id: string;
    group: number;
    label: string;
    type?: string;
    url?: string;
    importance?: number;
    connections?: number;
    x?: number;
    y?: number;
    z?: number;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    value: number;
    type?: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

interface KnowledgeGraph3DProps {
    graphData: GraphData;
    onNodeClick?: (node: GraphNode) => void;
}

const KnowledgeGraph3D: React.FC<KnowledgeGraph3DProps> = ({ graphData, onNodeClick }) => {
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Track container dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({ width: width || 800, height: height || 600 });
            }
        };

        updateDimensions();

        // Use ResizeObserver for better performance
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        window.addEventListener('resize', updateDimensions);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateDimensions);
        };
    }, []);

    useEffect(() => {
        // Camera positioning
        if (fgRef.current) {
            const fg = fgRef.current;

            // Set initial camera position looking at center
            fg.cameraPosition({ x: 0, y: 0, z: 300 });

            // Add ambient lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            fg.scene().add(ambientLight);

            // Add directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(100, 100, 100);
            fg.scene().add(directionalLight);
        }
    }, [graphData]); // Re-run when graphData changes to re-center if needed

    // Color mapping for different node types
    const getNodeColor = (node: GraphNode): string => {
        switch (node.group) {
            case 1: return '#4CAF50'; // People - Green
            case 2: return '#2196F3'; // Modules - Blue
            case 3: return '#FF9800'; // Decisions - Orange
            case 4: return '#9C27B0'; // Commits - Purple
            case 5: return '#00BCD4'; // Files - Cyan
            default: return '#9E9E9E'; // Default - Gray
        }
    };

    // Node size based on importance
    const getNodeSize = (node: GraphNode): number => {
        const baseSize = 4;
        const importance = node.importance || 1;
        return baseSize * Math.sqrt(importance);
    };

    // Custom node rendering with 3D spheres and text labels
    const nodeThreeObject = (node: GraphNode) => {
        const size = getNodeSize(node);
        const color = getNodeColor(node);
        const group = new THREE.Group();

        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });

        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);

        // Add glow effect for important nodes
        if (node.importance && node.importance > 2) {
            const glowGeometry = new THREE.SphereGeometry(size * 1.3, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            sphere.add(glow);
        }

        // Add text sprite
        const sprite = new SpriteText(node.label);
        sprite.color = '#333333'; // Dark colored text for light background
        sprite.textHeight = 4;
        sprite.position.y = size + 4; // Position above the node
        group.add(sprite);

        return group;
    };

    // Custom link rendering
    const linkColor = (link: GraphLink): string => {
        // Color by relationship type
        const type = typeof link === 'object' && 'type' in link ? link.type : undefined;
        switch (type) {
            case 'authored': return '#9C27B0';
            case 'contributed': return '#00BCD4';
            case 'modified': return '#4CAF50';
            case 'uses': return '#2196F3';
            case 'decided': return '#FF9800';
            default: return '#999999';
        }
    };

    const linkWidth = (link: GraphLink): number => {
        const value = typeof link === 'object' && 'value' in link ? link.value : 1;
        return Math.max(0.5, Math.min(3, value / 2));
    };

    // Handle node click
    const handleNodeClick = (node: any) => {
        if (onNodeClick) {
            onNodeClick(node);
        }
        if (node.url) {
            window.open(node.url, '_blank');
        }
    };

    // Node label (kept as fallback/hover text)
    const nodeLabel = (node: GraphNode): string => {
        let label = node.label || node.id;
        if (node.connections) {
            label += `\n${node.connections} connections`;
        }
        if (node.type) {
            label += `\nType: ${node.type}`;
        }
        return label;
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <ForceGraph3D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeLabel={nodeLabel}
                nodeThreeObject={nodeThreeObject}
                nodeColor={getNodeColor}
                linkColor={linkColor}
                linkWidth={linkWidth}
                linkOpacity={0.6}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.005}
                onNodeClick={handleNodeClick}
                enableNodeDrag={true}
                enableNavigationControls={true}
                showNavInfo={false}
                backgroundColor="#fafafa"
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                warmupTicks={100}
                cooldownTicks={200}
            />
        </div>
    );
};

export default KnowledgeGraph3D;

