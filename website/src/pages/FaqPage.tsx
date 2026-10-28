import React from 'react';
import { Link } from 'react-router-dom';
import { CaveatBanner } from '../components/CaveatBanner';
import { useJSON, PENDING } from '../data';
import { ConfigData, ShortestPathSummary, VerificationTest } from '../types';

export const FaqPage: React.FC = () => {
  const cfg = useJSON<ConfigData>('config.json');
  const sp = useJSON<ShortestPathSummary[]>('shortest_path_summary.json');
  const tests = useJSON<VerificationTest[]>('verification_tests.json');
  const meta = useJSON<{ pairs: string[][]; rel_tol: number }>('replication_meta.json');

  const K = cfg ? cfg.density_settings.length : PENDING;
  const dens = cfg ? cfg.density_settings.map((d) => d.toFixed(2)).join(', ') : PENDING;
  const finite = sp ? sp.reduce((a, r) => a + r.finite, 0) : PENDING;
  const nChecks = tests ? tests.reduce((a, t) => a + t.total, 0) : PENDING;
  const nCells = tests ? tests.length : PENDING;
  const nPairs = meta ? meta.pairs.length : PENDING;
  const relTol = meta ? `${meta.rel_tol * 100}%` : PENDING;

  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: 'Why no machine learning?',
      a: <>The question is descriptive: does a difference between two people&apos;s networks survive different ways of building the graph? That needs graph construction, graph metrics and classic algorithms, not a trained model. With {nPairs} pairs there is also nothing to train or validate a model on.</>,
    },
    {
      q: 'Why keep negative edges?',
      a: <>Negative r-to-Z values are part of the data. Dropping them or flipping their sign would change the network. Edges are ranked by |w| and keep their sign, so red (positive) and blue (negative) edges are both in every graph.</>,
    },
    {
      q: 'Why proportional thresholding?',
      a: <>It gives both subjects exactly the same number of edges at each density, so differences in degree, components or clustering are not just a result of one graph having more edges. A fixed weight cut-off would not do this, because the overall scale of the weights differs between people.</>,
    },
    {
      q: `Why ${K} densities?`,
      a: <>The densities {dens} cover sparse to moderately dense graphs, in equal steps. The point is not one &quot;best&quot; density but whether a difference keeps its direction across a reasonable range.</>,
    },
    {
      q: 'Why Bellman–Ford and not Dijkstra?',
      a: <>Dijkstra&apos;s algorithm assumes no negative edge costs. Here the costs are the signed weights, so Bellman–Ford, which allows negative costs and detects negative cycles, is the correct choice. <Link to="/methods">Methods</Link></>,
    },
    {
      q: 'Why are all shortest paths undefined?',
      a: <>Every negative edge u–v in an undirected graph gives a cycle u → v → u of cost 2w &lt; 0. Any node that can reach such a cycle can lower its path cost without limit, so no shortest distance exists. Finite distances found: {finite}.</>,
    },
    {
      q: 'Why not use 1/w as a distance?',
      a: <>1/w is undefined at zero, flips sign for negative weights, and is an arbitrary choice among many possible conversions. The project keeps the weights as they are and reports the negative-cycle result instead.</>,
    },
    {
      q: 'What does setting-consistent mean?',
      a: <>For one pair and one metric, the difference A − B has the same sign at every density (under protocol v2, also above the {relTol} minimum gap at every density). It says the direction does not depend on the density choice for that pair; it is not a statement about people in general.</>,
    },
    {
      q: 'Why protocol v2?',
      a: <>The frozen v1 rule had two problems. Raw strength and |w| depend on each person&apos;s overall scale (the post-hoc scale check showed mean |w| reverses after normalising), and tiny gaps at one density decided labels. v2 normalises by each subject&apos;s mean |w| and ignores gaps under {relTol}. It was written after seeing the main pair, so v1 is always shown beside it, and it was frozen before the replication pairs ran.</>,
    },
    {
      q: 'What does global-to-local show?',
      a: <>Which nodes and edges change in the same direction as a global difference across the densities. It is descriptive co-occurrence that helps read the global result; it does not show a causal link.</>,
    },
    {
      q: 'How was correctness verified?',
      a: <>{nChecks} checks in {nCells} test cells, an integration scan of the notebook source for Dijkstra and 1/w, a one-call pipeline that reproduces every table, identical reruns, and a script that checks the website data. <Link to="/verification">Verification</Link></>,
    },
    {
      q: 'Why a static website?',
      a: <>The HCP Open Access Data Use Terms do not allow redistributing the connectivity data. The site has no server and only contains derived results (labels, counts, graph metrics, figures), never raw edge weights.</>,
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1 className="page-title">FAQ</h1>
        <p className="page-subtitle">Short answers to the questions most often asked about the design choices.</p>
      </div>
      <CaveatBanner />
      <div className="faq">
        {faqs.map((f) => (
          <details key={f.q} className="card faq-item">
            <summary>{f.q}</summary>
            <div className="faq-answer">{f.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
};
