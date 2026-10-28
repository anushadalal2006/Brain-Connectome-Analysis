import React, { useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { CytoscapeNetwork } from '../components/CytoscapeNetwork';
import { DataTable, Column } from '../components/DataTable';
import {
  ComparisonEdge,
  NodeMetric,
  GlobalMetric,
  TraversalSummary,
  ShortestPathSummary,
  ConfigData,
} from '../types';
import { useJSON, PENDING } from '../data';
import { ChartCard } from '../components/ChartCard';
import { NodeHistogram, ClusteringScatter, SignCountBars, ComponentBars, BellmanFordBars, ABLegend } from '../components/SingleNetworkCharts';
import { KaTeX } from '../components/KaTeX';
import { Network, Activity, AlertTriangle, Layers } from 'lucide-react';

export const SingleNetworksPage: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<'A' | 'B'>('A');
  const [sortBy, setSortBy] = useState<'node' | 'degree'>('node');
  const edgesData = useJSON<ComparisonEdge[]>('comparison_edges_d015.json');
  const nodeData = useJSON<NodeMetric[]>('metrics_nodes.json');
  const globalData = useJSON<GlobalMetric[]>('metrics_global_d015.json');
  const travData = useJSON<TraversalSummary[]>('traversal_summary.json');
  const spData = useJSON<ShortestPathSummary[]>('shortest_path_summary.json');
  const cfg = useJSON<ConfigData>('config.json');
  const edges = edgesData ?? [];
  const nodeMetrics = nodeData ?? [];
  const globalMetrics = globalData ?? [];
  const traversal = travData ?? [];
  const shortestPaths = spData ?? [];
  const loading = !edgesData || !nodeData || !globalData;
  const subA = cfg?.subjects.A ?? PENDING;
  const subB = cfg?.subjects.B ?? PENDING;
  const density = cfg ? cfg.config.density.toFixed(2) : PENDING;

  const gm = (metric: string, who: 'A' | 'B') => {
    const row = globalMetrics.find((m) => m.metric === metric);
    return row ? Math.round(row[who]) : PENDING;
  };
  const edgeCount = gm('n_edges', 'A');
  const lccA = gm('largest_component_size', 'A');
  const lccB = gm('largest_component_size', 'B');
  const isoA = gm('n_isolated', 'A');
  const isoB = gm('n_isolated', 'B');

  const bfsA = traversal.find((t) => String(t.subject) === String(subA) && t.algorithm === 'BFS');
  const bfsB = traversal.find((t) => String(t.subject) === String(subB) && t.algorithm === 'BFS');
  const bfsLevelsA = bfsA?.bfs_levels ?? PENDING;
  const bfsLevelsB = bfsB?.bfs_levels ?? PENDING;
  const reachableA = bfsA?.reachable ?? PENDING;
  const reachableB = bfsB?.reachable ?? PENDING;
  const sourceNode = bfsA ? bfsA.source : PENDING;
  const sourceLabel = bfsA?.source_label ?? PENDING;

  const spA = shortestPaths.find((s) => String(s.subject) === String(subA));
  const spB = shortestPaths.find((s) => String(s.subject) === String(subB));
  const undefA = spA?.undefined ?? PENDING;
  const undefB = spB?.undefined ?? PENDING;
  const finiteCount = spA && spB ? spA.finite + spB.finite : null;

  const isolatedA = nodeMetrics.filter((n) => n.isolated_A).map((n) => n.label);
  const isolatedB = nodeMetrics.filter((n) => n.isolated_B).map((n) => n.label);
  const isolatedBoth = new Set(isolatedA.filter((l) => isolatedB.includes(l)));
  const subjectNames: Record<string, string> = cfg ? { [cfg.subjects.A]: `A (${cfg.subjects.A})`, [cfg.subjects.B]: `B (${cfg.subjects.B})` } : {};
  const meanDeg = (who: 'A' | 'B') => (nodeMetrics.length ? (nodeMetrics.reduce((acc, n) => acc + n[`degree_${who}`], 0) / nodeMetrics.length).toFixed(2) : PENDING);
  const zeroDeg = (who: 'A' | 'B') => nodeMetrics.filter((n) => n[`degree_${who}`] === 0).length;

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
    { key: 'source', header: 'Source Node', render: (r) => <span className="mono">Node {r.source} ({sourceLabel})</span> },
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
          <span className="badge badge-blue mono">d = {density} ({edgeCount} edges)</span>
        </div>
        <h1 className="page-title">Single Networks: Subject A & Subject B</h1>
        <p className="page-subtitle">
          Interactive network topologies, global graph metrics, BFS/DFS tree reachability from source {sourceLabel}, and Bellman–Ford negative-cycle analysis.
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
          Interactive Network Topology (Subject {activeSubject} at d = {density})
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Nodes sized by degree (connected nodes grey, isolated nodes pale; node colour carries no sign). Red lines denote positive edges; blue lines denote negative edges. Isolated nodes are grouped in a dedicated row beneath the connected components. Hover on any node to view degree, signed strength, and clustering.
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
          Graph Metrics Summary (d = {density}, m = {edgeCount} edges)
        </h2>
        {loading ? (
          <div>Loading graph metrics...</div>
        ) : (
          <DataTable data={globalMetrics} columns={metricColumns} pageSize={15} />
        )}
      </section>

      {/* Node-level distributions */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">Node-level structure of A and B (d = {density})</h2>
        <div className="grid-2">
          <ChartCard
            title={`B has more nodes with no edges (${nodeMetrics.length ? zeroDeg('B') : PENDING} vs ${nodeMetrics.length ? zeroDeg('A') : PENDING}); mean degree is the same (${meanDeg('A')})`}
            caption={<>Degree = number of kept edges at the node. Both graphs have the same number of edges, so the mean degree is equal; what differs is how the edges are spread. Same bins for A and B; overlapping bars appear darker.</>}
            sources={['metrics_nodes.json']}
            legend={<ABLegend subA={String(subA)} subB={String(subB)} />}
          >
            {nodeData ? <NodeHistogram nodes={nodeMetrics} field="degree" binSize={2} xTitle="Degree" subA={String(subA)} subB={String(subB)} /> : <div style={{ height: 300 }}>Loading chart…</div>}
          </ChartCard>
          <ChartCard
            title={`Signed node strength: highest node ${nodeMetrics.length ? Math.max(...nodeMetrics.map((n) => n.strength_A)).toFixed(0) : PENDING} in A vs ${nodeMetrics.length ? Math.max(...nodeMetrics.map((n) => n.strength_B)).toFixed(0) : PENDING} in B`}
            caption={<>Signed strength = sum of the signed weights of a node&apos;s kept edges (positive and negative edges partly cancel). Notice the long right tail in A; strength is in raw r-to-Z units, so part of this is the per-subject scale difference.</>}
            sources={['metrics_nodes.json']}
            legend={<ABLegend subA={String(subA)} subB={String(subB)} />}
          >
            {nodeData ? <NodeHistogram nodes={nodeMetrics} field="strength" binSize={20} xTitle="Signed node strength" subA={String(subA)} subB={String(subB)} /> : <div style={{ height: 300 }}>Loading chart…</div>}
          </ChartCard>
        </div>

        <ChartCard
          title="Clustering against degree: clustering varies most among low-degree nodes and narrows as degree grows"
          caption={<>Each point is one network node. Clustering is binary (edge weights ignored): the share of a node&apos;s neighbour pairs that are themselves connected. Nodes with degree 0 or 1 have clustering 0 by definition. Hover for the node label.</>}
          sources={['metrics_nodes.json']}
          legend={<ABLegend subA={String(subA)} subB={String(subB)} />}
          minWidth={420}
        >
          {nodeData ? <ClusteringScatter nodes={nodeMetrics} subA={String(subA)} subB={String(subB)} /> : <div style={{ height: 340 }}>Loading chart…</div>}
        </ChartCard>

        <ChartCard
          title={`Positive and negative edges per node, Subject ${activeSubject}`}
          caption={<>Stacked count of kept positive (red) and negative (blue) edges at each node. Use the subject switch at the top of the page and the sort control. Nodes with no bar are isolated.</>}
          sources={['metrics_nodes.json']}
          minWidth={640}
          actions={
            <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Sort by
              <select className="select-input" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'node' | 'degree')}>
                <option value="node">node number</option>
                <option value="degree">degree (high first)</option>
              </select>
            </label>
          }
        >
          {nodeData ? <SignCountBars nodes={nodeMetrics} who={activeSubject} sortBy={sortBy} /> : <div style={{ height: 330 }}>Loading chart…</div>}
        </ChartCard>

        <div className="grid-2">
          <ChartCard
            title={`Largest component and isolated nodes: ${lccA} + ${isoA} in A, ${lccB} + ${isoB} in B`}
            caption={<>Computed from each node&apos;s component number. A middle segment would appear if any component other than the largest had two or more nodes.</>}
            sources={['metrics_nodes.json']}
          >
            {nodeData ? <ComponentBars nodes={nodeMetrics} subA={String(subA)} subB={String(subB)} /> : <div style={{ height: 180 }}>Loading chart…</div>}
          </ChartCard>
          <div className="card chart-card">
            <h3 className="chart-card-title">Isolated nodes ({isolatedA.length} in A, {isolatedB.length} in B, {isolatedBoth.size} in both)</h3>
            <p className="chart-caption" style={{ marginTop: 0 }}>Network nodes with no kept edge at d = {density}. Outlined chips are isolated in both subjects.</p>
            <div className="chip-block">
              <div className="chip-label">A ({subA})</div>
              <div className="chips">
                {isolatedA.map((l) => <span key={l} className={`chip ${isolatedBoth.has(l) ? 'chip-both' : ''}`}>{l}</span>)}
              </div>
            </div>
            <div className="chip-block">
              <div className="chip-label">B ({subB})</div>
              <div className="chips">
                {isolatedB.map((l) => <span key={l} className={`chip ${isolatedBoth.has(l) ? 'chip-both' : ''}`}>{l}</span>)}
              </div>
            </div>
            <p className="chart-source">Data source: <code>metrics_nodes.json</code></p>
          </div>
        </div>
      </section>

      {/* Traversal & Shortest Path Summary */}
      <section className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <h2 className="card-title">
            <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
            Traversal (BFS / DFS from {sourceLabel})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Unweighted traversal seeded at source node {sourceNode} ({sourceLabel}), the highest-degree node of A shared by both largest components. Subject A's BFS tree spans {reachableA} nodes across {bfsLevelsA} levels, whereas Subject B's reaches {reachableB} nodes across {bfsLevelsB} levels.
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
          <div style={{ marginTop: '1rem' }}>
            {spData && cfg ? <BellmanFordBars rows={shortestPaths} names={subjectNames} /> : null}
            <p className="chart-source">Every node reachable from the source has an undefined distance; the rest are unreachable. Data source: <code>shortest_path_summary.json</code></p>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Caveat:</strong> Shortest paths to {undefA} nodes in Subject A and {undefB} nodes in Subject B are undefined. {finiteCount === null ? '' : finiteCount === 0 ? 'No finite shortest paths exist.' : `${finiteCount} finite shortest paths exist.`}
          </div>
        </div>
      </section>

      {/* Static Figures (Matrices, Traversal levels, Bellman-Ford status) */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Exported Notebook Figures
        </h2>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/A_network.png`} alt="Subject A Publication Network Visualization" />
            <div className="figure-caption">
              <strong>Figure A3:</strong> Static network layout for Subject A ({subA}) at d = {density}.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/B_network.png`} alt="Subject B Publication Network Visualization" />
            <div className="figure-caption">
              <strong>Figure B3:</strong> Static network layout for Subject B ({subB}) at d = {density}.
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/A_bfs_levels.png`} alt="Subject A BFS Levels" />
            <div className="figure-caption">
              <strong>Figure A4:</strong> BFS expansion tree from node {sourceNode} ({sourceLabel}) spanning {bfsLevelsA} levels.
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

