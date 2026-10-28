import React from 'react';
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
import { ShortestPathSummary, ProvenanceData, ConfigData, GlobalStatistic } from '../types';
import { useJSON, PENDING } from '../data';
import { PipelineDiagram } from '../components/diagrams/PipelineDiagram';
import { ThresholdDiagram } from '../components/diagrams/ThresholdDiagram';
import { NegativeCycleDiagram } from '../components/diagrams/NegativeCycleDiagram';
import { V1Decision, V2Decision } from '../components/diagrams/DecisionDiagram';

export const MethodsPage: React.FC = () => {
  const cfg = useJSON<ConfigData>('config.json');
  const prov = useJSON<ProvenanceData>('provenance.json');
  const stats = useJSON<GlobalStatistic[]>('statistics_global.json');
  const spList = useJSON<ShortestPathSummary[]>('shortest_path_summary.json');

  const totalSubjects = prov?.all_subject_check?.subjects ?? PENDING;
  const nPairsRow = stats?.find((r) => r.statistic === 'n_values');
  const nPairs = nPairsRow ? Math.round(nPairsRow.A) : null;
  const rowA = cfg && spList?.find((r) => String(r.subject) === String(cfg.subjects.A));
  const rowB = cfg && spList?.find((r) => String(r.subject) === String(cfg.subjects.B));
  const undefinedNodesA = rowA ? rowA.undefined : PENDING;
  const undefinedNodesB = rowB ? rowB.undefined : PENDING;
  const finiteA = rowA ? rowA.finite : PENDING;
  const finiteB = rowB ? rowB.finite : PENDING;
  const K = cfg ? cfg.density_settings.length : PENDING;
  const primary = cfg?.config.density;

  const densities = cfg && nPairs !== null
    ? cfg.density_settings.map((d) => {
        const m = Math.floor(d * nPairs + 0.5);
        return { density: d.toFixed(2), edges: m, formula: `floor(${d.toFixed(2)} × ${nPairs} + 0.5) = ${m}${d === primary ? ' (primary)' : ''}`, primary: d === primary };
      })
    : [];

  const complexity = [
    { step: 'Graph build (proportional density)', ds: `Array of all ${nPairs ?? PENDING} pairs, sorted`, time: 'O(E log E)', note: 'Sort the pairs by |w| (ties by i, j), keep the top m.' },
    { step: 'BFS', ds: 'Queue (deque) + visited set', time: 'O(V + E)', note: 'Levels = BFS tree depth from the source node.' },
    { step: 'DFS', ds: 'Explicit stack + visited set', time: 'O(V + E)', note: 'Reaches the same node set as BFS.' },
    { step: 'Bellman–Ford', ds: 'Distance + predecessor arrays, arc list', time: 'O(V · E)', note: 'V − 1 relaxation rounds, then one more round to detect a negative cycle.' },
    { step: 'Clustering (binary)', ds: 'Adjacency sets', time: 'O(V · d²)', note: 'Edge weights ignored; d = node degree.' },
    { step: 'Transitivity', ds: 'Adjacency sets', time: 'O(V · d²)', note: '3 × triangles / connected triples.' },
    { step: 'Connected components', ds: 'BFS over unvisited nodes', time: 'O(V + E)', note: 'Largest component, isolated nodes.' },
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
        <p className="section-lead">
          Every notebook cell in order, from validating all {totalSubjects} subjects to replication. Each box gives the cell number and what it does; test cells sit next to the module they check.
        </p>
        <div className="card chart-card">
          <div className="chart-scroll"><div style={{ minWidth: 760 }}><PipelineDiagram /></div></div>
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
            <KaTeX math={`m = \\left\\lfloor d \\times ${nPairs ?? 'N'} + 0.5 \\right\\rfloor`} block />
            <p>
              <strong>Negative Edges Preserved:</strong> Negative correlation weights are retained with their signed magnitude intact. No reciprocal or <KaTeX math="1/w" /> transformations are applied.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Code2 size={20} style={{ color: 'var(--accent-blue)' }} />
            Density Settings & Edge Counts (K = {K})
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
                  <tr key={i} style={row.primary ? { background: 'var(--bg-tertiary)', fontWeight: 600 } : {}}>
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

      {/* Thresholding illustration */}
      <section className="card chart-card" style={{ marginBottom: '2.5rem' }}>
        <h2 className="card-title">How proportional thresholding works</h2>
        <div className="chart-scroll"><div style={{ minWidth: 600 }}><ThresholdDiagram nPairs={nPairs ?? PENDING} /></div></div>
        <p className="chart-caption">
          The same rule is applied to both subjects at every density, so both graphs always have exactly m edges. Negative edges are kept with their sign; no 1/w or other conversion is applied.
        </p>
      </section>

      {/* Bellman-Ford Negative Cycle Mechanics */}
      <section className="card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--badge-partial-border)' }}>
        <h2 className="card-title" style={{ color: 'var(--badge-partial-text)' }}>
          <AlertTriangle size={20} />
          Why Shortest Paths are Undefined (Reachable Negative Cycles)
        </h2>
        <div className="methods-bf-grid">
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
            Consequently, the <strong>Bellman–Ford algorithm</strong> terminates with status <span className="mono">negative_cycle</span>. Distances to all {undefinedNodesA} nodes reachable in Subject A and {undefinedNodesB} nodes reachable in Subject B are undefined, including the source itself (it can also go round the cycle). Finite distances: {finiteA} in A and {finiteB} in B. Nodes outside the source's component stay unreachable (<KaTeX math="\infty" />). No shortest-path comparison is reported.
          </p>
        </div>
          <figure style={{ margin: 0 }}>
            <NegativeCycleDiagram />
            <figcaption className="chart-caption" style={{ textAlign: 'center' }}>
              Blue dashed arcs = a negative edge (rule 6). Going round u → v → u lowers the cost by 2|w| every time, so no shortest distance exists.
            </figcaption>
          </figure>
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
              Fraction of non-zero delta observations sharing the dominant sign across all <KaTeX math={`K = ${K}`} /> densities:
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
            <KaTeX math="P_A(e) = \frac{\text{count}_A(e)}{K}" block />
            <KaTeX math="\Delta P(e) = P_A(e) - P_B(e)" block />
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
                <strong>Rule:</strong> <span className="mono">setting-consistent</span> iff all <KaTeX math={`K = ${K}`} /> deltas share one sign beyond machine epsilon <KaTeX math="\varepsilon = 10^{-9}" /> (<KaTeX math="S_M = 1" /> and <KaTeX math="n_{\text{zero}} = 0" />).
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
                <strong>Setting-Consistent:</strong> Strictly non-negligible same sign at all <KaTeX math={`K = ${K}`} /> densities.
              </p>
            </div>
          </div>
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '1.75rem 0 0.75rem', color: 'var(--text-primary)' }}>
          The two rules as decision diagrams (frozen v1 shown beside protocol v2)
        </h3>
        <div className="grid-2">
          <div>
            <div style={{ marginBottom: '0.5rem' }}><span className="badge badge-neutral">Frozen v1</span></div>
            <V1Decision />
          </div>
          <div>
            <div style={{ marginBottom: '0.5rem' }}><span className="badge badge-consistent">Protocol v2 (primary)</span></div>
            <V2Decision />
          </div>
        </div>
        <p className="chart-caption">
          v1 has no tolerance, so a tiny gap at one density decides the label; v2 sets aside differences under 1% and adds the &quot;partially consistent&quot; label. Colours: green setting-consistent, amber partially consistent, purple/pink construction-sensitive, grey no difference.
        </p>
      </section>

      {/* Algorithms, data structures and complexity */}
      <section className="card" style={{ marginTop: '2.5rem' }}>
        <h2 className="card-title">
          <Code2 size={20} style={{ color: 'var(--accent-blue)' }} />
          Algorithms, Data Structures and Time Complexity
        </h2>
        <p className="section-lead">
          V = number of nodes, E = number of edges kept at the chosen density. All algorithms run on the unweighted adjacency except Bellman–Ford, which uses the signed weights as arc costs.
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Step</th><th>Data structure</th><th>Time</th><th>Note</th></tr>
            </thead>
            <tbody>
              {complexity.map((r) => (
                <tr key={r.step}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.step}</td>
                  <td>{r.ds}</td>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>{r.time}</td>
                  <td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
