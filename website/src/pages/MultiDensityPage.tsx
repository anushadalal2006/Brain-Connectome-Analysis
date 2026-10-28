import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CaveatBanner } from '../components/CaveatBanner';
import { PlotlyDeltaChart } from '../components/PlotlyDeltaChart';
import { PlotlyTrajectoryChart } from '../components/PlotlyTrajectoryChart';
import { DataTable, Column } from '../components/DataTable';
import { ChartCard } from '../components/ChartCard';
import {
  SmallMultiples,
  ConsistencyStrip,
  ScaleCheckChart,
  G2LBarChart,
  RetentionHistogram,
  RetentionScatter,
  PanelInfo,
} from '../components/MultiDensityCharts';
import {
  MultiSettingValues,
  ProtocolV2Values,
  ConsistencyRecord,
  ProtocolV2Consistency,
  PosthocScaleCheck,
  PosthocScaleCheckLabels,
  G2LRecord,
  RetentionEdge,
  ConfigData,
  ReplicationStructure,
} from '../types';
import { Layers, Sliders, Activity, Scale, Grid3x3, GitMerge } from 'lucide-react';
import { signed } from '../utils/format';
import { useJSON, PENDING } from '../data';
import { metricName, labelCat } from '../metrics';

const badgeFor = (label: string) => {
  const cat = labelCat(label);
  return cat === 'consistent' ? 'badge-consistent' : cat === 'partial' ? 'badge-partial' : cat === 'sensitive' ? 'badge-sensitive' : 'badge-neutral';
};

const LabelBadge: React.FC<{ label: string; direction?: string }> = ({ label, direction }) => (
  <span className={`badge ${badgeFor(label)}`} style={{ textTransform: 'none', letterSpacing: 0 }}>
    {label}{direction ? ` (${direction})` : ''}
  </span>
);

const ModeToggle: React.FC<{ mode: 'v1' | 'v2'; onChange: (m: 'v1' | 'v2') => void }> = ({ mode, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }} role="group" aria-label="Protocol view">
    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>View:</span>
    <button type="button" className={`btn ${mode === 'v2' ? 'btn-primary' : ''}`} aria-pressed={mode === 'v2'} onClick={() => onChange('v2')}>
      Protocol v2 (normalised, 1% gap)
    </button>
    <button type="button" className={`btn ${mode === 'v1' ? 'btn-primary' : ''}`} aria-pressed={mode === 'v1'} onClick={() => onChange('v1')}>
      Frozen v1 (raw values, no gap)
    </button>
  </div>
);

export const MultiDensityPage: React.FC = () => {
  const v1Values = useJSON<MultiSettingValues[]>('multi_setting_values.json');
  const v2Values = useJSON<ProtocolV2Values[]>('protocol_v2_values.json');
  const v1Consistency = useJSON<ConsistencyRecord[]>('multi_setting_consistency.json');
  const v2Consistency = useJSON<ProtocolV2Consistency[]>('protocol_v2_consistency.json');
  const posthocValues = useJSON<PosthocScaleCheck[]>('posthoc_scale_check.json');
  const posthocLabels = useJSON<PosthocScaleCheckLabels[]>('posthoc_scale_check_labels.json');
  const g2lRecords = useJSON<G2LRecord[]>('multi_setting_g2l.json');
  const retentionEdges = useJSON<RetentionEdge[]>('multi_setting_retention.json');
  const structure = useJSON<ReplicationStructure[]>('replication_structure_d015.json');
  const cfg = useJSON<ConfigData>('config.json');
  const meta = useJSON<{ rel_tol: number; eps: number }>('replication_meta.json');

  const [mode, setMode] = useState<'v2' | 'v1'>('v2');
  const [selectedMetric, setSelectedMetric] = useState('mean_strength_norm');
  const [selectedG2LMetric, setSelectedG2LMetric] = useState('transitivity_all');
  const [selectedG2LFig, setSelectedG2LFig] = useState('transitivity_all');
  const [scaleMetric, setScaleMetric] = useState('mean_abs_weight');

  const settingsHash = cfg?.config.hash ?? PENDING;
  const subA = cfg?.subjects.A ?? PENDING;
  const subB = cfg?.subjects.B ?? PENDING;
  const K = cfg ? cfg.density_settings.length : PENDING;
  const densRange = cfg ? `${cfg.density_settings[0].toFixed(2)} – ${cfg.density_settings[cfg.density_settings.length - 1].toFixed(2)}` : PENDING;
  const eps = meta?.eps ?? cfg?.eps;
  const relTol = meta?.rel_tol;
  const relTolPct = relTol !== undefined ? `${relTol * 100}%` : PENDING;
  const mainRow = structure?.find((r) => r.pair === 'main');
  const loading = !v1Values || !v2Values;

  const handleModeToggle = (newMode: 'v1' | 'v2') => {
    setMode(newMode);
    if (newMode === 'v1' && selectedMetric.endsWith('_norm')) {
      setSelectedMetric(selectedMetric.replace('_norm', ''));
    } else if (newMode === 'v2' && ['mean_strength', 'mean_strength_lcc', 'mean_abs_weight'].includes(selectedMetric)) {
      setSelectedMetric(`${selectedMetric}_norm`);
    }
  };

  // Panels for the small multiples, in the JSON's metric order.
  const v2Panels: PanelInfo[] = (v2Consistency ?? []).map((r) => ({ metric: r.metric, label: r.label, direction: r.direction }));
  const v1Panels: PanelInfo[] = (v1Consistency ?? []).map((r) => ({ metric: r.metric, label: r.label, direction: r.direction }));

  // Combined consistency table (v2 beside frozen v1)
  const combinedConsistency = (v2Consistency ?? []).map((v2) => ({
    metric: v2.metric,
    v1_label: v2.v1_label,
    v1_direction: v2.v1_direction,
    v2_label: v2.label,
    v2_direction: v2.direction,
    n_pos: v2.n_pos,
    n_neg: v2.n_neg,
    n_small: v2.n_small,
  }));

  const consistencyColumns: Column<any>[] = [
    { key: 'metric', header: 'Graph Metric', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span> },
    { key: 'v2_label', header: 'Protocol v2 label (primary)', render: (r) => <LabelBadge label={r.v2_label} direction={r.v2_direction} /> },
    { key: 'v1_label', header: 'Frozen v1 label', render: (r) => <LabelBadge label={r.v1_label} direction={r.v1_direction} /> },
    {
      key: 'counts',
      header: 'v2 densities (A>B / A<B / negligible)',
      align: 'center',
      render: (r) => <span className="mono" style={{ fontSize: '0.8rem' }}>{r.n_pos} / {r.n_neg} / {r.n_small}</span>,
    },
  ];

  // Global-to-local
  const g2lMetrics = Array.from(new Set((g2lRecords ?? []).map((r) => r.metric)));
  const filteredG2LNodes = (g2lRecords ?? []).filter((r) => r.metric === selectedG2LMetric && r.level === 'node').slice(0, 10);
  const g2lV1Label = filteredG2LNodes[0]?.label;
  const g2lV2 = v2Consistency?.find((r) => r.metric === selectedG2LMetric || r.metric === `${selectedG2LMetric}_norm`);

  const g2lNodeColumns: Column<G2LRecord>[] = [
    { key: 'rank', header: 'Rank', align: 'center', render: (r) => <span className="mono">#{r.rank}</span> },
    { key: 'node_label', header: 'Node (ICA component)', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.node_label} (#{r.node})</span> },
    { key: 'local_measure', header: 'Local Measure', render: (r) => <span className="badge badge-neutral mono">{r.local_measure}</span> },
    {
      key: 'mean_delta',
      header: 'Mean Difference (A − B)',
      align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 600 }}>
          {signed(r.mean_delta, 2)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.mean_delta > 0 ? 'A higher' : r.mean_delta < 0 ? 'B higher' : 'equal'})</span>
        </span>
      ),
    },
    { key: 'sign_agreement', header: 'Sign Agreement', align: 'right', render: (r) => <span className="mono">{r.sign_agreement.toFixed(2)}</span> },
  ];

  // Retention
  const topRetentionEdges = [...(retentionEdges ?? [])].sort((a, b) => Math.abs(b.dP) - Math.abs(a.dP)).slice(0, 15);
  const nKeptOnce = retentionEdges?.length ?? PENDING;
  const nSameRetention = retentionEdges ? retentionEdges.filter((e) => e.dP === 0).length : PENDING;
  const retentionColumns: Column<RetentionEdge>[] = [
    { key: 'labels', header: 'Edge (Nodes)', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.label_i} — {r.label_j}</span> },
    { key: 'count_A', header: `Count A (of ${K})`, align: 'center', render: (r) => <span className="mono">{r.count_A} / {K}</span> },
    { key: 'count_B', header: `Count B (of ${K})`, align: 'center', render: (r) => <span className="mono">{r.count_B} / {K}</span> },
    { key: 'P_A', header: 'P_A(e)', align: 'right', render: (r) => <span className="mono">{r.P_A.toFixed(2)}</span> },
    { key: 'P_B', header: 'P_B(e)', align: 'right', render: (r) => <span className="mono">{r.P_B.toFixed(2)}</span> },
    { key: 'dP', header: 'ΔP(e) = P_A − P_B', align: 'right', render: (r) => <span className="mono" style={{ fontWeight: 700 }}>{signed(r.dP, 2)}</span> },
  ];

  // Post-hoc scale check
  const scaleLabel = posthocLabels?.find((r) => r.metric === scaleMetric);
  const reversed = scaleLabel ? scaleLabel.raw_direction !== scaleLabel.normalised_direction : false;
  const awLabel = posthocLabels?.find((r) => r.metric === 'mean_abs_weight');

  const g2lFigures = [
    { id: 'transitivity_all', label: 'Transitivity (All)' },
    { id: 'transitivity_lcc', label: 'Transitivity (LCC)' },
    { id: 'largest_component_size', label: 'Largest Component Size' },
    { id: 'n_components', label: 'Number of Components' },
    { id: 'n_isolated', label: 'Isolated Nodes' },
    { id: 'mean_strength', label: 'Mean Strength' },
    { id: 'mean_strength_lcc', label: 'Mean Strength (LCC)' },
    { id: 'share_negative_edges', label: 'Share of Negative Edges' },
    { id: 'mean_abs_weight', label: 'Mean |w|' },
  ];

  const nConsistentV2 = v2Panels.filter((p) => labelCat(p.label) === 'consistent').length;
  const nConsistentV1 = v1Panels.filter((p) => labelCat(p.label) === 'consistent').length;
  const panels = mode === 'v2' ? v2Panels : v1Panels;
  const panelRows = (mode === 'v2' ? v2Values : v1Values) as any[] | null;

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-neutral">Multi-Setting Evaluation</span>
          <span className="badge badge-neutral mono">{K} densities ({densRange})</span>
        </div>
        <h1 className="page-title">Multi-Density Analysis & Setting Sensitivity</h1>
        <p className="page-subtitle">
          Does a difference between A ({subA}) and B ({subB}) keep its direction when the graph is built at a different density? Protocol v2 (primary) is shown beside the frozen v1 rule throughout.
        </p>
        <Link to="/limitations" className="badge badge-neutral mono" style={{ marginTop: '0.5rem' }} title="View limitations and data provenance">Settings ID: {settingsHash}</Link>
      </div>

      <CaveatBanner />

      {/* 1. Small multiples */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <Grid3x3 size={20} style={{ color: 'var(--accent-blue)' }} />
          Every metric across all {K} densities
        </h2>
        <div style={{ marginBottom: '1rem' }}>
          <ModeToggle mode={mode} onChange={handleModeToggle} />
        </div>
        <ChartCard
          title={mode === 'v2'
            ? `Protocol v2: ${nConsistentV2} of ${v2Panels.length} metrics keep one direction at every density; clustering of the largest component changes sign`
            : `Frozen v1: ${nConsistentV1} of ${v1Panels.length} metrics labelled setting-consistent on raw values, with no minimum gap`}
          caption={mode === 'v2'
            ? <>One panel per metric: ΔM(d) = A − B at each density, zero line in black, and the grey band is the {relTolPct} minimum gap (differences inside it count as negligible). Panel badge = protocol v2 label; line colour follows the label (green setting-consistent, amber partially consistent, purple/pink construction-sensitive). Strength and |w| are divided by each subject's own mean |w|. Switch to frozen v1 to see the original labels.</>
            : <>Same panels with the frozen v1 rule: raw values (strength and |w| not normalised), no minimum gap, so any non-zero difference counts. Panel badge = frozen v1 label. Compare with the protocol v2 view, which is primary.</>}
          sources={mode === 'v2' ? ['protocol_v2_values.json', 'protocol_v2_consistency.json', 'replication_meta.json'] : ['multi_setting_values.json', 'multi_setting_consistency.json']}
        >
          {panelRows && panels.length > 0 && eps !== undefined && relTol !== undefined ? (
            <SmallMultiples rows={panelRows} panels={panels} mode={mode} eps={eps} relTol={relTol} />
          ) : (
            <div style={{ height: 400 }}>Loading charts…</div>
          )}
        </ChartCard>

        <ChartCard
          title="Sign of ΔM at each density under protocol v2: fragmentation and normalised strength never change sign, while clustering of the largest component does"
          caption={<>Each cell is one metric at one density: + means A &gt; B, − means A &lt; B, ≈0 means the gap is below {relTolPct} (negligible). A row with one sign and no ≈0 is setting-consistent; one sign with some ≈0 is partially consistent; both signs is construction-sensitive. Orange/purple mark which subject is higher (not edge sign).</>}
          sources={['protocol_v2_values.json', 'replication_meta.json']}
          minWidth={520}
        >
          {v2Values && v2Panels.length > 0 && eps !== undefined && relTol !== undefined ? (
            <ConsistencyStrip rows={v2Values as any} panels={v2Panels} eps={eps} relTol={relTol} />
          ) : (
            <div style={{ height: 300 }}>Loading chart…</div>
          )}
        </ChartCard>
      </section>

      {/* 2. Single metric explorer */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <Sliders size={20} style={{ color: 'var(--accent-blue)' }} />
          One metric in detail
        </h2>
        <p className="section-lead">
          Pick a metric to see ΔM(d) = A − B (left) and the values of A and B themselves (right). In protocol v2 the shaded band is the {relTolPct} minimum gap at each density. The view switch above applies here too.
        </p>
        <div className="grid-2">
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Difference ΔM(d)
            </h3>
            {loading ? <div>Loading chart…</div> : (
              <PlotlyDeltaChart v1Values={v1Values!} v2Values={v2Values!} mode={mode} selectedMetric={selectedMetric} onMetricChange={setSelectedMetric} />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Values of A and B
            </h3>
            {loading ? <div>Loading chart…</div> : (
              <PlotlyTrajectoryChart v1Values={v1Values!} v2Values={v2Values!} mode={mode} selectedMetric={selectedMetric} />
            )}
          </div>
        </div>
      </section>

      {/* 3. Consistency table */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <Activity size={20} style={{ color: 'var(--accent-blue)' }} />
          Labels: protocol v2 beside frozen v1 (pair {subA} vs {subB})
        </h2>
        <p className="section-lead">
          Frozen v1: setting-consistent only if all {K} raw deltas share one sign. Protocol v2: strength and |w| normalised, a density counts only if the gap is above {relTolPct}, and &quot;partially consistent&quot; is added. Both are shown; v2 is primary.
        </p>
        {v2Consistency ? <DataTable data={combinedConsistency} columns={consistencyColumns} pageSize={15} /> : <div>Loading…</div>}
      </section>

      {/* 4. Post-hoc scale check */}
      <section className="card" style={{ marginBottom: '2.5rem' }}>
        <h2 className="card-title">
          <Scale size={20} style={{ color: 'var(--accent-blue)' }} />
          Post-hoc scale check (C22S): mean |w| reverses after normalising
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p>
            Under the frozen v1 rule, <strong>mean_abs_weight</strong> was labelled {awLabel ? <LabelBadge label={awLabel.raw_label} direction={awLabel.raw_direction} /> : PENDING} on raw values. The whole-matrix mean |w| differs between the subjects: {mainRow ? mainRow.mean_abs_w_all_A.toFixed(3) : PENDING} for A and {mainRow ? mainRow.mean_abs_w_all_B.toFixed(3) : PENDING} for B. After dividing each subject&apos;s values by their own whole-matrix mean |w|, the direction becomes {awLabel ? <strong>{awLabel.normalised_direction}</strong> : PENDING} at all {K} densities: relative to their own overall scale, B&apos;s kept edges are stronger than A&apos;s. This check was done after seeing the v1 result and is labelled post-hoc.
          </p>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <label htmlFor="scale-metric" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Metric:</label>
            <select id="scale-metric" className="select-input" value={scaleMetric} onChange={(e) => setScaleMetric(e.target.value)}>
              {(posthocLabels ?? []).map((r) => <option key={r.metric} value={r.metric}>{r.metric}</option>)}
            </select>
          </div>
          <ChartCard
            title={scaleLabel
              ? reversed
                ? `${metricName(scaleMetric).replace(' (raw)', '')}: raw ΔM says ${scaleLabel.raw_direction}, normalised ΔM says ${scaleLabel.normalised_direction} at every density`
                : `${metricName(scaleMetric).replace(' (raw)', '')}: ${scaleLabel.raw_direction} both before and after normalising`
              : 'Raw vs normalised ΔM'}
            caption={<>Dashed grey line: raw ΔM from the frozen v1 run. Solid line: ΔM after dividing each subject&apos;s value by their own whole-matrix mean |w|. Notice where the solid line sits relative to zero: {reversed ? 'it is on the other side of zero from the raw line, so the raw result was a per-subject scale effect.' : 'it stays on the same side as the raw line, so the direction is not a scale effect.'}</>}
            sources={['multi_setting_values.json', 'posthoc_scale_check.json', 'posthoc_scale_check_labels.json']}
          >
            {v1Values && posthocValues ? <ScaleCheckChart rawRows={v1Values as any} normRows={posthocValues as any} metric={scaleMetric} /> : <div style={{ height: 330 }}>Loading chart…</div>}
          </ChartCard>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Raw (frozen v1) label</th>
                  <th>Normalised label</th>
                  <th>Normalised densities (A&gt;B / A&lt;B)</th>
                </tr>
              </thead>
              <tbody>
                {(posthocLabels ?? []).map((r) => (
                  <tr key={r.metric}>
                    <td className="mono">{r.metric}</td>
                    <td><LabelBadge label={r.raw_label} direction={r.raw_direction} /></td>
                    <td>
                      <LabelBadge label={r.normalised_label} direction={r.normalised_direction} />
                      {r.raw_direction !== r.normalised_direction && <strong style={{ marginLeft: '0.4rem', color: 'var(--badge-partial-text)' }}>direction reversed</strong>}
                    </td>
                    <td className="mono">{r.n_pos} / {r.n_neg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Global-to-local */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
          Global-to-local: which nodes change together with the global difference
        </h2>
        <p className="section-lead">
          For each metric, nodes (ICA components) are ranked by the size of their local change across the {K} densities. Sign agreement is the share of densities where the node&apos;s change has the same sign as the global ΔM. This is descriptive co-occurrence across densities, not a causal link.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label htmlFor="g2l-metric" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Metric:</label>
          <select id="g2l-metric" className="select-input" value={selectedG2LMetric} onChange={(e) => setSelectedG2LMetric(e.target.value)}>
            {g2lMetrics.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {g2lV2 && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>v2: <LabelBadge label={g2lV2.label} direction={g2lV2.direction} /></span>}
          {g2lV1Label && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>frozen v1: <LabelBadge label={g2lV1Label} /></span>}
        </div>

        <ChartCard
          title={filteredG2LNodes.length > 0
            ? `${metricName(selectedG2LMetric)}: the 10 nodes with the largest mean |${filteredG2LNodes[0].local_measure}| across densities`
            : 'Top 10 nodes'}
          caption={<>Nodes are ranked by mean |local change| across the {K} densities; each bar is the signed mean change (A − B), orange where A is higher, purple where B is higher. Hover for the sign agreement with the global ΔM: values near 1 mean the node changes in the same direction as the whole network at most densities. Global-to-local was computed in the multi-density run (C21/C22), whose labels are frozen v1.</>}
          sources={['multi_setting_g2l.json']}
          minWidth={420}
        >
          {filteredG2LNodes.length > 0 ? <G2LBarChart records={filteredG2LNodes} /> : <div style={{ height: 360 }}>Loading chart…</div>}
        </ChartCard>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Top 10 nodes (table)</h3>
          <DataTable data={filteredG2LNodes} columns={g2lNodeColumns} pageSize={10} />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Global-to-Local Figure Panels (notebook)
            </h3>
            <select className="select-input" value={selectedG2LFig} onChange={(e) => setSelectedG2LFig(e.target.value)} aria-label="Global-to-local figure">
              {g2lFigures.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_g2l_${selectedG2LFig}.png`} alt={`Global-to-Local panel for ${selectedG2LFig}`} loading="lazy" />
            <div className="figure-caption">
              <strong>Figure G2L:</strong> Multi-density profile and the top local changes that go together with the global difference for {selectedG2LFig}. (Figure titles reflect frozen v1 labels.)
            </div>
          </div>
        </div>
      </section>

      {/* 6. Retention */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <GitMerge size={20} style={{ color: 'var(--accent-blue)' }} />
          Edge retention across densities
        </h2>
        <p className="section-lead">
          P_A(e) is the share of the {K} densities at which A keeps edge e; ΔP(e) = P_A(e) − P_B(e). Only edges kept at least once in A or B are counted ({nKeptOnce} edges). Raw weights are not shown (HCP data-use terms).
        </p>
        <div className="grid-2">
          <ChartCard
            title={`${nSameRetention} of ${nKeptOnce} edges are kept equally often in A and B; the rest spread to both sides`}
            caption={<>Histogram of ΔP(e) in steps of 1/{K}. Notice the bars at ±1: edges that one subject keeps at every density and the other never keeps.</>}
            sources={['multi_setting_retention.json']}
          >
            {retentionEdges && cfg ? <RetentionHistogram edges={retentionEdges} K={cfg.density_settings.length} /> : <div style={{ height: 320 }}>Loading chart…</div>}
          </ChartCard>
          <ChartCard
            title="P_A vs P_B: each dot is one edge; numbers give the edge count in each cell"
            caption={<>Dots are jittered slightly so overlapping edges stay visible. Edges on the dotted diagonal are kept equally often in both subjects; the top-right cell holds edges both subjects keep at all {K} densities.</>}
            sources={['multi_setting_retention.json']}
          >
            {retentionEdges && cfg ? <RetentionScatter edges={retentionEdges} K={cfg.density_settings.length} /> : <div style={{ height: 420 }}>Loading chart…</div>}
          </ChartCard>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Edges with the largest |ΔP|
          </h3>
          <DataTable data={topRetentionEdges} columns={retentionColumns} pageSize={10} />
        </div>
      </section>

      {/* 7. Notebook figures */}
      <section>
        <h2 className="section-title">Heatmaps, Profiles & Retention Figures (notebook)</h2>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_node_degree_heatmap.png`} alt="Node Degree Heatmap" loading="lazy" />
            <div className="figure-caption">
              <strong>Figure AB5:</strong> Node degree change A − B for all 100 ICA components across the {K} densities (notebook colour scale: red = A higher, blue = B higher; not edge sign).
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_node_strength_heatmap.png`} alt="Node Strength Heatmap" loading="lazy" />
            <div className="figure-caption">
              <strong>Figure AB6:</strong> Normalised node strength change A − B across the {K} densities (notebook colour scale: red = A higher, blue = B higher; not edge sign).
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_delta_profiles.png`} alt="Notebook figure: A − B for each metric across the densities" loading="lazy" />
            <div className="figure-caption">
              <strong>Figure AB9:</strong> Notebook figure of ΔM(d) = A − B for each of the 11 metrics across the densities. Panel titles use the <strong>frozen v1</strong> labels (raw values, no minimum gap); the small multiples above show the protocol v2 labels. In this figure only, red/blue dots mark the direction of ΔM (A &gt; B / A &lt; B), not edge sign.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_values_vs_density.png`} alt="Notebook figure: metric values of A and B across the densities" loading="lazy" />
            <div className="figure-caption">
              <strong>Figure AB10:</strong> Notebook figure of the raw metric values of A (solid) and B (dashed) across the densities. Strength and weight panels show raw (frozen v1) values, before the per-subject scale normalisation used in protocol v2.
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_retention_matrix.png`} alt="Edge Retention Matrix" loading="lazy" />
            <div className="figure-caption">
              <strong>Figure AB7:</strong> Edge retention matrix across all node pairs.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_retention_hist.png`} alt="Differential Retention Histogram" loading="lazy" />
            <div className="figure-caption">
              <strong>Figure AB8:</strong> Histogram of differential retention ΔP across edges (notebook version of the interactive chart above).
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
