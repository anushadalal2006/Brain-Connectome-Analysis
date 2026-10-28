import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaveatBanner } from '../components/CaveatBanner';
import { PlotlyDeltaChart } from '../components/PlotlyDeltaChart';
import { PlotlyTrajectoryChart } from '../components/PlotlyTrajectoryChart';
import { DataTable, Column } from '../components/DataTable';
import {
  MultiSettingValues,
  ProtocolV2Values,
  ConsistencyRecord,
  ProtocolV2Consistency,
  PosthocScaleCheckLabels,
  G2LRecord,
  RetentionEdge,
} from '../types';
import { Layers, Sliders, Activity, Scale } from 'lucide-react';

export const MultiDensityPage: React.FC = () => {
  const [v1Values, setV1Values] = useState<MultiSettingValues[]>([]);
  const [v2Values, setV2Values] = useState<ProtocolV2Values[]>([]);
  const [v1Consistency, setV1Consistency] = useState<ConsistencyRecord[]>([]);
  const [v2Consistency, setV2Consistency] = useState<ProtocolV2Consistency[]>([]);
  const [posthocLabels, setPosthocLabels] = useState<PosthocScaleCheckLabels[]>([]);
  const [g2lRecords, setG2lRecords] = useState<G2LRecord[]>([]);
  const [retentionEdges, setRetentionEdges] = useState<RetentionEdge[]>([]);
  const [mainScaleA, setMainScaleA] = useState<number | null>(null);
  const [mainScaleB, setMainScaleB] = useState<number | null>(null);

  const [mode, setMode] = useState<'v2' | 'v1'>('v2');
  const [selectedMetric, setSelectedMetric] = useState('mean_strength_norm');
  const [selectedG2LMetric, setSelectedG2LMetric] = useState('transitivity_all');
  const [selectedG2LFig, setSelectedG2LFig] = useState('transitivity_all');
  const [loading, setLoading] = useState(true);
  const [settingsHash, setSettingsHash] = useState('f1ebb3fdc3');

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/multi_setting_values.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/protocol_v2_values.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/multi_setting_consistency.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/protocol_v2_consistency.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/posthoc_scale_check.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/posthoc_scale_check_labels.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/multi_setting_g2l.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/multi_setting_retention.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/replication_structure_d015.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/config.json`).then((r) => r.json()),
    ])
      .then(([v1V, v2V, v1C, v2C, _phV, phL, g2lD, retD, structD, cfg]) => {
        setV1Values(v1V);
        setV2Values(v2V);
        setV1Consistency(v1C);
        setV2Consistency(v2C);
        setPosthocLabels(phL);
        setG2lRecords(g2lD);
        setRetentionEdges(retD);
        const mainRow = (structD as Array<{pair: string; mean_abs_w_all_A: number; mean_abs_w_all_B: number}>).find((r) => r.pair === 'main');
        if (mainRow) {
          setMainScaleA(mainRow.mean_abs_w_all_A);
          setMainScaleB(mainRow.mean_abs_w_all_B);
        }
        if (cfg?.config?.hash) {
          setSettingsHash(cfg.config.hash);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching multi-density data:', err);
        setLoading(false);
      });
  }, []);

  const handleModeToggle = (newMode: 'v1' | 'v2') => {
    setMode(newMode);
    if (newMode === 'v1' && selectedMetric.endsWith('_norm')) {
      setSelectedMetric(selectedMetric.replace('_norm', ''));
    } else if (newMode === 'v2' && !selectedMetric.endsWith('_norm') && ['mean_strength', 'mean_strength_lcc', 'mean_abs_weight'].includes(selectedMetric)) {
      setSelectedMetric(`${selectedMetric}_norm`);
    }
  };

  // Combined Consistency Table Data
  const combinedConsistency = React.useMemo(() => {
    return v2Consistency.map((v2) => {
      const v1 = v1Consistency.find((item) => item.metric === v2.metric.replace('_norm', ''));
      return {
        metric: v2.metric,
        v1_label: v2.v1_label,
        v1_direction: v2.v1_direction,
        v2_label: v2.label,
        v2_direction: v2.direction,
        n_pos: v2.n_pos,
        n_neg: v2.n_neg,
        n_small: v2.n_small,
        s_m: v1 ? v1.S_M : 1,
      };
    });
  }, [v2Consistency, v1Consistency]);

  const consistencyColumns: Column<any>[] = [
    {
      key: 'metric',
      header: 'Graph Metric',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span>,
    },
    {
      key: 'v1_label',
      header: 'Frozen v1 Label',
      render: (r) => (
        <span
          className={`badge ${
            r.v1_label === 'setting-consistent' ? 'badge-consistent' : 'badge-sensitive'
          }`}
        >
          {r.v1_label} ({r.v1_direction})
        </span>
      ),
    },
    {
      key: 'v2_label',
      header: 'Revised Protocol v2 Label',
      render: (r) => {
        let badgeClass = 'badge-sensitive';
        if (r.v2_label === 'setting-consistent') badgeClass = 'badge-consistent';
        if (r.v2_label === 'partially consistent') badgeClass = 'badge-partial';
        return (
          <span className={`badge ${badgeClass}`}>
            {r.v2_label} ({r.v2_direction})
          </span>
        );
      },
    },
    {
      key: 'counts',
      header: 'v2 Densities (pos / neg / small)',
      align: 'center',
      render: (r) => (
        <span className="mono" style={{ fontSize: '0.8rem' }}>
          {r.n_pos} pos / {r.n_neg} neg / {r.n_small} small
        </span>
      ),
    },
  ];

  // G2L Nodes Filtered
  const filteredG2LNodes = React.useMemo(() => {
    return g2lRecords.filter((r) => r.metric === selectedG2LMetric && r.level === 'node').slice(0, 10);
  }, [g2lRecords, selectedG2LMetric]);

  const g2lNodeColumns: Column<G2LRecord>[] = [
    { key: 'rank', header: 'Rank', align: 'center', render: (r) => <span className="mono">#{r.rank}</span> },
    { key: 'node_label', header: 'Node', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.node_label} (#{r.node})</span> },
    { key: 'local_measure', header: 'Local Measure', render: (r) => <span className="badge badge-neutral mono">{r.local_measure}</span> },
    {
      key: 'mean_delta',
      header: 'Mean Difference (A − B)',
      align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 600, color: r.mean_delta > 0 ? '#059669' : '#dc2626' }}>
          {r.mean_delta > 0 ? `+${r.mean_delta.toFixed(2)}` : r.mean_delta.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'sign_agreement',
      header: 'Sign Agreement',
      align: 'right',
      render: (r) => <span className="mono">{r.sign_agreement.toFixed(2)}</span>,
    },
  ];

  // Top Retention Edges by |dP|
  const topRetentionEdges = React.useMemo(() => {
    return [...retentionEdges].sort((a, b) => Math.abs(b.dP) - Math.abs(a.dP)).slice(0, 15);
  }, [retentionEdges]);

  const retentionColumns: Column<RetentionEdge>[] = [
    { key: 'labels', header: 'Edge (Nodes)', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.label_i} — {r.label_j}</span> },
    { key: 'count_A', header: 'Count A (of 6)', align: 'center', render: (r) => <span className="mono">{r.count_A} / 6</span> },
    { key: 'count_B', header: 'Count B (of 6)', align: 'center', render: (r) => <span className="mono">{r.count_B} / 6</span> },
    { key: 'P_A', header: 'P_A(e)', align: 'right', render: (r) => <span className="mono">{r.P_A.toFixed(2)}</span> },
    { key: 'P_B', header: 'P_B(e)', align: 'right', render: (r) => <span className="mono">{r.P_B.toFixed(2)}</span> },
    {
      key: 'dP',
      header: 'ΔP(e) = P_A − P_B',
      align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 700, color: r.dP > 0 ? '#059669' : r.dP < 0 ? '#dc2626' : 'inherit' }}>
          {r.dP > 0 ? `+${r.dP.toFixed(2)}` : r.dP.toFixed(2)}
        </span>
      ),
    },
  ];

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

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Multi-Setting Evaluation</span>
          <span className="badge badge-blue mono">6 Densities (0.05 – 0.30)</span>
        </div>
        <h1 className="page-title">Multi-Density Analysis & Setting Sensitivity</h1>
        <p className="page-subtitle">
          Evaluation of connectome metric stability across six proportional densities (K = 6), side-by-side consistency protocols, post-hoc scale check, and Global-to-Local local change associations.
        </p>
        <Link to="/limitations" className="badge badge-muted mono" style={{ marginTop: '0.5rem' }} title="View limitations and data provenance">Settings ID: {settingsHash}</Link>
      </div>

      <CaveatBanner />



      {/* Interactive Plotly Charts */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={20} style={{ color: 'var(--accent-blue)' }} />
          Interactive Metric Trajectories Across Densities
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Compare metric difference <span className="mono">ΔM(d) = A − B</span> and individual subject trajectories across <span className="mono">d ∈ [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]</span>. Under Protocol v2, a shaded ±1% relative tolerance band (<span className="mono">±0.01 × mean(|A|, |B|)</span>) is dynamically rendered at each density.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>View:</span>
          <button
            type="button"
            className={`btn ${mode === 'v2' ? 'btn-primary' : ''}`}
            aria-pressed={mode === 'v2'}
            onClick={() => handleModeToggle('v2')}
          >
            Protocol v2 (normalised, ±1% band)
          </button>
          <button
            type="button"
            className={`btn ${mode === 'v1' ? 'btn-primary' : ''}`}
            aria-pressed={mode === 'v1'}
            onClick={() => handleModeToggle('v1')}
          >
            Frozen v1 (raw values, no band)
          </button>
        </div>

        <div className="grid-2">
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              1. Difference Trajectory ΔM(d)
            </h3>
            {loading ? (
              <div>Loading chart...</div>
            ) : (
              <PlotlyDeltaChart
                v1Values={v1Values}
                v2Values={v2Values}
                mode={mode}
                selectedMetric={selectedMetric}
                onMetricChange={setSelectedMetric}
              />
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              2. Absolute Subject Trajectories: A vs B
            </h3>
            {loading ? (
              <div>Loading chart...</div>
            ) : (
              <PlotlyTrajectoryChart
                v1Values={v1Values}
                v2Values={v2Values}
                mode={mode}
                selectedMetric={selectedMetric}
              />
            )}
          </div>
        </div>
      </section>

      {/* Consistency Table: Frozen v1 vs Revised v2 */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} style={{ color: 'var(--accent-blue)' }} />
          Metric Consistency Classifications (Pair 100206 vs 100307)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Side-by-side comparison of classifications under the frozen v1 rule (strict sign sharing) and revised protocol v2 (with 1% relative threshold and normalized weights).
        </p>
        <DataTable data={combinedConsistency} columns={consistencyColumns} pageSize={15} />
      </section>

      {/* Post-Hoc Scale Check Showcase */}
      <section className="card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
        <h2 className="card-title">
          <Scale size={20} style={{ color: 'var(--accent-blue)' }} />
          Post-Hoc Scale Check (Sign Reversal in mean |w|)
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p>
            Under the frozen v1 rule, <strong>mean_abs_weight</strong> was classified as setting-consistent with <span className="mono">A &gt; B</span> at all 6 densities. However, whole-matrix descriptive statistics revealed that Subject A has an overall higher baseline scale (<span className="mono">mean |w| = {mainScaleA !== null ? mainScaleA.toFixed(4) : '—'}</span>) than Subject B (<span className="mono">mean |w| = {mainScaleB !== null ? mainScaleB.toFixed(4) : '—'}</span>).
          </p>
          <p>
            When each subject's metric values were divided by their own whole-matrix mean |w|, the direction reversed completely to <strong>A &lt; B</strong> at all 6 densities. Subject B actually concentrates a larger proportion of their connectivity weight into their top 15% edges than Subject A.
          </p>

          <div className="table-container" style={{ marginTop: '0.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Raw v1 Label</th>
                  <th>Raw Direction</th>
                  <th>Normalized v2 Label</th>
                  <th>Normalized Direction</th>
                  <th>Concordance</th>
                </tr>
              </thead>
              <tbody>
                {posthocLabels.map((r, i) => (
                  <tr key={i} style={r.metric === 'mean_abs_weight' ? { background: 'var(--bg-tertiary)', fontWeight: 600 } : {}}>
                    <td className="mono">{r.metric}</td>
                    <td><span className="badge badge-consistent">{r.raw_label}</span></td>
                    <td className="mono">{r.raw_direction}</td>
                    <td><span className="badge badge-consistent">{r.normalised_label}</span></td>
                    <td className="mono" style={r.metric === 'mean_abs_weight' ? { color: 'var(--accent-red)', fontWeight: 700 } : {}}>
                      {r.normalised_direction} {r.metric === 'mean_abs_weight' && '⚠️ REVERSED'}
                    </td>
                    <td className="mono">{r.n_pos} pos / {r.n_neg} neg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Global-to-Local Analysis */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
          Global-to-Local Association
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Identifies <strong>nodes whose change goes together with the global difference</strong> across the six densities. This establishes descriptive co-occurrence and statistical association, not mathematical causality.
        </p>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select Metric for G2L Nodes:</span>
            <select
              value={selectedG2LMetric}
              onChange={(e) => setSelectedG2LMetric(e.target.value)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}
            >
              {Array.from(new Set(g2lRecords.map((r) => r.metric))).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <DataTable data={filteredG2LNodes} columns={g2lNodeColumns} pageSize={10} />
        </div>

        {/* Top Edges by Retention Difference dP */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Top Edge Alterations by Differential Retention (|ΔP| &gt; 0)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Edges exhibiting the largest retention disparity <span className="mono">ΔP(e) = P_A(e) − P_B(e)</span> across the 6 density settings. (Raw weights excluded under HCP Open Access Data Use Terms).
          </p>
          <DataTable data={topRetentionEdges} columns={retentionColumns} pageSize={10} />
        </div>

        {/* Global-to-Local Panel Selector */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Diagnostic G2L Panels
            </h3>
            <select
              value={selectedG2LFig}
              onChange={(e) => setSelectedG2LFig(e.target.value)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}
            >
              {g2lFigures.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="figure-wrapper">
            <img
              src={`${import.meta.env.BASE_URL}figures/AB_g2l_${selectedG2LFig}.png`}
              alt={`Global-to-Local panel for ${selectedG2LFig}`}
            />
            <div className="figure-caption">
              <strong>Figure G2L:</strong> Multi-density profile and the top local changes that go together with the global difference for {selectedG2LFig}. (Figure titles reflect frozen v1 labels).
            </div>
          </div>
        </div>
      </section>

      {/* Heatmaps and Retention Overview */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Heatmaps & Retention Diagnostics
        </h2>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_node_degree_heatmap.png`} alt="Node Degree Heatmap" />
            <div className="figure-caption">
              <strong>Figure AB5:</strong> Node degree evolution across the 6 density levels for all 100 ICA components.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_node_strength_heatmap.png`} alt="Node Strength Heatmap" />
            <div className="figure-caption">
              <strong>Figure AB6:</strong> Normalized node strength evolution across the 6 density levels.
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_retention_matrix.png`} alt="Edge Retention Matrix" />
            <div className="figure-caption">
              <strong>Figure AB7:</strong> Edge retention matrix indicating density persistence across all connections.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/AB_retention_hist.png`} alt="Differential Retention Histogram" />
            <div className="figure-caption">
              <strong>Figure AB8:</strong> Histogram of differential retention probabilities ΔP across network edges.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
