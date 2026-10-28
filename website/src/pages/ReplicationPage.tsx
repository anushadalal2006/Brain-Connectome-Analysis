import React, { useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { DataTable, Column } from '../components/DataTable';
import { ChartCard } from '../components/ChartCard';
import {
  LabelHeatmap,
  LabelLegend,
  V1V2Bars,
  ToleranceBars,
  IsolatedPerPair,
  ScalePerSubject,
  PairInfo,
} from '../components/ReplicationCharts';
import {
  ReplicationSummary,
  ReplicationTolerance,
  ReplicationStructure,
  ReplicationLabelV2,
  ReplicationLabelV1,
  ReplicationMeta,
} from '../types';
import { GitBranch, ShieldCheck, Sliders, Database, Table2 } from 'lucide-react';
import { useJSON, PENDING } from '../data';
import { labelCat, parseFrac } from '../metrics';

const badgeClass = (label: string) => {
  const cat = labelCat(label);
  return cat === 'consistent' ? 'badge-consistent' : cat === 'partial' ? 'badge-partial' : cat === 'sensitive' ? 'badge-sensitive' : 'badge-neutral';
};

const LabelBadge: React.FC<{ label: string; direction?: string }> = ({ label, direction }) => (
  <span className={`badge ${badgeClass(label)}`} style={{ textTransform: 'none', letterSpacing: 0 }}>
    {label}{direction ? ` (${direction})` : ''}
  </span>
);

const DirectionNote: React.FC = () => (
  <p className="direction-note">
    Direction (A &gt; B or A &lt; B) is arbitrary across pairs: which subject is called A is a matter of ID order. Only the labels can replicate, never the direction.
  </p>
);

export const ReplicationPage: React.FC = () => {
  const summaryData = useJSON<ReplicationSummary[]>('replication_summary.json');
  const toleranceData = useJSON<ReplicationTolerance[]>('replication_tolerance_check.json');
  const structureData = useJSON<ReplicationStructure[]>('replication_structure_d015.json');
  const labelsV2 = useJSON<ReplicationLabelV2[]>('replication_labels_v2.json');
  const labelsV1 = useJSON<ReplicationLabelV1[]>('replication_labels_v1.json');
  const meta = useJSON<ReplicationMeta>('replication_meta.json');
  const summary = summaryData ?? [];
  const tolerance = toleranceData ?? [];
  const structure = structureData ?? [];

  const [pairKey, setPairKey] = useState('main');

  // Pairs in the order of replication_meta.json; keys match the other files.
  const pairs: PairInfo[] = (meta?.pairs ?? []).map((p, i) => ({
    key: i === 0 ? 'main' : `pair${i}`,
    title: i === 0 ? `Main (${p[0]}–${p[1]})` : `Pair ${i} (${p[0]}–${p[1]})`,
  }));
  const totalPairs = meta ? meta.pairs.length : PENDING;
  const nReplication = meta ? meta.pairs.length - 1 : PENDING;
  const K = meta ? meta.density_settings.length : PENDING;
  const relTolPct = meta ? `${meta.rel_tol * 100}%` : PENDING;
  const tolerances = meta?.tolerance_check ?? [];
  const metrics = meta?.metrics_v2 ?? [];

  const count = (metric: string) => parseFrac(summary.find((s) => s.metric === metric)?.v2_consistent);
  const ofText = (f: [number, number] | null) => (f ? `${f[0]} of ${f[1]}` : PENDING);
  const sensitiveOf = (metric: string) => {
    const r = labelsV2?.filter((l) => l.metric === metric);
    return r && r.length ? `${r.filter((l) => labelCat(l.label) === 'sensitive').length} of ${r.length}` : PENDING;
  };

  const scales = structure.flatMap((r) => [r.mean_abs_w_all_A, r.mean_abs_w_all_B]);
  const scaleMin = scales.length ? Math.min(...scales).toFixed(2) : PENDING;
  const scaleMax = scales.length ? Math.max(...scales).toFixed(2) : PENDING;

  const isos = structure.flatMap((r) => [r.n_isolated_A, r.n_isolated_B]);
  const isoMin = isos.length ? Math.min(...isos) : PENDING;
  const isoMax = isos.length ? Math.max(...isos) : PENDING;
  const nStable = toleranceData && meta
    ? tolerance.filter((r) => new Set(meta.tolerance_check.map((t) => (r as any)[`consistent_at_${+(t * 100).toFixed(1)}%`])).size === 1).length
    : PENDING;

  const renderBadge = (val: string) => (val ? <LabelBadge label={val} /> : '—');

  const summaryColumns: Column<ReplicationSummary>[] = [
    { key: 'metric', header: 'Metric', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span> },
    ...pairs.map((p) => ({ key: p.key, header: p.title, render: (r: ReplicationSummary) => renderBadge((r as any)[p.key]) })),
    { key: 'v2_consistent', header: 'v2 consistent', align: 'center', render: (r) => <span className="mono" style={{ fontWeight: 700 }}>{r.v2_consistent}</span> },
    { key: 'v2_partial', header: 'v2 partial', align: 'center', render: (r) => <span className="mono">{r.v2_partial}</span> },
    { key: 'v1_consistent', header: 'Frozen v1 consistent', align: 'center', render: (r) => <span className="mono" style={{ color: 'var(--text-muted)' }}>{r.v1_consistent}</span> },
  ];

  const tolKey = (t: number, kind: 'consistent' | 'sensitive') => `${kind}_at_${+(t * 100).toFixed(1)}%`;
  const toleranceColumns: Column<ReplicationTolerance>[] = [
    { key: 'metric', header: 'Metric', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span> },
    ...tolerances.flatMap((t) => (['consistent', 'sensitive'] as const).map((kind) => ({
      key: tolKey(t, kind),
      header: `${kind === 'consistent' ? 'Consistent' : 'Sensitive'} (${t * 100}%${meta && t === meta.rel_tol ? ', primary' : ''})`,
      align: 'center' as const,
      render: (r: ReplicationTolerance) => <span className="mono" style={meta && t === meta.rel_tol ? { fontWeight: 700 } : {}}>{(r as any)[tolKey(t, kind)]}</span>,
    }))),
  ];

  const structureColumns: Column<ReplicationStructure>[] = [
    { key: 'pair', header: 'Pair', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.pair}</span> },
    { key: 'A', header: 'Subject A', render: (r) => <span className="mono">{r.A}</span> },
    { key: 'B', header: 'Subject B', render: (r) => <span className="mono">{r.B}</span> },
    { key: 'n_isolated_A', header: 'Isolated A', align: 'right', render: (r) => <span className="mono">{r.n_isolated_A}</span> },
    { key: 'n_isolated_B', header: 'Isolated B', align: 'right', render: (r) => <span className="mono">{r.n_isolated_B}</span> },
    { key: 'largest_A', header: 'LCC A', align: 'right', render: (r) => <span className="mono">{r.largest_A}</span> },
    { key: 'largest_B', header: 'LCC B', align: 'right', render: (r) => <span className="mono">{r.largest_B}</span> },
    { key: 'share_neg_A', header: 'Neg % A', align: 'right', render: (r) => <span className="mono">{(r.share_neg_A * 100).toFixed(1)}%</span> },
    { key: 'share_neg_B', header: 'Neg % B', align: 'right', render: (r) => <span className="mono">{(r.share_neg_B * 100).toFixed(1)}%</span> },
    { key: 'mean_abs_w_all_A', header: 'Scale A (mean |w|)', align: 'right', render: (r) => <span className="mono">{r.mean_abs_w_all_A.toFixed(3)}</span> },
    { key: 'mean_abs_w_all_B', header: 'Scale B (mean |w|)', align: 'right', render: (r) => <span className="mono">{r.mean_abs_w_all_B.toFixed(3)}</span> },
  ];

  // Per-pair detail: v2 rows with the matching frozen v1 label beside them.
  const detailRows = (labelsV2 ?? []).filter((r) => r.pair === pairKey).map((r) => {
    const v1 = labelsV1?.find((x) => x.pair === pairKey && x.metric === r.metric.replace(/_norm$/, ''));
    return { ...r, v1_metric: v1?.metric ?? '', v1_label: v1?.label ?? '', v1_direction: v1?.direction ?? '' };
  });
  type DetailRow = (typeof detailRows)[number];
  const detailColumns: Column<DetailRow>[] = [
    { key: 'metric', header: 'Metric (v2)', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span> },
    { key: 'label', header: 'Protocol v2 label', render: (r) => <LabelBadge label={r.label} direction={r.direction} /> },
    { key: 'n_pos', header: 'A>B', align: 'center', render: (r) => <span className="mono">{r.n_pos}</span> },
    { key: 'n_neg', header: 'A<B', align: 'center', render: (r) => <span className="mono">{r.n_neg}</span> },
    { key: 'n_small', header: 'negligible', align: 'center', render: (r) => <span className="mono">{r.n_small}</span> },
    { key: 'v1_label', header: 'Frozen v1 label', render: (r) => (r.v1_label ? <span><LabelBadge label={r.v1_label} direction={r.v1_direction} />{r.v1_metric !== r.metric && <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>({r.v1_metric}, raw)</span>}</span> : '—') },
  ];
  const selectedPair = pairs.find((p) => p.key === pairKey);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-neutral">Pre-Specified Replication</span>
          <span className="badge badge-neutral">{totalPairs} subject pairs</span>
        </div>
        <h1 className="page-title">Replication Across {nReplication} Pre-Specified Pairs</h1>
        <p className="page-subtitle">
          The same multi-density analysis on {nReplication} more pairs, fixed before they were run. Protocol v2 labels are primary; frozen v1 labels are shown beside them.
        </p>
      </div>

      <CaveatBanner />

      <section className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-blue)' }}>
        <h2 className="card-title">
          <GitBranch size={20} style={{ color: 'var(--accent-blue)' }} />
          Pre-specified replication protocol
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p>
            <strong>Selection rule:</strong> {meta?.pair_rule ?? PENDING}. Protocol v2 was written after the main pair was seen and frozen before the replication pairs were run.
          </p>
          <p>
            <strong>Pairs:</strong> {pairs.map((p) => p.title).join(', ') || PENDING}.
          </p>
          <p>
            <strong>Direction is arbitrary across pairs.</strong> Which subject is called A is a matter of ID order, so A &gt; B in one pair and A &lt; B in another is not a contradiction. Only the label (setting-consistent, partially consistent, construction-sensitive) can replicate.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">Replication findings (descriptive)</h2>
        <div className="grid-4">
          <div className="card">
            <div className="stat-label">Normalised strength &amp; |w|</div>
            <div className="stat-value">{ofText(count('mean_strength_norm'))}</div>
            <div className="stat-sub">pairs setting-consistent (v2)</div>
          </div>
          <div className="card">
            <div className="stat-label">Transitivity</div>
            <div className="stat-value">{ofText(count('transitivity_all'))}</div>
            <div className="stat-sub">pairs setting-consistent (v2)</div>
          </div>
          <div className="card">
            <div className="stat-label">Clustering of largest component</div>
            <div className="stat-value">{sensitiveOf('avg_clustering_lcc')}</div>
            <div className="stat-sub">pairs construction-sensitive (v2)</div>
          </div>
          <div className="card">
            <div className="stat-label">Fragmentation measures</div>
            <div className="stat-value">{ofText(count('n_components'))}</div>
            <div className="stat-sub">pairs setting-consistent; sensitive in {sensitiveOf('n_components')}</div>
          </div>
        </div>
      </section>

      {/* Label heatmap */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <ShieldCheck size={20} style={{ color: 'var(--accent-blue)' }} />
          Protocol v2 labels for every metric and pair
        </h2>
        <ChartCard
          title="Normalised strength and |w| are setting-consistent in most pairs; clustering of the largest component is construction-sensitive in most"
          caption={<>Each cell is one metric in one pair, coloured by its protocol v2 label with the label and direction written inside. Read across a row to see whether a label replicates. <DirectionNote /></>}
          sources={['replication_labels_v2.json', 'replication_meta.json']}
          legend={<LabelLegend />}
          minWidth={720}
        >
          {labelsV2 && pairs.length ? <LabelHeatmap labels={labelsV2} metrics={metrics} pairs={pairs} /> : <div style={{ height: 500 }}>Loading chart…</div>}
        </ChartCard>

        <div className="grid-2">
          <ChartCard
            title="Frozen v1 vs protocol v2: where the raw-value rule counted more pairs as consistent"
            caption={<>Number of pairs labelled setting-consistent under each rule. Where the grey (v1) bar is longer, v1 counted a pair as consistent that v2 sets aside, either because a gap was under {relTolPct} or because the raw difference was a per-subject scale effect.</>}
            sources={['replication_summary.json']}
          >
            {summaryData ? <V1V2Bars summary={summary} /> : <div style={{ height: 500 }}>Loading chart…</div>}
          </ChartCard>
          <ChartCard
            title={`${nStable} of ${tolerance.length || PENDING} metrics keep the same count at every tolerance; the pattern does not hinge on the 1% choice`}
            caption={<>Setting-consistent pairs per metric with a 0.5%, 1% (primary) and 2% minimum gap. Similar bars across the three tolerances mean the pattern does not depend on the exact choice of 1%.</>}
            sources={['replication_tolerance_check.json']}
          >
            {toleranceData && tolerances.length ? <ToleranceBars rows={tolerance} tolerances={tolerances} /> : <div style={{ height: 500 }}>Loading chart…</div>}
          </ChartCard>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0.75rem', color: 'var(--text-primary)' }}>Summary table</h3>
        {summaryData ? <DataTable data={summary} columns={summaryColumns} pageSize={15} /> : <div>Loading…</div>}
      </section>

      {/* Per-pair detail */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <Table2 size={20} style={{ color: 'var(--accent-blue)' }} />
          One pair in detail
        </h2>
        <p className="section-lead">
          For the chosen pair: the protocol v2 label of each metric, how many of the {K} densities had A &gt; B, A &lt; B or a negligible gap (under {relTolPct}), and the frozen v1 label of the same metric (raw values for strength and |w|).
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="pair-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pair:</label>
          <select id="pair-select" className="select-input" value={pairKey} onChange={(e) => setPairKey(e.target.value)}>
            {pairs.map((p) => <option key={p.key} value={p.key}>{p.title}</option>)}
          </select>
          {selectedPair && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>A = first ID, B = second ID</span>}
        </div>
        {labelsV2 && labelsV1 ? <DataTable data={detailRows} columns={detailColumns} pageSize={15} /> : <div>Loading…</div>}
        <p className="chart-source" style={{ marginTop: '0.5rem' }}>Data source: <code>replication_labels_v2.json</code>, <code>replication_labels_v1.json</code></p>
      </section>

      {/* Tolerance table */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <Sliders size={20} style={{ color: 'var(--accent-blue)' }} />
          Tolerance check (table)
        </h2>
        <p className="section-lead">
          Number of pairs labelled setting-consistent or construction-sensitive when the minimum gap is {tolerances.map((t) => `${t * 100}%`).join(', ') || PENDING}.
        </p>
        {toleranceData ? <DataTable data={tolerance} columns={toleranceColumns} pageSize={15} /> : <div>Loading…</div>}
      </section>

      {/* Structure across pairs */}
      <section>
        <h2 className="section-title">
          <Database size={20} style={{ color: 'var(--accent-blue)' }} />
          Structure across pairs at the primary density and per-subject scale
        </h2>
        <div className="grid-2">
          <ChartCard
            title={`Isolated nodes at the primary density range from ${isoMin} to ${isoMax} across the 10 subjects`}
            caption={<>Isolated nodes (no kept edge) for the two subjects of each pair at the primary density. <DirectionNote /></>}
            sources={['replication_structure_d015.json']}
            minWidth={420}
          >
            {structureData && pairs.length ? <IsolatedPerPair rows={structure} pairs={pairs} /> : <div style={{ height: 320 }}>Loading chart…</div>}
          </ChartCard>
          <ChartCard
            title={`Whole-matrix mean |w| ranges from ${scaleMin} to ${scaleMax} across the 10 subjects`}
            caption={<>Each point is one subject&apos;s mean |w| over all node pairs. Because this overall scale differs so much between people, raw strength and |w| differences partly reflect scale; protocol v2 divides them by each subject&apos;s own mean |w|.</>}
            sources={['replication_structure_d015.json']}
            minWidth={420}
          >
            {structureData && pairs.length ? <ScalePerSubject rows={structure} pairs={pairs} /> : <div style={{ height: 320 }}>Loading chart…</div>}
          </ChartCard>
        </div>
        {structureData ? <DataTable data={structure} columns={structureColumns} pageSize={10} /> : <div>Loading…</div>}
      </section>

    </div>
  );
};
