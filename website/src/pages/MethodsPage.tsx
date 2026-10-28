import React, { useEffect, useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { KaTeX } from '../components/KaTeX';
import {
  Layers,
  AlertTriangle,
  Sliders,
  Code2,
  GitCommit,
  ShieldAlert
} from 'lucide-react';
import { ShortestPathSummary, ProvenanceData } from '../types';

export const MethodsPage: React.FC = () => {
  const [totalSubjects, setTotalSubjects] = useState(1003);
  const [undefinedNodesA, setUndefinedNodesA] = useState(85);
  const [undefinedNodesB, setUndefinedNodesB] = useState(74);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/provenance.json`)
      .then((r) => r.json())
      .then((prov: ProvenanceData) => {
        if (prov.all_subject_check?.subjects) {
          setTotalSubjects(prov.all_subject_check.subjects);
        }
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/shortest_path_summary.json`)
      .then((r) => r.json())
      .then((spList: ShortestPathSummary[]) => {
        const rowA = spList.find((s) => s.subject === 100206 || (s.subject as any) === '100206');
        const rowB = spList.find((s) => s.subject === 100307 || (s.subject as any) === '100307');
        if (rowA?.undefined) setUndefinedNodesA(rowA.undefined);
        if (rowB?.undefined) setUndefinedNodesB(rowB.undefined);
      })
      .catch(() => {});
  }, []);

  const steps = [
    { title: 'Load', desc: 'Import HCP netmats1 100-component arrays' },
    { title: 'Validate', desc: `Verify symmetry, no NaNs, null diagonal (${totalSubjects} subjects)` },
    { title: 'Preprocess', desc: 'Zero diagonal, preserve signed values (no 1/w)' },
    { title: 'Build Signed Graph', desc: 'Proportional density by |w|, ties by (i, j)' },
    { title: 'Statistics', desc: 'Descriptive distributions & edge summaries' },
    { title: 'Metrics', desc: 'Degree, clustering, transitivity, components, strength' },
    { title: 'BFS / DFS', desc: 'Tree reachability from source node 34 (IC035)' },
    { title: 'Bellman–Ford', desc: 'Negative cycle detection & path divergence' },
    { title: 'Compare', desc: 'Pairwise difference & edge overlap at d = 0.15' },
    { title: 'Multi-Density', desc: 'K = 6 density evaluations (d = 0.05 to 0.30)' },
    { title: 'Global-to-Local', desc: 'Link global ΔM to local node and edge alterations' },
    { title: 'Report', desc: 'Export report.md, tables, figures & settings hash' },
  ];

  const densities = [
    { density: '0.05', edges: Math.floor(0.05 * 4950 + 0.5), formula: 'floor(0.05 * 4950 + 0.5) = 248' },
    { density: '0.10', edges: Math.floor(0.10 * 4950 + 0.5), formula: 'floor(0.10 * 4950 + 0.5) = 495' },
    { density: '0.15', edges: Math.floor(0.15 * 4950 + 0.5), formula: 'floor(0.15 * 4950 + 0.5) = 743 (primary)' },
    { density: '0.20', edges: Math.floor(0.20 * 4950 + 0.5), formula: 'floor(0.20 * 4950 + 0.5) = 990' },
    { density: '0.25', edges: Math.floor(0.25 * 4950 + 0.5), formula: 'floor(0.25 * 4950 + 0.5) = 1238' },
    { density: '0.30', edges: Math.floor(0.30 * 4950 + 0.5), formula: 'floor(0.30 * 4950 + 0.5) = 1485' },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Pipeline Architecture</span>
          <span className="badge badge-neutral mono">Deterministic Execution</span>
        </div>
        <h1 className="page-title">Methodology & Algorithmic Formulation</h1>
        <p className="page-subtitle">
          Graph-theoretic construction, compatibility verification, Bellman–Ford negative-cycle analysis, mathematical formulation, and consistency classification protocols.
        </p>
      </div>

      <CaveatBanner />

      {/* Pipeline Diagram */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
          End-to-End Processing Pipeline
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {steps.map((s, idx) => (
            <div key={idx} className="card" style={{ padding: '1rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="badge badge-blue mono">Step {idx + 1}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {s.title}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Graph Construction & Compatibility Rules */}
      <section className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <h2 className="card-title">
            <Sliders size={20} style={{ color: 'var(--accent-blue)' }} />
            Graph Construction & Compatibility
          </h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>
              <strong>Strict Compatibility Check:</strong> Before any pairwise comparison or multi-setting execution, networks are checked to ensure they contain identical 100 nodes, identical labels (<span className="mono">IC001–IC100</span>), and identical ordering. Any mismatch immediately aborts execution.
            </p>
            <p>
              <strong>Identical Construction Settings:</strong> Both networks A and B are constructed with strictly identical settings at every density level, generating a single unique settings ID per density.
            </p>
            <p>
              <strong>Proportional Density Rule:</strong> Edges are ranked by descending absolute weight <KaTeX math="|w|" />. Ties are broken deterministically by index pair <KaTeX math="(i, j)" /> in ascending order (<span className="mono">abs_desc_then_ij</span>). The number of retained edges is:
            </p>
            <KaTeX math="m = \left\lfloor d \times 4950 + 0.5 \right\rfloor" block />
            <p>
              <strong>Negative Edges Preserved:</strong> Negative correlation weights are retained with their signed magnitude intact. No reciprocal or <KaTeX math="1/w" /> transformations are applied.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Code2 size={20} style={{ color: 'var(--accent-blue)' }} />
            Density Settings & Edge Counts (<KaTeX math="K = 6" />)
          </h2>
          <div className="table-container" style={{ marginTop: '0.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Density (<KaTeX math="d" />)</th>
                  <th>Edges (<KaTeX math="m" />)</th>
                  <th>Exact Rounding Formula</th>
                </tr>
              </thead>
              <tbody>
                {densities.map((row, i) => (
                  <tr key={i} style={row.density === '0.15' ? { background: 'var(--bg-tertiary)', fontWeight: 600 } : {}}>
                    <td className="mono">{row.density}</td>
                    <td className="mono">{row.edges}</td>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{row.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bellman-Ford Negative Cycle Mechanics */}
      <section className="card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--accent-red)' }}>
        <h2 className="card-title" style={{ color: 'var(--accent-red)' }}>
          <AlertTriangle size={20} />
          Why Shortest Paths are Undefined (Reachable Negative Cycles)
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p>
            In standard brain graph analysis, negative correlations are frequently discarded or arbitrarily converted to positive distances using ad-hoc inversions such as <KaTeX math="1/w" /> or <KaTeX math="1 - w" />. This project rejects such transformations and keeps original signed weights as edge costs.
          </p>
          <p>
            <strong>The Mathematical Mechanism:</strong> In an undirected network, any negative edge between nodes <KaTeX math="u" /> and <KaTeX math="v" /> with weight <KaTeX math="w < 0" /> creates an undirected 2-cycle:
          </p>
          <KaTeX math="u \longrightarrow v \longrightarrow u \quad \text{with cost } w + w = 2w < 0" block />
          <p>
            Because the cost of traversing this 2-cycle is strictly negative (<KaTeX math="2w < 0" />), any path originating from or reaching <KaTeX math="u" /> can traverse this cycle an arbitrary number of times to reduce its total cost towards <KaTeX math="-\infty" />.
          </p>
          <p>
            Consequently, the <strong>Bellman–Ford algorithm</strong> terminates with status <span className="mono">negative_cycle</span>. Distances to all {undefinedNodesA} nodes reachable in Subject A and {undefinedNodesB} nodes reachable in Subject B are mathematically undefined. Distance is only finite (0) to the source itself, while unreachable components remain disconnected (<KaTeX math="\infty" />). No shortest-path comparison is reported.
          </p>
        </div>
      </section>

      {/* Mathematical Formulas */}
      <section className="card" style={{ marginBottom: '2.5rem' }}>
        <h2 className="card-title">
          <GitCommit size={20} style={{ color: 'var(--accent-blue)' }} />
          Mathematical Formulations
        </h2>
        <div className="grid-3" style={{ marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              1. Pairwise Metric Difference
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Difference in graph metric <KaTeX math="M" /> evaluated on graphs <KaTeX math="G_A" /> and <KaTeX math="G_B" /> at density <KaTeX math="d" />:
            </p>
            <KaTeX math="\Delta M(d) = M(G_A(d)) - M(G_B(d))" block />
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              2. Sign-Consistency Score
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Fraction of non-zero delta observations sharing the dominant sign across all <KaTeX math="K = 6" /> densities:
            </p>
            <KaTeX math="S_M = \frac{\max(n^+, n^-)}{n^+ + n^-}" block />
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              3. Edge Retention Probabilities
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Fraction of densities where edge <KaTeX math="e" /> is retained, and differential retention <KaTeX math="\Delta P(e)" />:
            </p>
            <KaTeX math="P_A(e) = \frac{\text{count}_A(e)}{K}, \quad \Delta P(e) = P_A(e) - P_B(e)" block />
          </div>
        </div>
      </section>

      {/* Protocol v1 vs Protocol v2 */}
      <section className="card">
        <h2 className="card-title">
          <ShieldAlert size={20} style={{ color: 'var(--accent-blue)' }} />
          Consistency Protocols: Frozen v1 vs Revised Protocol v2
        </h2>
        <div className="grid-2" style={{ marginTop: '1rem', gap: '1.5rem' }}>
          <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-neutral">Protocol v1 (Frozen)</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <p>
                <strong>Rule:</strong> <span className="mono">setting-consistent</span> iff all <KaTeX math="K = 6" /> deltas share one sign beyond machine epsilon <KaTeX math="\varepsilon = 10^{-9}" /> (<KaTeX math="S_M = 1" /> and <KaTeX math="n_{\text{zero}} = 0" />).
              </p>
              <p>
                <strong>No Difference:</strong> iff all <KaTeX math="|\Delta| \le \varepsilon" />.
              </p>
              <p>
                <strong>Construction-Sensitive:</strong> otherwise (any zero or sign flip breaks strict consistency).
              </p>
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Limitation: Highly vulnerable to negligible per-density differences and whole-subject scale differences.
              </p>
            </div>
          </div>

          <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-consistent">Protocol v2 (Revised & Scale-Free)</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <p>
                <strong>1% Minimum Relative Gap:</strong> A density counts as a difference only if:
              </p>
              <KaTeX math="|\Delta M(d)| > \max\left(\varepsilon, \, 0.01 \times \frac{|A| + |B|}{2}\right)" block />
              <p>
                <strong>Per-Subject Scale Normalisation:</strong> Strength and weight metrics are normalized by dividing by each subject's whole-matrix mean <KaTeX math="\overline{|w|}" />.
              </p>
              <p>
                <strong>Partially Consistent:</strong> Introduced for metrics where all non-negligible differences share one sign, but gaps at some densities are under 1%.
              </p>
              <p>
                <strong>Setting-Consistent:</strong> Strictly non-negligible same sign at all <KaTeX math="K = 6" /> densities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
