import React from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { CaveatBanner } from '../components/CaveatBanner';
import {
  Activity,
  Database,
  GitBranch,
  Layers,
  Network,
  Share2,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Github,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  ProvenanceData,
  GlobalMetric,
  ShortestPathSummary,
  ReplicationSummary,
  ComparisonEdge,
  ConfigData
} from '../types';
import { useJSON, PENDING } from '../data';
import Plot from '../components/Plot';
import { ChartCard } from '../components/ChartCard';
import { Legend } from '../components/Legend';
import { useChartTheme, PLOT_CONFIG } from '../components/chartTheme';
import { metricName, parseFrac, labelCat, LabelCat, LABEL_TEXT } from '../metrics';
import { NOTEBOOK_GITHUB_URL, NOTEBOOK_COLAB_URL } from '../config';

const PAIR_COLS = ['main', 'pair1', 'pair2', 'pair3', 'pair4'] as const;

const KeyFindingsLegend: React.FC = () => {
  const { c } = useChartTheme();
  const col: Record<LabelCat, string> = { consistent: c.consistent, partial: c.partial, sensitive: c.sensitive, none: c.none };
  return <Legend items={(['consistent', 'partial', 'sensitive', 'none'] as LabelCat[]).map((k) => ({ label: LABEL_TEXT[k], color: col[k] }))} />;
};

const KeyFindingsChart: React.FC<{ summary: ReplicationSummary[] }> = ({ summary }) => {
  const { c, axis, layout } = useChartTheme();
  const rows = summary
    .map((r) => {
      const cats = PAIR_COLS.map((k) => labelCat(r[k]));
      const count = (cat: LabelCat) => cats.filter((x) => x === cat).length;
      return { metric: r.metric, name: metricName(r.metric), total: cats.length, consistent: count('consistent'), partial: count('partial'), sensitive: count('sensitive'), none: count('none') };
    })
    .sort((x, y) => x.consistent - y.consistent || y.sensitive - x.sensitive);
  const y = rows.map((r) => r.name);
  const seg = (key: LabelCat, color: string) => ({
    type: 'bar',
    orientation: 'h',
    name: LABEL_TEXT[key],
    y,
    x: rows.map((r) => r[key]),
    marker: { color, line: { color: c.surface, width: 2 } },
    text: key === 'consistent' ? rows.map((r) => `${r.consistent} of ${r.total}`) : rows.map(() => ''),
    textposition: 'inside',
    insidetextanchor: 'start',
    textfont: { color: '#ffffff', size: 12 },
    textangle: 0,
    constraintext: 'none',
    customdata: rows.map((r) => r.total),
    hovertemplate: `%{y}<br>${LABEL_TEXT[key]}: %{x} of %{customdata} pairs<extra></extra>`,
  });
  const data = [seg('consistent', c.consistent), seg('partial', c.partial), seg('sensitive', c.sensitive), seg('none', c.none)];
  return (
    <>
    <Plot
      data={data as any}
      layout={layout({
        barmode: 'stack',
        height: 400,
        margin: { t: 10, r: 20, b: 45, l: 10 },
        xaxis: axis('Number of subject pairs (protocol v2)', { dtick: 1, range: [0, rows[0]?.total ?? 0] }),
        yaxis: axis('', { automargin: true, gridcolor: 'rgba(0,0,0,0)' }),
        showlegend: false,
      }) as any}
      useResizeHandler
      style={{ width: '100%' }}
      config={PLOT_CONFIG}
    />
    </>
  );
};

export const Home: React.FC = () => {
  const cfg = useJSON<ConfigData>('config.json');
  const prov = useJSON<ProvenanceData>('provenance.json');
  const metrics = useJSON<GlobalMetric[]>('metrics_global_d015.json');
  const sp = useJSON<ShortestPathSummary[]>('shortest_path_summary.json');
  const meta = useJSON<{ pairs: string[][] }>('replication_meta.json');
  const summary = useJSON<ReplicationSummary[]>('replication_summary.json');
  const edges = useJSON<ComparisonEdge[]>('comparison_edges_d015.json');

  const configHash = cfg?.config.hash ?? PENDING;
  const subA = cfg?.subjects.A ?? PENDING;
  const subB = cfg?.subjects.B ?? PENDING;
  const nDensities = cfg ? cfg.density_settings.length : PENDING;
  const densityRange = cfg ? `${cfg.density_settings[0].toFixed(2)} to ${cfg.density_settings[cfg.density_settings.length - 1].toFixed(2)}` : PENDING;
  const primaryDensity = cfg ? cfg.config.density.toFixed(2) : PENDING;
  const check = prov?.all_subject_check;
  const validSubjects = check ? `${check.valid} / ${check.subjects}` : PENDING;
  const totalSubjects = check ? check.subjects : PENDING;
  const edgeRow = metrics?.find((m) => m.metric === 'n_edges');
  const densityEdges = edgeRow ? Math.round(edgeRow.A) : PENDING;
  const finitePaths = sp ? sp.reduce((acc, row) => acc + (row.finite || 0), 0) : PENDING;
  const pairCount = meta ? meta.pairs.length : PENDING;
  const replicationPairs = meta ? meta.pairs.length - 1 : PENDING;

  const frac = (metric: string, field: 'v2_consistent' | 'v2_partial') => {
    const f = parseFrac(summary?.find((s) => s.metric === metric)?.[field]);
    return f ? f : null;
  };
  const ofText = (f: [number, number] | null) => (f ? `${f[0]} of ${f[1]}` : PENDING);
  const normStrengthStable = ofText(frac('mean_strength_norm', 'v2_consistent'));
  const transitivityStable = ofText(frac('transitivity_all', 'v2_consistent'));
  const clustLcc = frac('avg_clustering_lcc', 'v2_consistent');
  const clustLccRow = summary?.find((s) => s.metric === 'avg_clustering_lcc');
  const clusteringSensitive = clustLccRow && clustLcc
    ? `${PAIR_COLS.filter((k) => labelCat(clustLccRow[k]) === 'sensitive').length} of ${clustLcc[1]}`
    : PENDING;
  const fragmentationStable = ofText(frac('n_components', 'v2_consistent'));

  const sharedEdges = edges ? edges.filter((e) => e.status === 'both').length : PENDING;
  const onlyAEdges = edges ? edges.filter((e) => e.status === 'A_only').length : PENDING;
  const onlyBEdges = edges ? edges.filter((e) => e.status === 'B_only').length : PENDING;
  const signFlips = edges ? edges.filter((e) => e.sign_flip).length : PENDING;

  const steps = [
    { n: 1, title: 'Validate', text: `${validSubjects} subjects pass the data checks (symmetry, no NaN, zero diagonal).`, to: '/data' },
    { n: 2, title: 'Build signed graphs', text: `Proportional density at ${nDensities} densities (${densityRange}); negative edges kept.`, to: '/methods' },
    { n: 3, title: 'Compare A vs B, link global to local', text: `ΔM(d) per metric, labelled by protocol v2 next to frozen v1; node and edge changes that go together with it.`, to: '/multi-density' },
    { n: 4, title: 'Replicate', text: `Same analysis on ${replicationPairs} pre-specified pairs; only labels can replicate.`, to: '/replication' },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Hero section */}
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-blue">Graph Theory</span>
          <span className="badge badge-neutral">No Machine Learning</span>
          <span className="badge badge-neutral mono">Settings ID {configHash}</span>
        </div>
        <h1 className="page-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', maxWidth: '900px' }}>
          Brain Connectome Visualization and Analysis System
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>
          A graph-based application for analysing human functional connectivity across multiple proportional densities without using machine learning.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/methods" className="btn btn-primary">
            Explore Methods Pipeline <ArrowRight size={16} />
          </Link>
          <Link to="/multi-density" className="btn">
            View Multi-Density Findings
          </Link>
          <a
            href={NOTEBOOK_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <Github size={16} /> View Notebook on GitHub
          </a>
          <a
            href={NOTEBOOK_COLAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <ExternalLink size={16} /> Open in Colab
          </a>
        </div>
      </div>

      <CaveatBanner settingsId={cfg?.config.hash} />

      {/* What we did: 4 steps */}
      <section style={{ marginBottom: '2.5rem' }} aria-label="What we did">
        <h2 className="section-title">What we did</h2>
        <ol className="step-strip">
          {steps.map((st) => (
            <li key={st.n} className="step-item">
              <Link to={st.to} className="card step-card">
                <span className="step-num" aria-hidden="true">{st.n}</span>
                <span className="step-title">{st.title}</span>
                <span className="step-text">{st.text}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* 4 Headline numbers */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Headline Parameters & Results
        </h2>
        <div className="grid-4">
          <MetricCard
            title="Subjects Validated"
            value={validSubjects}
            subtitle="HCP S1200 PTN release"
            badge={{ text: 'Data Check', variant: 'neutral' }}
            icon={<CheckCircle2 size={20} />}
          />
          <MetricCard
            title={`Graph density (d = ${primaryDensity})`}
            value={`${densityEdges} edges`}
            subtitle="Top |w| proportional density"
            badge={{ text: 'Signed Weighted', variant: 'blue' }}
            icon={<Network size={20} />}
          />
          <MetricCard
            title="Subject pairs compared"
            value={pairCount}
            subtitle={`Each across ${nDensities} densities (K = ${nDensities})`}
            badge={{ text: 'Pre-specified', variant: 'consistent' }}
            icon={<Sliders size={20} />}
          />
          <MetricCard
            title="Finite Shortest Paths"
            value={`${finitePaths} paths`}
            subtitle="Due to reachable negative 2-cycles"
            badge={{ text: 'Undefined (w < 0)', variant: 'sensitive' }}
            icon={<AlertTriangle size={20} />}
          />
        </div>
      </section>

      {/* Key findings chart */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">Key findings</h2>
        <ChartCard
          title={`Robustness depends on the metric: normalised strength and |w| keep their direction across densities in ${normStrengthStable} pairs, clustering of the largest component in only ${ofText(clustLcc)}`}
          caption={<>Each bar shows, for one metric, how many of the {pairCount} subject pairs got each protocol v2 label across the {nDensities} densities; bars are sorted by the setting-consistent count. Notice that no metric is setting-consistent in every pair. Direction (A &gt; B or A &lt; B) is arbitrary across pairs, so only the labels are compared. Frozen v1 counts are on the <Link to="/replication">Replication</Link> page.</>}
          sources={['replication_summary.json']}
          minWidth={540}
          legend={<KeyFindingsLegend />}
        >
          {summary ? <KeyFindingsChart summary={summary} /> : <div style={{ height: 440 }}>Loading chart…</div>}
        </ChartCard>
      </section>

      {/* Main Result & Summary */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card">
          <h2 className="card-title">
            <Activity size={20} style={{ color: 'var(--accent-blue)' }} />
            Main Finding (Descriptive)
          </h2>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '1rem' }}>
              Whether a difference between two individuals survives different density choices depends strongly on the metric. Across {pairCount} pre-specified subject pairs, normalised strength and normalised mean |w| were the most stable (setting-consistent in {normStrengthStable} pairs), transitivity was mostly stable ({transitivityStable}), average clustering of the largest component usually depended on density (construction-sensitive in {clusteringSensitive}), and fragmentation measures were stable in only {fragmentationStable}.
            </p>
            <p>
              A raw-weight result under the frozen v1 rule turned out to be a per-subject scale effect, which is why protocol v2 was added. All results are descriptive: {pairCount} pairs, no significance testing.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
            Plain-Language Summary
          </h2>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '1rem' }}>
              In connectomics, brain networks are frequently constructed by applying an arbitrary threshold to correlation matrices. However, differences observed at one threshold may disappear or reverse at another.
            </p>
            <p>
              This project investigates setting sensitivity by testing {pairCount} subject pairs across {nDensities} proportional densities ({densityRange}) using graph theory without machine learning or discarding negative connections. Every global discrepancy is linked to local node and edge alterations, with the settings ID and provenance recorded with every result.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Feature Cards */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Explore the Project
        </h2>
        <div className="grid-3">
          <Link to="/data" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Database size={18} style={{ color: 'var(--accent-blue)' }} /> HCP Data & Validation
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {totalSubjects} validated subjects from HCP S1200 PTN (group-ICA 100 components, netmats1 r-to-Z statistics from FSLNets).
            </p>
          </Link>

          <Link to="/methods" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Sliders size={18} style={{ color: 'var(--accent-blue)' }} /> Methods & Algorithms
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Proportional density construction, Bellman-Ford negative-cycle mechanics, KaTeX formulas, and protocol v1 vs v2.
            </p>
          </Link>

          <Link to="/networks" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Network size={18} style={{ color: 'var(--accent-blue)' }} /> Single Networks
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Interactive network explorer for subjects A ({subA}) and B ({subB}) at d = {primaryDensity}, with BFS/DFS reachability.
            </p>
          </Link>

          <Link to="/comparison" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Share2 size={18} style={{ color: 'var(--accent-blue)' }} /> Pairwise Comparison (d = {primaryDensity})
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Edge overlap breakdown ({sharedEdges} shared, {onlyAEdges} A-only, {onlyBEdges} B-only, {signFlips} sign flips) and interactive overlap network.
            </p>
          </Link>

          <Link to="/multi-density" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Layers size={18} style={{ color: 'var(--accent-blue)' }} /> Multi-Density Analysis
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ΔM(d) for every metric across {nDensities} densities, post-hoc scale check, and global-to-local node rankings.
            </p>
          </Link>

          <Link to="/replication" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <GitBranch size={18} style={{ color: 'var(--accent-blue)' }} /> Replication Across {pairCount} Pairs
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              The same analysis on {replicationPairs} pre-specified pairs, label grid, and tolerance check (0.5%, 1%, 2%).
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
};

