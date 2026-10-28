import React, { useEffect, useState } from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import {
  ShieldAlert,
  AlertTriangle,
  History,
} from 'lucide-react';
import { ReplicationStructure } from '../types';

export const LimitationsPage: React.FC = () => {
  const [subA, setSubA] = useState('100206');
  const [subB, setSubB] = useState('100307');
  const [configHash, setConfigHash] = useState('f1ebb3fdc3');
  const [isoA, setIsoA] = useState(15);
  const [isoB, setIsoB] = useState(26);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/config.json`)
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.subjects?.A) setSubA(cfg.subjects.A);
        if (cfg.subjects?.B) setSubB(cfg.subjects.B);
        if (cfg.config?.hash) setConfigHash(cfg.config.hash);
      })
      .catch(() => { });

    fetch(`${import.meta.env.BASE_URL}data/replication_structure_d015.json`)
      .then((r) => r.json())
      .then((struct: ReplicationStructure[]) => {
        const main = struct.find((s) => s.pair === 'main');
        if (main) {
          setIsoA(main.n_isolated_A);
          setIsoB(main.n_isolated_B);
        }
      })
      .catch(() => { });
  }, []);

  const caveats = [
    {
      num: 1,
      title: 'Descriptive Analysis Only (No Significance Tests)',
      desc: 'Consistency labels, sign-consistency score S_M, and retention differences ΔP(e) are purely descriptive statistics across deterministic density settings. They carry no p-values, perform no hypothesis testing, and make no probabilistic claims.',
    },
    {
      num: 2,
      title: 'Setting-Consistency vs Biological Ground Truth',
      desc: "'Setting-consistent' means a difference between two individuals preserves its sign across the predefined proportional densities (0.05–0.30) for that specific pair. It does not measure test-retest reliability, fMRI scanner stability, biological ground truth, or clinical relevance.",
    },
    {
      num: 3,
      title: 'Limited Sample Size (Five Pairs)',
      desc: 'This study analyses five pre-specified pairs (ten individuals). Five pairs provide a proof-of-concept demonstration of setting sensitivity but cannot generalize to a clinical population or healthy demographic cohort.',
    },
    {
      num: 4,
      title: 'Subject-Specific Scale Effects in Netmats1',
      desc: 'Weights are HCP netmats1 r-to-Z statistics from FSLNets (Gaussianised r) with subject-specific variance. Raw strength and weight differences (mean_strength, mean_abs_weight) reflect whole-matrix scaling; they must be interpreted alongside normalized metrics.',
    },
    {
      num: 5,
      title: 'ICA Components vs Anatomical Parcels',
      desc: 'Network nodes represent 100 group-ICA spatial components, not discrete anatomical parcels. ICA maps are continuous, can overlap spatially, and one component may span several anatomically disconnected cortical regions.',
    },
    {
      num: 6,
      title: 'Graph Disconnection Across All Densities',
      desc: `Brain networks remain structurally disconnected at every evaluated density (main pair at d = 0.15: ${isoA} isolated nodes in A, ${isoB} in B). Consequently, whole-network metrics and largest-connected-component (LCC) metrics can diverge substantially.`,
    },
    {
      num: 7,
      title: 'Shortest Paths Undefined (Undirected Negative Cycles)',
      desc: 'Shortest path metrics cannot be computed in the large components because undirected edges with negative correlation weights (w < 0) create reachable 2-cycles (u -> v -> u) with total traversal cost 2w < 0. No shortest-path comparisons are reported.',
    },
    {
      num: 8,
      title: 'Figure Titles and Frozen v1 Labels',
      desc: 'Exported publication figure titles from C23 reflect the frozen v1 rules. In particular, for mean_abs_weight, the v1 title indicates A > B (a raw scale artifact); viewers must read this alongside the protocol v2 normalized table where A < B.',
    },
    {
      num: 9,
      title: 'Global-to-Local Shows Co-occurrence, Not a Causal Link',
      desc: 'Global-to-Local tables identify nodes whose metric changes go together with a global network difference. It shows descriptive co-occurrence across the six densities only; it does not establish a causal link.',
    },
    {
      num: 10,
      title: 'Collinearity Among Graph Metrics',
      desc: 'Several evaluated metrics are not mathematically independent: number of components, isolated node count, and largest component size all measure fragmentation; transitivity_all equals transitivity_lcc in these topologies.',
    },
    {
      num: 11,
      title: 'Post-Hoc Origin of Protocol v2',
      desc: `Protocol v2 (C22R) was formulated after observing the scale artifact on the main subject pair (${subA} vs ${subB}). It was therefore reported alongside the frozen v1 labels for the main pair, and permanently frozen before evaluating the replication pairs.`,
    },
    {
      num: 12,
      title: 'Research Integrity & Bug Correction Audit',
      desc: 'The isolated-node pattern (B > A at every density) and primary d = 0.15 values were observed before rules were officially frozen on 21 Oct 2026. Following the first C22 run, a sign_agreement calculation bug was identified and corrected (C21 v2); rankings and labels remained unaltered.',
    },
    {
      num: 13,
      title: 'Novelty Scope',
      desc: 'Threshold sensitivity on its own is a known phenomenon in network science and is not claimed as new. The candidate contribution is the matched multi-density workflow that links global differences to local node and edge evidence; it still has to be compared with the closest published methods before any novelty claim is made.',
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-neutral">Scientific Standards</span>
          <span className="badge badge-sensitive">Report Caveats</span>
        </div>
        <h1 className="page-title">Limitations & Research Integrity</h1>
        <p className="page-subtitle">
          Exhaustive disclosure of all 13 REPORT_CAVEATS from the formal project report, research integrity timeline, and language guidelines.
        </p>
      </div>

      <CaveatBanner settingsId={configHash} />

      {/* Strict Terminology Guidance */}
      <section className="card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--badge-partial-border)' }}>
        <h2 className="card-title" style={{ color: 'var(--badge-partial-text)' }}>
          <AlertTriangle size={20} />
          Strict Terminology & Scientific Language Standards
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p>
            To uphold the highest standards of scientific rigor and academic integrity, the following terminology rules are strictly enforced across this website, the codebase, and all reports:
          </p>
          <div className="grid-2" style={{ marginTop: '0.5rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--badge-partial-text)', marginBottom: '0.4rem' }}>
                ❌ Strictly Prohibited Language
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li><strong>"Significant"</strong> (No inferential statistics or p-values)</li>
                <li><strong>"Proves" / "Causes"</strong> (Observational graph comparison only)</li>
                <li><strong>"Biomarker" / "Diagnosis"</strong> (No clinical validation)</li>
                <li><strong>"Drives" / "Explains"</strong> (Replaced with "goes together with")</li>
              </ul>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 700, color: '#059669', marginBottom: '0.4rem' }}>
                ✅ Permitted Descriptive Standards
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li><strong>"Setting-consistent"</strong> (Stable across predefined densities)</li>
                <li><strong>"Construction-sensitive"</strong> (Sign alters across densities)</li>
                <li><strong>"Descriptive comparison"</strong> (Deterministic graph analysis)</li>
                <li><strong>"Goes together with"</strong> (Observational association)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Full 13 REPORT_CAVEATS */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} style={{ color: 'var(--accent-blue)' }} />
          The 13 Formal Project Caveats (report.md Section 12)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {caveats.map((c) => (
            <div key={c.num} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-neutral mono">Caveat #{c.num}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {c.title}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Research Integrity Timeline */}
      <section className="card">
        <h2 className="card-title">
          <History size={20} style={{ color: 'var(--accent-blue)' }} />
          Research Integrity & Protocol Evolution Timeline
        </h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ borderLeft: '2px solid var(--accent-blue)', paddingLeft: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>1. Pre-Freezing Exploratory Phase</div>
            <div>
              Initial exploration of Subject A ({subA}) and B ({subB}) at d = 0.15 revealed that Subject B exhibited substantially more isolated nodes ({isoB} vs {isoA}). These values were recorded prior to freezing formal rules.
            </div>
          </div>

          <div style={{ borderLeft: '2px solid var(--accent-blue)', paddingLeft: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>2. Freezing of Protocol v1 (21 Oct 2026)</div>
            <div>
              Protocol v1 rule was formally frozen: setting-consistent iff all K = 6 deltas share a single sign beyond ε = 1e-9. Multi-setting run C22 then built A and B with one settings ID per density (base settings ID <code>{configHash}</code> at d = 0.15). After the first C22 run, a sign_agreement calculation bug was found and corrected (C21 v2); labels, profiles and rankings were unchanged.
            </div>
          </div>

          <div style={{ borderLeft: '2px solid var(--accent-blue)', paddingLeft: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>3. Post-Hoc Scale Check (C22S)</div>
            <div>
              A post-hoc scale check revealed that <code>mean_abs_weight</code> reversed from A &gt; B to A &lt; B once each subject's weights were divided by that subject's own mean |w|. The frozen v1 labels were kept unchanged and reported alongside.
            </div>
          </div>

          <div style={{ borderLeft: '2px solid var(--accent-blue)', paddingLeft: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>4. Formulation of Protocol v2 and Replication Freeze</div>
            <div>
              Protocol v2 was added incorporating a 1% relative tolerance threshold and per-subject scale normalisation. Crucially, Protocol v2 was permanently frozen before evaluating the 4 pre-specified replication pairs in C28.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};