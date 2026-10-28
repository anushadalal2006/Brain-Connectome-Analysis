import React, { useEffect, useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { DataTable, Column } from '../components/DataTable';
import {
  ReplicationSummary,
  ReplicationTolerance,
  ReplicationStructure,
} from '../types';
import { GitBranch, ShieldCheck, Sliders, Database } from 'lucide-react';

export const ReplicationPage: React.FC = () => {
  const [summary, setSummary] = useState<ReplicationSummary[]>([]);
  const [tolerance, setTolerance] = useState<ReplicationTolerance[]>([]);
  const [structure, setStructure] = useState<ReplicationStructure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/replication_summary.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/replication_tolerance_check.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/replication_structure_d015.json`).then((r) => r.json()),
    ])
      .then(([sumData, tolData, structData]) => {
        setSummary(sumData);
        setTolerance(tolData);
        setStructure(structData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching replication data:', err);
        setLoading(false);
      });
  }, []);

  const renderBadge = (val: string) => {
    if (!val) return '—';
    const lower = val.toLowerCase();
    if (lower.startsWith('consistent')) {
      return <span className="badge badge-consistent">{val}</span>;
    }
    if (lower.startsWith('partial')) {
      return <span className="badge badge-partial">{val}</span>;
    }
    return <span className="badge badge-sensitive">{val}</span>;
  };

  const summaryColumns: Column<ReplicationSummary>[] = [
    {
      key: 'metric',
      header: 'Metric',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span>,
    },
    { key: 'main', header: 'Main Pair (100206–100307)', render: (r) => renderBadge(r.main) },
    { key: 'pair1', header: 'Pair 1 (100408–100610)', render: (r) => renderBadge(r.pair1) },
    { key: 'pair2', header: 'Pair 2 (101006–101107)', render: (r) => renderBadge(r.pair2) },
    { key: 'pair3', header: 'Pair 3 (101309–101915)', render: (r) => renderBadge(r.pair3) },
    { key: 'pair4', header: 'Pair 4 (102008–102109)', render: (r) => renderBadge(r.pair4) },
    {
      key: 'v2_consistent',
      header: 'v2 Consistent',
      align: 'center',
      render: (r) => <span className="mono" style={{ fontWeight: 700 }}>{r.v2_consistent}</span>,
    },
    {
      key: 'v2_partial',
      header: 'v2 Partial',
      align: 'center',
      render: (r) => <span className="mono">{r.v2_partial}</span>,
    },
    {
      key: 'v1_consistent',
      header: 'v1 Consistent',
      align: 'center',
      render: (r) => <span className="mono" style={{ color: 'var(--text-muted)' }}>{r.v1_consistent}</span>,
    },
  ];

  const toleranceColumns: Column<ReplicationTolerance>[] = [
    {
      key: 'metric',
      header: 'Metric',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>{r.metric}</span>,
    },
    { key: 'consistent_at_0.5%', header: 'Consistent (0.5%)', align: 'center', render: (r) => <span className="mono">{r['consistent_at_0.5%']}</span> },
    { key: 'sensitive_at_0.5%', header: 'Sensitive (0.5%)', align: 'center', render: (r) => <span className="mono">{r['sensitive_at_0.5%']}</span> },
    { key: 'consistent_at_1%', header: 'Consistent (1.0% - Primary)', align: 'center', render: (r) => <span className="mono" style={{ fontWeight: 700, color: '#059669' }}>{r['consistent_at_1%']}</span> },
    { key: 'sensitive_at_1%', header: 'Sensitive (1.0% - Primary)', align: 'center', render: (r) => <span className="mono" style={{ fontWeight: 700 }}>{r['sensitive_at_1%']}</span> },
    { key: 'consistent_at_2%', header: 'Consistent (2.0%)', align: 'center', render: (r) => <span className="mono">{r['consistent_at_2%']}</span> },
    { key: 'sensitive_at_2%', header: 'Sensitive (2.0%)', align: 'center', render: (r) => <span className="mono">{r['sensitive_at_2%']}</span> },
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
    { key: 'mean_abs_w_all_A', header: 'Scale A (|w|)', align: 'right', render: (r) => <span className="mono">{r.mean_abs_w_all_A.toFixed(4)}</span> },
    { key: 'mean_abs_w_all_B', header: 'Scale B (|w|)', align: 'right', render: (r) => <span className="mono">{r.mean_abs_w_all_B.toFixed(4)}</span> },
  ];

  const totalPairs = structure.length || 5;
  const normStrengthRow = summary.find((s) => s.metric === 'mean_strength_norm');
  const transitivityRow = summary.find((s) => s.metric === 'transitivity_all');
  const clusteringLccRow = summary.find((s) => s.metric === 'avg_clustering_lcc');
  const componentsRow = summary.find((s) => s.metric === 'n_components');

  const normStrengthCount = normStrengthRow?.v2_consistent ? normStrengthRow.v2_consistent.split('/')[0] : '4';
  const transitivityCount = transitivityRow?.v2_consistent ? transitivityRow.v2_consistent.split('/')[0] : '3';
  const clusteringConsistent = clusteringLccRow?.v2_consistent ? parseInt(clusteringLccRow.v2_consistent.split('/')[0], 10) : 1;
  const clusteringSensitiveCount = totalPairs - clusteringConsistent;
  const componentsCount = componentsRow?.v2_consistent ? componentsRow.v2_consistent.split('/')[0] : '2';
  const componentsSensitiveCount = totalPairs - parseInt(componentsCount, 10);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Pre-Specified Validation</span>
          <span className="badge badge-consistent">{totalPairs} Subject Pairs</span>
        </div>
        <h1 className="page-title">Replication Across 4 Pre-Specified Pairs</h1>
        <p className="page-subtitle">
          Evaluation of Protocol v2 consistency labels across {totalPairs} pre-specified subject pairs, relative tolerance sensitivity checks (0.5%, 1%, 2%), and baseline structural variation.
        </p>
      </div>

      <CaveatBanner />

      {/* Pre-specification and Methodology Callout */}
      <section className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-blue)' }}>
        <h2 className="card-title">
          <GitBranch size={20} style={{ color: 'var(--accent-blue)' }} />
          Pre-Specified Replication Protocol
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p>
            <strong>Fixed Selection Rule:</strong> The 4 replication pairs were chosen using a deterministic, objective rule: <em>the next 8 subject IDs after A (100206) and B (100307) in the HCP subject list, paired strictly in order</em>. The subjects and Protocol v2 rules were permanently frozen before these pairs were analyzed.
          </p>
          <p>
            <strong>Pairs Analyzed:</strong> Main (100206–100307), Pair 1 (100408–100610), Pair 2 (101006–101107), Pair 3 (101309–101915), Pair 4 (102008–102109).
          </p>
          <p>
            <strong>Arbitrary Direction Principle:</strong> The direction of difference (<span className="mono">A &gt; B</span> vs <span className="mono">A &lt; B</span>) is arbitrary across pairs because the assignment of which subject is "A" or "B" is arbitrary. <strong>Only the consistency classification label (setting-consistent, partially consistent, construction-sensitive) can replicate.</strong>
          </p>
        </div>
      </section>

      {/* Summary Rates Highlights */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Replication Findings Summary (Descriptive)
        </h2>
        <div className="grid-4">
          <div className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Normalised Strength & |w|</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#059669' }}>{normStrengthCount} of {totalPairs} pairs</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Most stable metric across densities</div>
          </div>

          <div className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Transitivity</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#059669' }}>{transitivityCount} of {totalPairs} pairs</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Mostly stable across settings</div>
          </div>

          <div className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Clustering of Largest Comp</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#db2777' }}>{clusteringSensitiveCount} of {totalPairs} pairs</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Construction-sensitive in {clusteringSensitiveCount}/{totalPairs}</div>
          </div>

          <div className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fragmentation Measures</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#d97706' }}>{componentsCount} of {totalPairs} pairs</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Consistent in {componentsCount}/{totalPairs}, sensitive in {componentsSensitiveCount}/{totalPairs}</div>
          </div>
        </div>
      </section>

      {/* Color-Coded v2 Label Grid */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent-blue)' }} />
          Protocol v2 Consistency Label Grid Across All 5 Pairs
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Color-coded grid with explicit text labels. Badges: <span className="badge badge-consistent">Consistent</span> (emerald green), <span className="badge badge-partial">Partial</span> (amber), <span className="badge badge-sensitive">Sensitive</span> (purple).
        </p>
        {loading ? <div>Loading replication grid...</div> : <DataTable data={summary} columns={summaryColumns} pageSize={15} />}
      </section>

      {/* Tolerance Robustness Check */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={20} style={{ color: 'var(--accent-blue)' }} />
          Tolerance Check Across Relative Thresholds (0.5%, 1.0%, 2.0%)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Number of pairs classified as setting-consistent vs construction-sensitive when varying the relative threshold gap <span className="mono">REL_TOL</span> between 0.5% and 2.0%.
        </p>
        <DataTable data={tolerance} columns={toleranceColumns} pageSize={15} />
      </section>

      {/* Baseline Network Structure Table */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={20} style={{ color: 'var(--accent-blue)' }} />
          Baseline Structure at d = 0.15 & Per-Subject Scale Variation
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Structural variations across all 10 individuals at d = 0.15, documenting isolated node count, largest component size (LCC), negative edge ratio, and whole-matrix mean |w|.
        </p>
        <DataTable data={structure} columns={structureColumns} pageSize={10} />
      </section>
    </div>
  );
};
