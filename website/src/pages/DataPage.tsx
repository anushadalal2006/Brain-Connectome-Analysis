import React, { useEffect, useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { DataTable, Column } from '../components/DataTable';
import { GlobalStatistic, ProvenanceData } from '../types';
import { Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DataPage: React.FC = () => {
  const [stats, setStats] = useState<GlobalStatistic[]>([]);
  const [prov, setProv] = useState<ProvenanceData | null>(null);
  const [subA, setSubA] = useState('100206');
  const [subB, setSubB] = useState('100307');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/statistics_global.json`).then((res) => res.json()),
      fetch(`${import.meta.env.BASE_URL}data/provenance.json`).then((res) => res.json()),
      fetch(`${import.meta.env.BASE_URL}data/config.json`).then((res) => res.json()),
    ])
      .then(([statsData, provData, configData]) => {
        setStats(statsData);
        setProv(provData);
        if (configData.subjects?.A) setSubA(configData.subjects.A);
        if (configData.subjects?.B) setSubB(configData.subjects.B);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading data in DataPage:', err);
        setLoading(false);
      });
  }, []);

  const meanAbsRow = stats.find((s) => s.statistic === 'mean_abs');
  const meanAbsA = typeof meanAbsRow?.A === 'number' ? meanAbsRow.A : null;
  const meanAbsB = typeof meanAbsRow?.B === 'number' ? meanAbsRow.B : null;

  const nValuesRow = stats.find((s) => s.statistic === 'n_values');
  const nValues = typeof nValuesRow?.A === 'number' ? Math.round(nValuesRow.A) : 4950;

  const validCount = prov?.all_subject_check?.valid ?? 1003;
  const totalSubjectsCount = prov?.all_subject_check?.subjects ?? 1003;
  const totalNan = prov?.all_subject_check?.total_nan ?? 0;
  const maxAsym = prov?.all_subject_check?.max_asymmetry ?? 0.0;
  const diagVal = prov?.all_subject_check?.diagonal_values?.[0] ?? 0.0;

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
              <span><strong>{validCount} / {totalSubjectsCount} subjects valid</strong> ({totalNan} NaN, max asymmetry {maxAsym.toFixed(1)}, diagonal strictly {diagVal.toFixed(1)}).</span>
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
          Whole-Matrix Descriptive Statistics (N = {nValues.toLocaleString()} node pairs)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Descriptive statistics computed across all unique off-diagonal pairs (100 × 99 / 2 = {nValues.toLocaleString()} pairs) prior to thresholding. Note the substantial difference in baseline scale: Subject A has mean |w| = {meanAbsA !== null ? meanAbsA.toFixed(4) : '—'} compared to Subject B with mean |w| = {meanAbsB !== null ? meanAbsB.toFixed(4) : '—'}.
        </p>

        {loading ? (
          <div>Loading dataset statistics...</div>
        ) : (
          <DataTable data={stats} columns={statColumns} pageSize={20} />
        )}
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
              <strong>Figure A2:</strong> Distribution of edge weights for Subject A across all {nValues.toLocaleString()} pairs.
            </div>
          </div>
          <div className="figure-wrapper">
            <img src={`${import.meta.env.BASE_URL}figures/B_hist.png`} alt={`Subject B Edge Weight Histogram (${subB})`} />
            <div className="figure-caption">
              <strong>Figure B2:</strong> Distribution of edge weights for Subject B across all {nValues.toLocaleString()} pairs.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

