import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ComparisonEdge, NodeMetric } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CytoscapeNetworkProps {
  subject: 'A' | 'B';
  edges: ComparisonEdge[];
  nodeMetrics: NodeMetric[];
}

export const CytoscapeNetwork: React.FC<CytoscapeNetworkProps> = ({
  subject,
  edges,
  nodeMetrics,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { theme } = useTheme();
  const [hoveredNode, setHoveredNode] = useState<{
    label: string;
    node: number;
    degree: number;
    strength: number;
    clustering: number;
    inLargest: boolean;
    isolated: boolean;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter edges for subject
    const subjectEdges = edges.filter((e) => (subject === 'A' ? e.in_A : e.in_B));
    const metricMap = new Map<number, NodeMetric>();
    nodeMetrics.forEach((m) => metricMap.set(m.node, m));

    // Construct elements
    const elements: cytoscape.ElementDefinition[] = [];

    // Isolated nodes layout counter
    let isolatedCounter = 0;

    // Nodes
    const nodeCount = nodeMetrics.length > 0 ? nodeMetrics.length : 100;
    for (let i = 0; i < nodeCount; i++) {
      const metric = metricMap.get(i);
      const degree = subject === 'A' ? (metric?.degree_A ?? 0) : (metric?.degree_B ?? 0);
      const strength = subject === 'A' ? (metric?.strength_A ?? 0) : (metric?.strength_B ?? 0);
      const clustering = subject === 'A' ? (metric?.clustering_A ?? 0) : (metric?.clustering_B ?? 0);
      const isolated = subject === 'A' ? (metric?.isolated_A ?? false) : (metric?.isolated_B ?? false);
      const inLargest = subject === 'A' ? (metric?.in_largest_A ?? false) : (metric?.in_largest_B ?? false);
      const label = metric?.label || `IC${String(i + 1).padStart(3, '0')}`;

      elements.push({
        group: 'nodes',
        data: {
          id: `n${i}`,
          nodeNum: i,
          label,
          degree,
          strength,
          clustering,
          isolated: isolated ? 'yes' : 'no',
          inLargest: inLargest ? 'yes' : 'no',
        },
      });

      if (isolated) {
        isolatedCounter++;
      }
    }

    // Edges
    subjectEdges.forEach((e, idx) => {
      const sign = subject === 'A' ? e.sign_A : e.sign_B;
      elements.push({
        group: 'edges',
        data: {
          id: `e${idx}`,
          source: `n${e.i}`,
          target: `n${e.j}`,
          sign: sign > 0 ? 'pos' : 'neg',
        },
      });
    });

    // Dark/light styling parameters
    const isDark = theme === 'dark';
    const nodeBg = isDark ? '#38bdf8' : '#0284c7';
    const nodeBorder = isDark ? '#0284c7' : '#0369a1';
    const isolatedNodeBg = isDark ? '#475569' : '#94a3b8';
    const textCol = isDark ? '#f1f5f9' : '#0f172a';

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '8px',
            'font-family': 'JetBrains Mono, monospace',
            'color': textCol,
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': nodeBg,
            'border-width': 1.5,
            'border-color': nodeBorder,
            'width': 'mapData(degree, 0, 35, 14, 30)',
            'height': 'mapData(degree, 0, 35, 14, 30)',
            'transition-property': 'background-color, border-width, border-color, width, height',
            'transition-duration': 0.2,
          },
        },
        {
          selector: 'node[isolated = "yes"]',
          style: {
            'background-color': isolatedNodeBg,
            'border-color': isDark ? '#334155' : '#cbd5e1',
            'width': 12,
            'height': 12,
            'font-size': '7px',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#f59e0b',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.2,
            'curve-style': 'straight',
            'opacity': 0.6,
          },
        },
        {
          selector: 'edge[sign = "pos"]',
          style: {
            'line-color': '#dc2626', // accessible red
          },
        },
        {
          selector: 'edge[sign = "neg"]',
          style: {
            'line-color': '#2563eb', // accessible blue
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        componentSpacing: 60,
        nodeOverlap: 20,
        idealEdgeLength: () => 50,
        edgeElasticity: () => 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 400,
      },
    });

    // Custom layout post-processing: separate isolated nodes into a neat bottom row
    let isoIdx = 0;
    const bb = cy.nodes('[isolated = "no"]').boundingBox({});
    const startX = bb.x1;
    const startY = bb.y2 + 60;
    const spacingX = Math.max(30, (bb.w || 600) / Math.max(isolatedCounter, 1));

    cy.nodes('[isolated = "yes"]').forEach((node) => {
      node.position({
        x: startX + isoIdx * spacingX,
        y: startY,
      });
      isoIdx++;
    });

    cy.fit(undefined, 25);

    // Event listeners for hover card
    cy.on('mouseover', 'node', (evt) => {
      const d = evt.target.data();
      setHoveredNode({
        label: d.label,
        node: d.nodeNum,
        degree: d.degree,
        strength: d.strength,
        clustering: d.clustering,
        inLargest: d.inLargest === 'yes',
        isolated: d.isolated === 'yes',
      });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [subject, edges, nodeMetrics, theme]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend & Tool Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 12, height: 2.5, backgroundColor: '#dc2626', display: 'inline-block' }}></span>
            <span>Positive Edge (<span className="mono">w &gt; 0</span>)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 12, height: 2.5, backgroundColor: '#2563eb', display: 'inline-block' }}></span>
            <span>Negative Edge (<span className="mono">w &lt; 0</span>)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme === 'dark' ? '#475569' : '#94a3b8', display: 'inline-block' }}></span>
            <span>Isolated Node</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="btn"
            style={{ padding: '0.25rem 0.5rem' }}
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="btn"
            style={{ padding: '0.25rem 0.5rem' }}
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="btn"
            style={{ padding: '0.25rem 0.5rem' }}
            onClick={() => cyRef.current?.fit(undefined, 25)}
            title="Reset View"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Cytoscape Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '520px',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--bg-secondary)',
        }}
      />

      {/* Node Hover Tooltip Card */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            zIndex: 10,
            pointerEvents: 'none',
            maxWidth: '220px',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Info size={14} style={{ color: 'var(--accent-blue)' }} />
            {hoveredNode.label} (Node #{hoveredNode.node})
          </div>
          <div><strong>Degree:</strong> {hoveredNode.degree}</div>
          <div><strong>Signed Strength:</strong> {hoveredNode.strength.toFixed(2)}</div>
          <div><strong>Clustering:</strong> {hoveredNode.clustering.toFixed(4)}</div>
          <div><strong>Status:</strong> {hoveredNode.isolated ? 'Isolated' : (hoveredNode.inLargest ? 'Largest Component' : 'Small Component')}</div>
        </div>
      )}
    </div>
  );
};
