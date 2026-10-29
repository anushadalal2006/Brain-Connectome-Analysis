import React from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { CytoscapeOverlapNetwork } from '../components/CytoscapeOverlapNetwork';
import { DataTable, Column } from '../components/DataTable';
import { ComparisonGlobal, ComparisonNode, ComparisonEdge, GlobalStatistic, ConfigData } from '../types';
import { useJSON, PENDING } from '../data';
import { ChartCard } from '../components/ChartCard';
import { GlobalDumbbell, DegreeScatter, DegreeDiffBars, IsolationBars, OverlapBar, ISOLATION_TEXT } from '../components/ComparisonCharts';
import { Share2, GitCompare, Activity } from 'lucide-react';
import { signedNum, signed } from '../utils/format';

export const ComparisonPage: React.FC = () => {
  const globalData = useJSON<ComparisonGlobal[]>('comparison_global_d015.json');
  const nodeData = useJSON<ComparisonNode[]>('comparison_nodes_d015.json');
  const edgeData = useJSON<ComparisonEdge[]>('comparison_edges_d015.json');
  const statsData = useJSON<GlobalStatistic[]>('statistics_global.json');
  const cfg = useJSON<ConfigData>('config.json');
  const globalDiffs = globalData ?? [];
  const nodeDiffs = nodeData ?? [];
  const edges = edgeData ?? [];
  const stats = statsData ?? [];
  const loading = !edgeData || !nodeData;
  const subA = cfg?.subjects.A ?? PENDING;
  const subB = cfg?.subjects.B ?? PENDING;
  const density = cfg ? cfg.config.density.toFixed(2) : PENDING;

  const sharedCount = edges.filter((e) => e.status === 'both').length;
  const onlyACount = edges.filter((e) => e.status === 'A_only').length;
  const onlyBCount = edges.filter((e) => e.status === 'B_only').length;
  const signFlipEdges = edges.filter((e) => e.sign_flip);
  const signFlipCount = signFlipEdges.length;
  const m = sharedCount + onlyACount;
  const mCount = edgeData ? m : PENDING;
  const totalUnion = sharedCount + onlyACount + onlyBCount;
  const pct = (x: number) => (edgeData && m > 0 ? ((x / m) * 100).toFixed(1) : PENDING);
  const sharedPct = pct(sharedCount);
  const onlyAPct = pct(onlyACount);
  const onlyBPct = pct(onlyBCount);
  const jaccard = edgeData && totalUnion > 0 ? (sharedCount / totalUnion).toFixed(3) : PENDING;

  const meanAbsRow = stats.find((s) => s.statistic === 'mean_abs');
  const meanAbsA = meanAbsRow ? meanAbsRow.A.toFixed(3) : PENDING;
  const meanAbsB = meanAbsRow ? meanAbsRow.B.toFixed(3) : PENDING;
  const higherScale = meanAbsRow ? (meanAbsRow.A > meanAbsRow.B ? 'A' : 'B') : PENDING;
  const isoCount = (k: string) => nodeDiffs.filter((n) => n.isolation_change === k).length;
  const maxAbsDeg = nodeDiffs.length ? Math.max(...nodeDiffs.map((n) => Math.abs(n.d_degree))) : PENDING;

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
        const cls = r.isolation_change === 'neither' ? '' : r.isolation_change === 'both' ? 'badge badge-neutral' : r.isolation_change === 'A_only' ? 'badge iso-a' : 'badge iso-b';
        const text = ISOLATION_TEXT[r.isolation_change] ?? r.isolation_change;
        return cls ? <span className={cls} style={{ fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0 }}>{text}</span> : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{text}</span>;
      },
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Pairwise Analysis</span>
          <span className="badge badge-neutral mono">d = {density} ({mCount} edges)</span>
        </div>
        <h1 className="page-title">Pairwise Network Comparison (d = {density})</h1>
        <p className="page-subtitle">
          Direct comparison of Subject A ({subA}) and Subject B ({subB}) at the primary density d = {density}: global differences, edge overlap, and node-level differences.
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

          <div className="card" style={{ borderLeft: '4px solid var(--overlap-A)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Only in Subject A</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--overlap-A)' }}>{onlyACount} edges</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{onlyAPct}% unique to A</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--overlap-B)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Only in Subject B</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--overlap-B)' }}>{onlyBCount} edges</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{onlyBPct}% unique to B</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--overlap-flip)' }}>
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
          Colours match the notebook figure: <strong>Grey</strong> = in both networks ({sharedCount} edges), <strong>Orange</strong> = only in Subject A ({onlyACount} edges), <strong>Purple</strong> = only in Subject B ({onlyBCount} edges). Line style denotes edge sign: <strong>Solid</strong> = positive correlation, <strong>Dashed</strong> = negative correlation. The <strong>{signFlipCount} sign flips</strong> are highlighted with a thick gold stroke.
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
          Global Differences at d = {density}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Global metrics at d = {density}. Scale-dependent metrics (mean strength and mean |w|) also reflect the difference in whole-matrix scale: mean |w| is {meanAbsA} in A and {meanAbsB} in B, higher in {higherScale}.
        </p>
        <DataTable data={globalDiffs} columns={globalColumns} pageSize={15} />
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <ChartCard
          title="A and B side by side for every global metric: the largest gaps are in strength and fragmentation"
          caption={<>Each metric is divided by the mean of A and B, so all metrics share one axis; 1 (dotted line) means equal. Metrics marked * are scale-dependent (raw r-to-Z units), so part of their gap is the per-subject scale difference. Hover for the actual values.</>}
          sources={['comparison_global_d015.json']}
          minWidth={480}
        >
          {globalData ? <GlobalDumbbell rows={globalDiffs} subA={String(subA)} subB={String(subB)} /> : <div style={{ height: 400 }}>Loading chart…</div>}
        </ChartCard>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">Which nodes differ</h2>
        <div className="grid-2">
          <ChartCard
            title={`Node degree in A vs B: most nodes sit off the y = x line; the largest gap is ${maxAbsDeg} edges`}
            caption={<>Each point is one network node (ICA component). Points above the dashed line have more edges in B, below it more in A. The 10 nodes with the largest |Δ degree| are labelled.</>}
            sources={['comparison_nodes_d015.json']}
          >
            {nodeData ? <DegreeScatter nodes={nodeDiffs} /> : <div style={{ height: 420 }}>Loading chart…</div>}
          </ChartCard>
          <ChartCard
            title="The 20 nodes with the largest degree difference"
            caption={<>Δ degree = degree in A − degree in B; orange where A has more edges, purple where B has more. Ties are ordered by node number.</>}
            sources={['comparison_nodes_d015.json']}
          >
            {nodeData ? <DegreeDiffBars nodes={nodeDiffs} /> : <div style={{ height: 520 }}>Loading chart…</div>}
          </ChartCard>
        </div>
        <div className="grid-2">
          <ChartCard
            title={`${isoCount('both')} nodes are isolated in both subjects; ${isoCount('B_only')} only in B and ${isoCount('A_only')} only in A`}
            caption={<>Isolation status of each node in A and B at d = {density}. Grey = isolated in both, orange = only in A, purple = only in B (same colours as the overlap network).</>}
            sources={['comparison_nodes_d015.json']}
          >
            {nodeData ? <IsolationBars nodes={nodeDiffs} /> : <div style={{ height: 300 }}>Loading chart…</div>}
          </ChartCard>
          <ChartCard
            title={`Of ${totalUnion || PENDING} edges in A or B, ${sharedCount || PENDING} are shared (Jaccard ${jaccard}) and ${signFlipCount} change sign`}
            caption={<>Each subject keeps {mCount} edges. Shared edges are split into same sign and sign flip (gold); the rest are kept by only one subject.</>}
            sources={['comparison_edges_d015.json']}
          >
            {edgeData ? <OverlapBar edges={edges} /> : <div style={{ height: 140 }}>Loading chart…</div>}
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <strong>Sign flips</strong> (edge kept by both, opposite sign):
              <ul className="flip-list">
                {signFlipEdges.map((e) => (
                  <li key={`${e.i}-${e.j}`} className="mono">
                    {e.label_i} — {e.label_j}: {e.sign_A > 0 ? '+' : '−'} in A, {e.sign_B > 0 ? '+' : '−'} in B
                  </li>
                ))}
              </ul>
            </div>
          </ChartCard>
        </div>
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
            <strong>Figure AB2:</strong> Edge overlap network at d = {density} showing shared (grey), A-only (orange), and B-only (purple) connections.
          </div>
        </div>

        <div className="grid-2">
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_degree_strength.png`} alt="Degree and signed strength distributions for A and B" />
            <div className="figure-caption">
              <strong>Figure AB3:</strong> Degree and signed-strength distributions for Subject A and Subject B at the primary density.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_weight_difference.png`} alt="Weight difference matrices, raw and normalised" />
            <div className="figure-caption">
              <strong>Figure AB4:</strong> Weight-difference matrices over all node pairs: raw W_A − W_B (left) and after dividing each matrix by its mean |w| (right).
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

