import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ComparisonEdge, ComparisonNode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CytoscapeOverlapNetworkProps {
  edges: ComparisonEdge[];
  nodes: ComparisonNode[];
}

export const CytoscapeOverlapNetwork: React.FC<CytoscapeOverlapNetworkProps> = ({
  edges,
  nodes,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { theme } = useTheme();
  const [hoveredEdge, setHoveredEdge] = useState<{
    label: string;
    status: string;
    signA: number;
    signB: number;
    signFlip: boolean;
  } | null>(null);

  // Compute edge statistics for legend
  const sharedCount = edges.filter((e) => e.status === 'both').length;
  const onlyACount = edges.filter((e) => e.status === 'A_only').length;
  const onlyBCount = edges.filter((e) => e.status === 'B_only').length;
  const signFlipCount = edges.filter((e) => e.sign_flip).length;

  useEffect(() => {
    if (!containerRef.current) return;

    const elements: cytoscape.ElementDefinition[] = [];

    // Nodes
    nodes.forEach((n) => {
      elements.push({
        group: 'nodes',
        data: {
          id: `n${n.node}`,
          nodeNum: n.node,
          label: n.label,
          degreeA: n.degree_A,
          degreeB: n.degree_B,
          isolatedA: n.isolated_A,
          isolatedB: n.isolated_B,
        },
      });
    });

    // Edges
    edges.forEach((e, idx) => {
      // Determine sign style: if both, check sign_A or if sign_flip; if A only sign_A; if B only sign_B
      const isPos = e.status === 'both' ? (e.sign_A > 0 && e.sign_B > 0) : (e.status === 'A_only' ? e.sign_A > 0 : e.sign_B > 0);

      elements.push({
        group: 'edges',
        data: {
          id: `e${idx}`,
          source: `n${e.i}`,
          target: `n${e.j}`,
          status: e.status, // 'both' | 'A_only' | 'B_only'
          signFlip: e.sign_flip ? 'yes' : 'no',
          signStyle: isPos ? 'solid' : 'dashed',
          edgeLabel: `${e.label_i} — ${e.label_j}`,
          signA: e.sign_A,
          signB: e.sign_B,
        },
      });
    });

    const isDark = theme === 'dark';
    const textCol = isDark ? '#cbd5e1' : '#334155';
    const nodeBg = isDark ? '#334155' : '#cbd5e1';

    // Edge colors matching notebook:
    // grey = in both (#64748b or #94a3b8)
    // orange = only in A (#ea580c)
    // purple = only in B (#7c3aed)
    const colorBoth = isDark ? '#94a3b8' : '#64748b';
    const colorAOnly = '#ea580c';
    const colorBOnly = '#7c3aed';

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
            'width': 16,
            'height': 16,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.2,
            'curve-style': 'straight',
            'opacity': 0.65,
          },
        },
        {
          selector: 'edge[status = "both"]',
          style: {
            'line-color': colorBoth,
          },
        },
        {
          selector: 'edge[status = "A_only"]',
          style: {
            'line-color': colorAOnly,
          },
        },
        {
          selector: 'edge[status = "B_only"]',
          style: {
            'line-color': colorBOnly,
          },
        },
        {
          selector: 'edge[signStyle = "dashed"]',
          style: {
            'line-style': 'dashed',
          },
        },
        {
          selector: 'edge[signFlip = "yes"]',
          style: {
            'width': 3.5,
            'opacity': 0.95,
            'line-color': '#eab308', // gold/yellow for sign flips
            'line-style': 'solid',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        componentSpacing: 50,
        idealEdgeLength: () => 60,
        numIter: 400,
      },
    });

    cy.on('mouseover', 'edge', (evt) => {
      const d = evt.target.data();
      setHoveredEdge({
        label: d.edgeLabel,
        status: d.status === 'both' ? 'Shared in Both' : (d.status === 'A_only' ? 'Only in Subject A' : 'Only in Subject B'),
        signA: d.signA,
        signB: d.signB,
        signFlip: d.signFlip === 'yes',
      });
    });

    cy.on('mouseout', 'edge', () => {
      setHoveredEdge(null);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [edges, nodes, theme]);

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
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 3, backgroundColor: theme === 'dark' ? '#94a3b8' : '#64748b', display: 'inline-block' }}></span>
            <span>Shared in Both ({sharedCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 3, backgroundColor: '#ea580c', display: 'inline-block' }}></span>
            <span>Only in A ({onlyACount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 3, backgroundColor: '#7c3aed', display: 'inline-block' }}></span>
            <span>Only in B ({onlyBCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 4, backgroundColor: '#eab308', display: 'inline-block' }}></span>
            <span><strong>Sign Flips ({signFlipCount})</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ borderTop: '2px dashed var(--text-muted)', width: 14, display: 'inline-block' }}></span>
            <span>Dashed = Negative Sign</span>
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

      {hoveredEdge && (
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
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Info size={14} style={{ color: 'var(--accent-blue)' }} />
            {hoveredEdge.label}
          </div>
          <div><strong>Membership:</strong> {hoveredEdge.status}</div>
          <div><strong>Sign A:</strong> {hoveredEdge.signA > 0 ? '+1 (positive)' : '-1 (negative)'}</div>
          <div><strong>Sign B:</strong> {hoveredEdge.signB > 0 ? '+1 (positive)' : '-1 (negative)'}</div>
          {hoveredEdge.signFlip && (
            <div style={{ color: '#eab308', fontWeight: 700 }}>⚠️ Sign Inverted Between Subjects!</div>
          )}
        </div>
      )}
    </div>
  );
};
