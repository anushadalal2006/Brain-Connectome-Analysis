import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CaveatBanner } from '../components/CaveatBanner';
import { KaTeX } from '../components/KaTeX';

interface Term {
  term: string;
  def: React.ReactNode;
  see?: { to: string; name: string };
}

const TERMS: Term[] = [
  { term: 'ICA component (network node)', def: <>One of 100 spatial maps from group independent component analysis of resting-state fMRI. Each map is a node of the network. Maps can overlap and cover several separate areas, so a node is not an anatomical region.</>, see: { to: '/data', name: 'Data' } },
  { term: 'netmats1', def: <>The HCP PTN &quot;full network matrix&quot; for each subject: full correlation between the time series of every pair of the 100 components, given as r-to-Z statistics. One signed 100 × 100 matrix per person.</>, see: { to: '/data', name: 'Data' } },
  { term: 'r-to-Z statistics (FSLNets)', def: <>The values in netmats1: correlations converted to Z statistics by FSLNets. They are signed (positive or negative) and not bounded by ±1. Their overall size (scale) differs from person to person.</> },
  { term: 'Proportional density d', def: <>The share of all node pairs kept as edges. Pairs are ranked by |w| (ties by (i, j)) and the top <KaTeX math="m = \lfloor d \times \text{pairs} + 0.5 \rfloor" /> are kept with their sign. Both subjects always get the same number of edges.</>, see: { to: '/methods', name: 'Methods' } },
  { term: 'Degree', def: <>Number of kept edges at a node, ignoring weight and sign.</> },
  { term: 'Signed strength', def: <>Sum of the signed weights of a node&apos;s kept edges, so positive and negative edges partly cancel. In raw r-to-Z units, so it depends on the subject&apos;s overall scale.</> },
  { term: 'Clustering coefficient', def: <>For one node: the share of pairs of its neighbours that are themselves connected (binary, weights ignored). Average clustering is the mean over nodes, either all nodes or only those in the largest component.</> },
  { term: 'Transitivity', def: <><KaTeX math="3 \times \text{triangles} / \text{connected triples}" /> over the whole graph. Unlike average clustering, it weights every triple equally.</> },
  { term: 'Connected component', def: <>A group of nodes that can all reach each other along kept edges. The largest component is the biggest such group.</> },
  { term: 'Isolated node', def: <>A node with no kept edge at the chosen density (a component of size 1).</>, see: { to: '/networks', name: 'Single Networks' } },
  { term: 'BFS (breadth-first search)', def: <>Visits nodes level by level from a source using a queue, in O(V + E). Gives the reachable set and the number of levels.</> },
  { term: 'DFS (depth-first search)', def: <>Visits nodes by going as deep as possible first, using an explicit stack, in O(V + E). Reaches the same set as BFS.</> },
  { term: 'Bellman–Ford', def: <>Shortest-path algorithm that allows negative edge costs and detects negative cycles, in O(V · E). Used here on the raw signed weights.</>, see: { to: '/methods', name: 'Methods' } },
  { term: 'Negative cycle', def: <>A cycle whose total cost is below zero. One undirected negative edge u–v gives the cycle u → v → u with cost 2w &lt; 0, so going round it again always lowers the cost: shortest distances are undefined.</>, see: { to: '/methods', name: 'Methods' } },
  { term: 'ΔM(d)', def: <>The difference <KaTeX math="M(G_A(d)) - M(G_B(d))" /> of a graph metric M between subjects A and B, both graphs built at density d.</>, see: { to: '/multi-density', name: 'Multi-Density' } },
  { term: 'Sign-consistency score S_M', def: <>Share of the non-zero ΔM values that have the more common sign: <KaTeX math="S_M = \max(n^+, n^-) / (n^+ + n^-)" />. S_M = 1 means one sign at every density.</> },
  { term: 'Setting-consistent', def: <>The difference keeps one sign at every density. Under protocol v2 the gap must also be above the 1% minimum at every density.</> },
  { term: 'Partially consistent', def: <>Protocol v2 only: all non-negligible differences share one sign, but at some densities the gap is below 1% (negligible).</> },
  { term: 'Construction-sensitive', def: <>Both signs appear across the densities: whether A or B is higher depends on how the graph was built.</> },
  { term: 'No difference', def: <>The gap is negligible at every density.</> },
  { term: 'Frozen v1 / protocol v2', def: <>Frozen v1: raw values, any non-zero gap counts. Protocol v2 (primary): strength and |w| divided by each subject&apos;s own mean |w|, and a 1% minimum gap. Both are always shown.</>, see: { to: '/methods', name: 'Methods' } },
  { term: 'Retention P(e)', def: <>Share of the densities at which an edge e is kept in one subject: <KaTeX math="P_A(e) = \text{count}_A(e) / K" />.</> },
  { term: 'ΔP(e)', def: <><KaTeX math="P_A(e) - P_B(e)" />: positive if A keeps the edge at more densities than B.</>, see: { to: '/multi-density', name: 'Multi-Density' } },
  { term: 'Global-to-local', def: <>Ranks the nodes and edges whose local changes go together with a global difference across the densities. Descriptive co-occurrence, not a causal link.</>, see: { to: '/multi-density', name: 'Multi-Density' } },
  { term: 'Sign agreement', def: <>For one node: the share of densities where its local change has the same sign as the global ΔM.</> },
  { term: 'Settings ID', def: <>A short hash of the full graph configuration (density, ranking and tie rules, rounding, diagonal and missing-value policies, sign handling, path rule). Every result records it, so two results can only be compared if they were built the same way.</>, see: { to: '/verification', name: 'Verification' } },
];

export const GlossaryPage: React.FC = () => {
  const [q, setQ] = useState('');
  const shown = TERMS.filter((t) => t.term.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1 className="page-title">Glossary</h1>
        <p className="page-subtitle">Short definitions of the terms used on this site, in the order they appear in the analysis.</p>
      </div>
      <CaveatBanner />
      <input
        className="select-input"
        style={{ fontFamily: 'var(--font-sans)', width: '100%', maxWidth: 360, marginBottom: '1.25rem', padding: '0.5rem 0.75rem' }}
        placeholder="Filter terms…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Filter glossary terms"
      />
      <dl className="glossary">
        {shown.map((t) => (
          <div key={t.term} className="glossary-item">
            <dt>{t.term}</dt>
            <dd>
              {t.def}
              {t.see && <> <Link to={t.see.to} className="glossary-see">See {t.see.name} →</Link></>}
            </dd>
          </div>
        ))}
      </dl>
      {shown.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No term matches.</p>}
    </div>
  );
};
