import React from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { DataTable, Column } from '../components/DataTable';
import { GlobalStatistic, ProvenanceData, ConfigData, NodeStatistic } from '../types';
import { useJSON, PENDING } from '../data';
import { ChartCard } from '../components/ChartCard';
import { StatisticsPanels, NodeStrengthLine, SignShareBars, SubjectLegend } from '../components/DataCharts';
import { Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DataPage: React.FC = () => {
  const stats = useJSON<GlobalStatistic[]>('statistics_global.json') ?? [];
  const prov = useJSON<ProvenanceData>('provenance.json');
  const cfg = useJSON<ConfigData>('config.json');
  const nodeStats = useJSON<NodeStatistic[]>('statistics_nodes.json');
  const subA = cfg?.subjects.A ?? PENDING;
  const subB = cfg?.subjects.B ?? PENDING;
  const loading = stats.length === 0;

  const meanAbsRow = stats.find((s) => s.statistic === 'mean_abs');
  const meanAbsA = meanAbsRow ? meanAbsRow.A : null;
  const meanAbsB = meanAbsRow ? meanAbsRow.B : null;
  const kurt = stats.find((s) => s.statistic === 'excess_kurtosis');

  const nValuesRow = stats.find((s) => s.statistic === 'n_values');
  const nValues = nValuesRow ? Math.round(nValuesRow.A).toLocaleString() : PENDING;

  const check = prov?.all_subject_check;
  const validCount = check?.valid ?? PENDING;
  const totalSubjectsCount = check?.subjects ?? PENDING;
  const totalNan = check?.total_nan ?? PENDING;
  const maxAsym = check ? check.max_asymmetry.toFixed(1) : PENDING;
  const diagVal = check ? (check.diagonal_values?.[0] ?? 0).toFixed(1) : PENDING;

  // Node-level: compare the tail range IC067–IC100 with the other nodes (computed, not assumed).
  const TAIL_FROM = 'IC067';
  const TAIL_TO = 'IC100';
  const inTail = (label: string) => label >= TAIL_FROM && label <= TAIL_TO;
  const avg = (xs: number[]) => xs.reduce((acc, v) => acc + v, 0) / xs.length;
  const tail = nodeStats?.filter((n) => inTail(n.label)) ?? [];
  const rest = nodeStats?.filter((n) => !inTail(n.label)) ?? [];
  const tailA = tail.length ? avg(tail.map((n) => n.mean_abs_w_A)).toFixed(2) : PENDING;
  const restA = rest.length ? avg(rest.map((n) => n.mean_abs_w_A)).toFixed(2) : PENDING;
  const tailB = tail.length ? avg(tail.map((n) => n.mean_abs_w_B)).toFixed(2) : PENDING;
  const restB = rest.length ? avg(rest.map((n) => n.mean_abs_w_B)).toFixed(2) : PENDING;

  const statColumns: Column<GlobalStatistic>[] = [
    {
      key: 'statistic',
      header: 'Statistic',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.statistic}</span>,
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
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Dataset Identity</span>
          <span className="badge badge-neutral mono">HCP S1200 PTN</span>
        </div>
        <h1 className="page-title">Dataset Specification & Validation</h1>
        <p className="page-subtitle">
          Human Connectome Project (HCP) Young Adult S1200 Parcellation+Timeseries+Netmats (PTN) release details, data-use compliance, and whole-network descriptive distributions.
        </p>
      </div>

      <CaveatBanner />

      {/* Dataset Identity and Compliance Cards */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h2 className="card-title">
            <Database size={20} style={{ color: 'var(--accent-blue)' }} />
            Data Identity & Representation
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <li>
              <strong>Dataset:</strong> HCP Young Adult S1200 ({totalSubjectsCount} validated subjects).
            </li>
            <li>
              <strong>Parcellation:</strong> Group-ICA at dimension <span className="mono">d = 100</span> components.
            </li>
            <li>
              <strong>Representation:</strong> <span className="mono">netmats1</span>: full correlation, r-to-Z statistics from FSLNets (full correlation, Gaussianised r), not Pearson r.
            </li>
            <li>
              <strong>Subjects Analyzed:</strong> Subject A = <span className="mono">{subA}</span> (row 0), Subject B = <span className="mono">{subB}</span> (row 1).
            </li>
            <li>
              <strong>Node Nature:</strong> Nodes represent spatial ICA components, not anatomical parcels. ICA maps can overlap and contain several separated regions. ("Brain region" in the project statement means "network node").
            </li>
          </ul>
        </div>

        <div className="card">
          <h2 className="card-title">
            <ShieldCheck size={20} style={{ color: 'var(--accent-blue)' }} />
            Data Integrity & HCP Terms Compliance
          </h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ color: '#059669' }} />
              <span><strong>{validCount} / {totalSubjectsCount} subjects valid</strong> ({totalNan} NaN, max asymmetry {maxAsym}, diagonal {diagVal}).</span>
            </div>
            <p>
              <strong>Data Check Notice:</strong> All {totalSubjectsCount} matrices were verified for mathematical symmetry, absence of missing entries, and null diagonals. This is an empirical data validation check.
            </p>
            <p>
              <strong>HCP Open Access Terms:</strong> Raw connectivity matrices and subject arrays are not redistributed in this repository. HCP data must be acquired directly from <a href="https://db.humanconnectome.org" target="_blank" rel="noopener noreferrer">ConnectomeDB</a> under HCP Open Access Data Use Terms.
            </p>
          </div>
        </div>
      </div>

      {/* Whole-Matrix Descriptive Statistics */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Whole-Matrix Descriptive Statistics (N = {nValues} node pairs)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Descriptive statistics computed across all unique off-diagonal pairs (100 × 99 / 2 = {nValues} pairs) prior to thresholding. Note the difference in overall scale: Subject A has mean |w| = {meanAbsA !== null ? meanAbsA.toFixed(4) : '—'} compared to Subject B with mean |w| = {meanAbsB !== null ? meanAbsB.toFixed(4) : '—'}.
        </p>

        {loading ? (
          <div>Loading dataset statistics...</div>
        ) : (
          <DataTable data={stats} columns={statColumns} pageSize={20} />
        )}
      </section>

      {/* Charts */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">The two subjects at a glance</h2>
        <ChartCard
          title={meanAbsA !== null && meanAbsB !== null
            ? `${meanAbsA > meanAbsB ? 'A' : 'B'}'s weights are spread more widely (mean |w| ${meanAbsA.toFixed(2)} vs ${meanAbsB.toFixed(2)})${kurt ? `, while ${kurt.B > kurt.A ? 'B' : 'A'}'s distribution has heavier tails (excess kurtosis ${Math.max(kurt.A, kurt.B).toFixed(2)} vs ${Math.min(kurt.A, kurt.B).toFixed(2)})` : ''}`
            : 'Descriptive statistics, A vs B'}
          caption={<>Each panel groups statistics on a similar scale, so bars can be compared within a panel. Notice the difference in spread (std, IQR, mean |w|): this per-subject scale is why protocol v2 divides strength and |w| by each subject&apos;s own mean |w|.</>}
          sources={['statistics_global.json']}
          legend={<SubjectLegend subA={String(subA)} subB={String(subB)} />}
        >
          {stats.length ? <StatisticsPanels stats={stats} subA={String(subA)} subB={String(subB)} /> : <div style={{ height: 230 }}>Loading chart…</div>}
        </ChartCard>

        <ChartCard
          title={`Components ${'IC067'}–${'IC100'} are on average the most weakly connected: mean |w| ${tailA} vs ${restA} (A) and ${tailB} vs ${restB} (B)`}
          caption={<>Mean |w| of each network node (ICA component) over its 99 pairs, before any thresholding. The shaded range is IC067–IC100; the averages in the title compare it with IC001–IC066. This is the pattern behind the isolated nodes at d = 0.15 (see Single Networks). Not every node in the range is weaker than every node outside it.</>}
          sources={['statistics_nodes.json']}
          legend={<SubjectLegend subA={String(subA)} subB={String(subB)} />}
          minWidth={560}
        >
          {nodeStats ? <NodeStrengthLine nodes={nodeStats} subA={String(subA)} subB={String(subB)} shadeFrom={TAIL_FROM} shadeTo={TAIL_TO} /> : <div style={{ height: 340 }}>Loading chart…</div>}
        </ChartCard>

        <ChartCard
          title="Positive and negative pairs are almost evenly split in both subjects"
          caption={<>Share of all node pairs with a positive (red) or negative (blue) weight before thresholding. The dotted line marks 50%. Negative pairs are kept in every graph built on this site.</>}
          sources={['statistics_global.json']}
        >
          {stats.length ? <SignShareBars stats={stats} subA={String(subA)} subB={String(subB)} /> : <div style={{ height: 170 }}>Loading chart…</div>}
        </ChartCard>
      </section>

      {/* High-Resolution Matrix & Histogram Visualizations */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Connectivity Matrices & Weight Distributions
        </h2>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/A_matrix.png`} alt={`Subject A Full Connectivity Matrix (${subA})`} />
            <div className="figure-caption">
              <strong>Figure A1:</strong> Full 100×100 connectivity matrix for Subject A ({subA}). Red = positive correlation, Blue = negative correlation.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/B_matrix.png`} alt={`Subject B Full Connectivity Matrix (${subB})`} />
            <div className="figure-caption">
              <strong>Figure B1:</strong> Full 100×100 connectivity matrix for Subject B ({subB}). Red = positive correlation, Blue = negative correlation.
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/A_hist.png`} alt={`Subject A Edge Weight Histogram (${subA})`} />
            <div className="figure-caption">
              <strong>Figure A2:</strong> Distribution of edge weights for Subject A across all {nValues} pairs.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/B_hist.png`} alt={`Subject B Edge Weight Histogram (${subB})`} />
            <div className="figure-caption">
              <strong>Figure B2:</strong> Distribution of edge weights for Subject B across all {nValues} pairs.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

