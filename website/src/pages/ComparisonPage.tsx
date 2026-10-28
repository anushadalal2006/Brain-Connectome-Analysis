import React, { useEffect, useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { CytoscapeOverlapNetwork } from '../components/CytoscapeOverlapNetwork';
import { DataTable, Column } from '../components/DataTable';
import { ComparisonGlobal, ComparisonNode, ComparisonEdge, GlobalStatistic } from '../types';
import { Share2, GitCompare, Activity } from 'lucide-react';
import { signedNum, signed } from '../utils/format';

export const ComparisonPage: React.FC = () => {
  const [globalDiffs, setGlobalDiffs] = useState<ComparisonGlobal[]>([]);
  const [nodeDiffs, setNodeDiffs] = useState<ComparisonNode[]>([]);
  const [edges, setEdges] = useState<ComparisonEdge[]>([]);
  const [stats, setStats] = useState<GlobalStatistic[]>([]);
  const [subA, setSubA] = useState('100206');
  const [subB, setSubB] = useState('100307');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/comparison_global_d015.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/comparison_nodes_d015.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/comparison_edges_d015.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/statistics_global.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/config.json`).then((r) => r.json()),
    ])
      .then(([globData, nodeData, edgeData, statsData, configData]) => {
        setGlobalDiffs(globData);
        setNodeDiffs(nodeData);
        setEdges(edgeData);
        setStats(statsData);
        if (configData.subjects?.A) setSubA(configData.subjects.A);
        if (configData.subjects?.B) setSubB(configData.subjects.B);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching comparison data:', err);
        setLoading(false);
      });
  }, []);

  const sharedCount = edges.filter((e) => e.status === 'both').length;
  const onlyACount = edges.filter((e) => e.status === 'A_only').length;
  const onlyBCount = edges.filter((e) => e.status === 'B_only').length;
  const signFlipCount = edges.filter((e) => e.sign_flip).length;
  const mCount = sharedCount + onlyACount > 0 ? sharedCount + onlyACount : 743;
  const totalUnion = sharedCount + onlyACount + onlyBCount;
  const sharedPct = mCount > 0 ? ((sharedCount / mCount) * 100).toFixed(1) : '47.8';
  const onlyAPct = mCount > 0 ? ((onlyACount / mCount) * 100).toFixed(1) : '52.2';
  const onlyBPct = mCount > 0 ? ((onlyBCount / mCount) * 100).toFixed(1) : '52.2';
  const jaccard = totalUnion > 0 ? (sharedCount / totalUnion).toFixed(3) : '0.314';

  const meanAbsRow = stats.find((s) => s.statistic === 'mean_abs');
  const meanAbsA = typeof meanAbsRow?.A === 'number' ? meanAbsRow.A.toFixed(4) : '6.3631';
  const meanAbsB = typeof meanAbsRow?.B === 'number' ? meanAbsRow.B.toFixed(4) : '5.2530';

  const globalColumns: Column<ComparisonGlobal>[] = [
    {
      key: 'metric',
      header: 'Metric',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span>,
    },
    {
      key: 'A',
      header: `Subject A (${subA})`,
      align: 'right',
      render: (r) => (
        <span className="mono">
          {typeof r.A === 'number' ? (Number.isInteger(r.A) ? r.A : r.A.toFixed(4)) : r.A}
        </span>
      ),
    },
    {
      key: 'B',
      header: `Subject B (${subB})`,
      align: 'right',
      render: (r) => (
        <span className="mono">
          {typeof r.B === 'number' ? (Number.isInteger(r.B) ? r.B : r.B.toFixed(4)) : r.B}
        </span>
      ),
    },
    {
      key: 'A_minus_B',
      header: 'Difference (A − B)',
      align: 'right',
      render: (r) => {
        const val = r.A_minus_B;
        return (
          <span className="mono" style={{ fontWeight: 700 }}>
            {signedNum(val)}
          </span>
        );
      },
    },
    {
      key: 'scale_dependent',
      header: 'Scale Dependent?',
      align: 'center',
      render: (r) =>
        r.scale_dependent ? (
          <span className="badge badge-partial">Yes (Scale Effect)</span>
        ) : (
          <span className="badge badge-neutral">No (Scale-Free)</span>
        ),
    },
  ];

  const nodeColumns: Column<ComparisonNode>[] = [
    {
      key: 'label',
      header: 'Node',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.label} (#{r.node})</span>,
    },
    {
      key: 'degree_A',
      header: 'Deg A',
      align: 'right',
      render: (r) => <span className="mono">{r.degree_A}</span>,
    },
    {
      key: 'degree_B',
      header: 'Deg B',
      align: 'right',
      render: (r) => <span className="mono">{r.degree_B}</span>,
    },
    {
      key: 'd_degree',
      header: 'Δ Degree',
      align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 600 }}>
          {signedNum(r.d_degree)}
        </span>
      ),
    },
    {
      key: 'strength_norm_A',
      header: 'Norm Str A',
      align: 'right',
      render: (r) => <span className="mono">{r.strength_norm_A.toFixed(2)}</span>,
    },
    {
      key: 'strength_norm_B',
      header: 'Norm Str B',
      align: 'right',
      render: (r) => <span className="mono">{r.strength_norm_B.toFixed(2)}</span>,
    },
    {
      key: 'd_strength_norm',
      header: 'Δ Norm Str',
      align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 600 }}>
          {signed(r.d_strength_norm, 2)}
        </span>
      ),
    },
    {
      key: 'd_clustering',
      header: 'Δ Clustering',
      align: 'right',
      render: (r) => (
        <span className="mono">
          {signed(r.d_clustering, 4)}
        </span>
      ),
    },
    {
      key: 'isolation_change',
      header: 'Isolation Switch',
      align: 'center',
      render: (r) => {
        if (r.isolation_change === 'connected_in_both') return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected</span>;
        if (r.isolation_change === 'isolated_in_both') return <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Isolated Both</span>;
        if (r.isolation_change === 'isolated_in_A') return <span className="badge badge-partial" style={{ fontSize: '0.7rem' }}>Isolated in A</span>;
        return <span className="badge badge-sensitive" style={{ fontSize: '0.7rem' }}>Isolated in B</span>;
      },
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Pairwise Analysis</span>
          <span className="badge badge-blue mono">d = 0.15 ({mCount} edges)</span>
        </div>
        <h1 className="page-title">Pairwise Network Comparison (d = 0.15)</h1>
        <p className="page-subtitle">
          Direct comparison of Subject A ({subA}) and Subject B ({subB}) at primary density d = 0.15: global differences, topological edge overlap, and node-level variation.
        </p>
      </div>

      <CaveatBanner />

      {/* Edge Overlap Summary Cards */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Edge Overlap Statistics (m = {mCount} edges per network)
        </h2>
        <div className="grid-4">
          <div className="card" style={{ borderLeft: '4px solid var(--overlap-both)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Shared in Both</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sharedCount} edges</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{sharedPct}% of each network</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #ea580c' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Only in Subject A</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ea580c' }}>{onlyACount} edges</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{onlyAPct}% unique to A</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Only in Subject B</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#7c3aed' }}>{onlyBCount} edges</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{onlyBPct}% unique to B</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #eab308' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jaccard Similarity</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{jaccard}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{signFlipCount} sign flips observed</div>
          </div>
        </div>
      </section>

      {/* Interactive Edge Overlap Network */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Share2 size={20} style={{ color: 'var(--accent-blue)' }} />
          Interactive Edge Overlap Network
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Color coding strictly matches the publication figure: <strong>Grey</strong> = in both networks ({sharedCount} edges), <strong>Orange</strong> = only in Subject A ({onlyACount} edges), <strong>Purple</strong> = only in Subject B ({onlyBCount} edges). Line style denotes edge sign: <strong>Solid</strong> = positive correlation, <strong>Dashed</strong> = negative correlation. The <strong>{signFlipCount} sign flips</strong> are highlighted with a thick gold stroke.
        </p>

        {loading ? (
          <div>Loading interactive overlap network...</div>
        ) : (
          <CytoscapeOverlapNetwork edges={edges} nodes={nodeDiffs} />
        )}
      </section>

      {/* Global Differences Table */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} style={{ color: 'var(--accent-blue)' }} />
          Global Differences at Primary Setting (d = 0.15)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Global metrics evaluated at d = 0.15. Scale-dependent metrics (such as mean strength and mean |w|) are heavily influenced by Subject A's higher whole-matrix scale ({meanAbsA} vs {meanAbsB}).
        </p>
        <DataTable data={globalDiffs} columns={globalColumns} pageSize={15} />
      </section>

      {/* Node Differences Table */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitCompare size={20} style={{ color: 'var(--accent-blue)' }} />
          Node-Level Metric Differences (100 ICA Nodes)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Sortable node table showing differences in degree, scale-normalized strength, clustering, and component isolation status.
        </p>
        <DataTable
          data={nodeDiffs}
          columns={nodeColumns}
          searchPlaceholder="Search nodes (e.g. IC067)..."
          searchKeys={['label']}
          initialSortKey="d_degree"
          initialSortDir="desc"
          pageSize={15}
        />
      </section>

      {/* Publication Figures */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Published Comparison Figures
        </h2>

        <div className="figure-wrapper" style={{ marginBottom: '1.5rem' }}>
          <img src={`${import.meta.env.BASE_URL}figures/AB_edge_overlap_network.png`} alt="Publication Edge Overlap Network" />
          <div className="figure-caption">
            <strong>Figure AB2:</strong> Edge overlap network at d = 0.15 showing shared (grey), A-only (orange), and B-only (purple) connections.
          </div>
        </div>

        <div className="grid-2">
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_degree_strength.png`} alt="Node Degree vs Strength Comparison" />
            <div className="figure-caption">
              <strong>Figure AB3:</strong> Node degree vs signed strength comparison between Subject A and Subject B.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_weight_difference.png`} alt="Weight Difference Distribution" />
            <div className="figure-caption">
              <strong>Figure AB4:</strong> Distribution of edge weight differences (A − B) across the {mCount} retained edges.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

