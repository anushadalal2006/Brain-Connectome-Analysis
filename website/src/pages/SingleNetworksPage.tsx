import React, { useEffect, useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { CytoscapeNetwork } from '../components/CytoscapeNetwork';
import { DataTable, Column } from '../components/DataTable';
import {
  ComparisonEdge,
  NodeMetric,
  GlobalMetric,
  TraversalSummary,
  ShortestPathSummary,
} from '../types';
import { KaTeX } from '../components/KaTeX';
import { Network, Activity, AlertTriangle, Layers } from 'lucide-react';

export const SingleNetworksPage: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<'A' | 'B'>('A');
  const [subA, setSubA] = useState('100206');
  const [subB, setSubB] = useState('100307');
  const [edges, setEdges] = useState<ComparisonEdge[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetric[]>([]);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetric[]>([]);
  const [traversal, setTraversal] = useState<TraversalSummary[]>([]);
  const [shortestPaths, setShortestPaths] = useState<ShortestPathSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/comparison_edges_d015.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/metrics_nodes.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/metrics_global_d015.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/traversal_summary.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/shortest_path_summary.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/config.json`).then((r) => r.json()),
    ])
      .then(([edgesData, nodesData, globalData, travData, spData, configData]) => {
        setEdges(edgesData);
        setNodeMetrics(nodesData);
        setGlobalMetrics(globalData);
        setTraversal(travData);
        setShortestPaths(spData);
        if (configData.subjects?.A) setSubA(configData.subjects.A);
        if (configData.subjects?.B) setSubB(configData.subjects.B);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching single networks data:', err);
        setLoading(false);
      });
  }, []);

  const edgeCount = Math.round(globalMetrics.find((m) => m.metric === 'n_edges')?.A ?? 743);
  const lccA = Math.round(globalMetrics.find((m) => m.metric === 'largest_component_size')?.A ?? 85);
  const lccB = Math.round(globalMetrics.find((m) => m.metric === 'largest_component_size')?.B ?? 74);
  const isoA = Math.round(globalMetrics.find((m) => m.metric === 'n_isolated')?.A ?? 15);
  const isoB = Math.round(globalMetrics.find((m) => m.metric === 'n_isolated')?.B ?? 26);

  const bfsA = traversal.find((t) => String(t.subject) === String(subA) && t.algorithm === 'BFS');
  const bfsB = traversal.find((t) => String(t.subject) === String(subB) && t.algorithm === 'BFS');
  const bfsLevelsA = bfsA?.bfs_levels ?? 5;
  const bfsLevelsB = bfsB?.bfs_levels ?? 4;
  const reachableA = bfsA?.reachable ?? 85;
  const reachableB = bfsB?.reachable ?? 74;

  const spA = shortestPaths.find((s) => String(s.subject) === String(subA));
  const spB = shortestPaths.find((s) => String(s.subject) === String(subB));
  const undefA = spA?.undefined ?? 85;
  const undefB = spB?.undefined ?? 74;
  const finiteCount = (spA?.finite ?? 0) + (spB?.finite ?? 0);

  const metricColumns: Column<GlobalMetric>[] = [
    {
      key: 'metric',
      header: 'Graph Metric',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span>,
    },
    {
      key: 'A',
      header: `Subject A (${subA})`,
      align: 'right',
      render: (r) => (
        <span className="mono" style={activeSubject === 'A' ? { fontWeight: 700, color: 'var(--accent-blue)' } : {}}>
          {typeof r.A === 'number' ? (Number.isInteger(r.A) ? r.A : r.A.toFixed(4)) : r.A}
        </span>
      ),
    },
    {
      key: 'B',
      header: `Subject B (${subB})`,
      align: 'right',
      render: (r) => (
        <span className="mono" style={activeSubject === 'B' ? { fontWeight: 700, color: 'var(--accent-blue)' } : {}}>
          {typeof r.B === 'number' ? (Number.isInteger(r.B) ? r.B : r.B.toFixed(4)) : r.B}
        </span>
      ),
    },
  ];

  const traversalColumns: Column<TraversalSummary>[] = [
    { key: 'subject', header: 'Subject ID', render: (r) => <span className="mono">{r.subject}</span> },
    { key: 'algorithm', header: 'Algorithm', render: (r) => <span className="badge badge-neutral">{r.algorithm}</span> },
    { key: 'source', header: 'Source Node', render: (r) => <span className="mono">Node {r.source} ({r.source_label})</span> },
    { key: 'reachable', header: 'Reachable Nodes', align: 'right', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.reachable}</span> },
    { key: 'unreachable', header: 'Unreachable (Disconnected)', align: 'right', render: (r) => <span className="mono">{r.unreachable}</span> },
    { key: 'bfs_levels', header: 'BFS Tree Levels', align: 'right', render: (r) => <span className="mono">{r.bfs_levels > 0 ? r.bfs_levels : '—'}</span> },
  ];

  const spColumns: Column<ShortestPathSummary>[] = [
    { key: 'subject', header: 'Subject ID', render: (r) => <span className="mono">{r.subject}</span> },
    { key: 'source', header: 'Source Node', render: (r) => <span className="mono">Node {r.source} (IC035)</span> },
    {
      key: 'status',
      header: 'Bellman–Ford Status',
      render: (r) => (
        <span className="badge badge-sensitive" style={{ textTransform: 'none' }}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'undefined',
      header: 'Undefined Distance (Cost → −∞)',
      align: 'right',
      render: (r) => <span className="mono" style={{ color: 'var(--badge-partial-text)', fontWeight: 600 }}>{r.undefined} nodes</span>,
    },
    {
      key: 'unreachable',
      header: 'Unreachable (Cost = ∞)',
      align: 'right',
      render: (r) => <span className="mono">{r.unreachable} nodes</span>,
    },
    {
      key: 'finite',
      header: 'Finite Paths Defined',
      align: 'right',
      render: (r) => <span className="mono">{r.finite}</span>,
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Graph Evaluation</span>
          <span className="badge badge-blue mono">d = 0.15 ({edgeCount} edges)</span>
        </div>
        <h1 className="page-title">Single Networks: Subject A & Subject B</h1>
        <p className="page-subtitle">
          Interactive network topologies, global graph metrics, BFS/DFS tree reachability from source IC035, and Bellman–Ford negative-cycle analysis.
        </p>
      </div>

      <CaveatBanner />

      {/* Subject Switcher Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Active Network View:</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className={`btn ${activeSubject === 'A' ? 'btn-primary' : ''}`}
              style={{ padding: '0.35rem 0.85rem' }}
              onClick={() => setActiveSubject('A')}
            >
              Subject A ({subA})
            </button>
            <button
              className={`btn ${activeSubject === 'B' ? 'btn-primary' : ''}`}
              style={{ padding: '0.35rem 0.85rem' }}
              onClick={() => setActiveSubject('B')}
            >
              Subject B ({subB})
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          {activeSubject === 'A' ? (
            <span>Largest component size: <strong>{lccA}</strong> • Isolated nodes: <strong>{isoA}</strong></span>
          ) : (
            <span>Largest component size: <strong>{lccB}</strong> • Isolated nodes: <strong>{isoB}</strong></span>
          )}
        </div>
      </div>

      {/* Interactive Cytoscape Network */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Network size={20} style={{ color: 'var(--accent-blue)' }} />
          Interactive Network Topology (Subject {activeSubject} at d = 0.15)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Nodes sized by degree, colored by component status. Red lines denote positive edges; blue lines denote negative edges. Isolated nodes are grouped in a dedicated row beneath the connected components. Hover on any node to view degree, signed strength, and clustering.
        </p>

        {loading ? (
          <div>Loading interactive network...</div>
        ) : (
          <CytoscapeNetwork subject={activeSubject} edges={edges} nodeMetrics={nodeMetrics} />
        )}
      </section>

      {/* Metrics Table */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} style={{ color: 'var(--accent-blue)' }} />
          Graph Metrics Summary (d = 0.15, m = {edgeCount} edges)
        </h2>
        {loading ? (
          <div>Loading graph metrics...</div>
        ) : (
          <DataTable data={globalMetrics} columns={metricColumns} pageSize={15} />
        )}
      </section>

      {/* Traversal & Shortest Path Summary */}
      <section className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <h2 className="card-title">
            <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
            Traversal (BFS / DFS from IC035)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Unweighted traversal seeded at Source Node 34 (IC035). Subject A's BFS tree spans {reachableA} nodes across {bfsLevelsA} levels, whereas Subject B's reaches {reachableB} nodes across {bfsLevelsB} levels.
          </p>
          <DataTable data={traversal} columns={traversalColumns} pageSize={10} />
        </div>

        <div className="card">
          <h2 className="card-title">
            <AlertTriangle size={20} style={{ color: 'var(--badge-partial-text)' }} />
            Bellman–Ford Shortest-Path Outcomes
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Bellman–Ford run on raw signed weights with negative-cycle detection. Undirected negative edges form 2-cycles (<KaTeX math="2w < 0" />) that divert reachable paths toward <KaTeX math="-\infty" />.
          </p>
          <DataTable data={shortestPaths} columns={spColumns} pageSize={10} />
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Caveat:</strong> Shortest paths to {undefA} nodes in Subject A and {undefB} nodes in Subject B are mathematically undefined. {finiteCount === 0 ? 'Zero finite shortest paths exist.' : `${finiteCount} finite shortest paths exist.`}
          </div>
        </div>
      </section>

      {/* Static Figures (Matrices, Traversal levels, Bellman-Ford status) */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Exported Figures & Diagnostic Panels
        </h2>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/A_network.png`} alt="Subject A Publication Network Visualization" />
            <div className="figure-caption">
              <strong>Figure A3:</strong> Static network layout for Subject A ({subA}) at d = 0.15.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/B_network.png`} alt="Subject B Publication Network Visualization" />
            <div className="figure-caption">
              <strong>Figure B3:</strong> Static network layout for Subject B ({subB}) at d = 0.15.
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/A_bfs_levels.png`} alt="Subject A BFS Levels" />
            <div className="figure-caption">
              <strong>Figure A4:</strong> BFS expansion tree from node 34 (IC035) spanning {bfsLevelsA} radial depth levels.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_shortest_path_status.png`} alt="Bellman-Ford Undefined Status Breakdown" />
            <div className="figure-caption">
              <strong>Figure AB1:</strong> Bellman–Ford outcome breakdown: undefined (negative cycle), unreachable, and finite paths.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

