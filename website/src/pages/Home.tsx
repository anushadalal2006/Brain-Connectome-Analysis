import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { CaveatBanner } from '../components/CaveatBanner';
import {
  Activity,
  Database,
  GitBranch,
  Layers,
  Network,
  Share2,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Github,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  ProvenanceData,
  GlobalMetric,
  ShortestPathSummary,
  ReplicationSummary,
  ComparisonEdge
} from '../types';

export const Home: React.FC = () => {
  const [configHash, setConfigHash] = useState('f1ebb3fdc3');
  const [subA, setSubA] = useState('100206');
  const [subB, setSubB] = useState('100307');
  const [validSubjects, setValidSubjects] = useState('1003 / 1003');
  const [totalSubjects, setTotalSubjects] = useState(1003);
  const [densityEdges, setDensityEdges] = useState(743);
  const [pairCount, setPairCount] = useState(5);
  const [finitePaths, setFinitePaths] = useState(0);

  // Consistency summary counts
  const [normStrengthStable, setNormStrengthStable] = useState('4 of 5');
  const [transitivityStable, setTransitivityStable] = useState('3 of 5');
  const [clusteringSensitive, setClusteringSensitive] = useState('4 of 5');
  const [fragmentationStable, setFragmentationStable] = useState('2 of 5');

  // Overlap stats
  const [sharedEdges, setSharedEdges] = useState(355);
  const [onlyAEdges, setOnlyAEdges] = useState(388);
  const [onlyBEdges, setOnlyBEdges] = useState(388);
  const [signFlips, setSignFlips] = useState(3);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/config.json`)
      .then((r) => r.json())
      .then((data) => {
        if (data.config?.hash) setConfigHash(data.config.hash);
        if (data.subjects?.A) setSubA(data.subjects.A);
        if (data.subjects?.B) setSubB(data.subjects.B);
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/provenance.json`)
      .then((r) => r.json())
      .then((prov: ProvenanceData) => {
        if (prov.all_subject_check) {
          setValidSubjects(`${prov.all_subject_check.valid} / ${prov.all_subject_check.subjects}`);
          setTotalSubjects(prov.all_subject_check.subjects);
        }
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/metrics_global_d015.json`)
      .then((r) => r.json())
      .then((metrics: GlobalMetric[]) => {
        const edgeRow = metrics.find((m) => m.metric === 'n_edges');
        if (edgeRow && typeof edgeRow.A === 'number') {
          setDensityEdges(Math.round(edgeRow.A));
        }
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/shortest_path_summary.json`)
      .then((r) => r.json())
      .then((sp: ShortestPathSummary[]) => {
        const totalFinite = sp.reduce((acc, row) => acc + (row.finite || 0), 0);
        setFinitePaths(totalFinite);
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/replication_meta.json`)
      .then((r) => r.json())
      .then((meta) => {
        if (meta.pairs && Array.isArray(meta.pairs)) {
          setPairCount(meta.pairs.length);
        }
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/replication_summary.json`)
      .then((r) => r.json())
      .then((summary: ReplicationSummary[]) => {
        const normStr = summary.find((s) => s.metric === 'mean_strength_norm');
        if (normStr?.v2_consistent) {
          setNormStrengthStable(`${normStr.v2_consistent.split('/')[0]} of 5`);
        }
        const trans = summary.find((s) => s.metric === 'transitivity_all');
        if (trans?.v2_consistent) {
          setTransitivityStable(`${trans.v2_consistent.split('/')[0]} of 5`);
        }
        const clustLcc = summary.find((s) => s.metric === 'avg_clustering_lcc');
        if (clustLcc?.v2_consistent) {
          const cons = parseInt(clustLcc.v2_consistent.split('/')[0], 10);
          setClusteringSensitive(`${5 - cons} of 5`);
        }
        const nComp = summary.find((s) => s.metric === 'n_components');
        if (nComp?.v2_consistent) {
          setFragmentationStable(`${nComp.v2_consistent.split('/')[0]} of 5`);
        }
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/comparison_edges_d015.json`)
      .then((r) => r.json())
      .then((edges: ComparisonEdge[]) => {
        const both = edges.filter((e) => e.status === 'both').length;
        const onlyA = edges.filter((e) => e.status === 'A_only').length;
        const onlyB = edges.filter((e) => e.status === 'B_only').length;
        const flips = edges.filter((e) => e.sign_flip).length;
        setSharedEdges(both);
        setOnlyAEdges(onlyA);
        setOnlyBEdges(onlyB);
        setSignFlips(flips);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Hero section */}
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge badge-blue">Graph Theory</span>
          <span className="badge badge-neutral">No Machine Learning</span>
          <span className="badge badge-neutral mono">Config {configHash}</span>
        </div>
        <h1 className="page-title" style={{ fontSize: '2.5rem', maxWidth: '900px' }}>
          Brain Connectome Visualization and Analysis System
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>
          A graph-based application for analysing human functional connectivity across multiple proportional densities without using machine learning.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/methods" className="btn btn-primary">
            Explore Methods Pipeline <ArrowRight size={16} />
          </Link>
          <Link to="/multi-density" className="btn">
            View Multi-Density Findings
          </Link>
          <a
            href="https://github.com/anushadalal/Brain-Connectome-Analysis/blob/main/Brain_Connectome_Analysis.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <Github size={16} /> View Notebook on GitHub
          </a>
          <a
            href="https://colab.research.google.com/github/anushadalal/Brain-Connectome-Analysis/blob/main/Brain_Connectome_Analysis.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <ExternalLink size={16} /> Open in Colab
          </a>
        </div>
      </div>

      <CaveatBanner settingsId={configHash} />

      {/* 4 Headline numbers */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Headline Parameters & Results
        </h2>
        <div className="grid-4">
          <MetricCard
            title="Subjects Validated"
            value={validSubjects}
            subtitle="HCP S1200 PTN release"
            badge={{ text: 'Data Check', variant: 'neutral' }}
            icon={<CheckCircle2 size={20} />}
          />
          <MetricCard
            title="Graph Density (d = 0.15)"
            value={`${densityEdges} edges`}
            subtitle="Top |w| proportional density"
            badge={{ text: 'Signed Weighted', variant: 'blue' }}
            icon={<Network size={20} />}
          />
          <MetricCard
            title="Subject pairs compared"
            value={`${pairCount}`}
            subtitle={`Across 6 density settings (K=6)`}
            badge={{ text: 'Pre-specified', variant: 'consistent' }}
            icon={<Sliders size={20} />}
          />
          <MetricCard
            title="Finite Shortest Paths"
            value={`${finitePaths} paths`}
            subtitle="Due to reachable negative 2-cycles"
            badge={{ text: 'Undefined (w < 0)', variant: 'sensitive' }}
            icon={<AlertTriangle size={20} />}
          />
        </div>
      </section>

      {/* Main Result & Summary */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card">
          <h2 className="card-title">
            <Activity size={20} style={{ color: 'var(--accent-blue)' }} />
            Main Finding (Descriptive)
          </h2>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '1rem' }}>
              Whether a difference between two individuals survives different density choices depends strongly on the metric. Across {pairCount} pre-specified subject pairs, normalised strength and normalised mean |w| were the most stable (setting-consistent in {normStrengthStable} pairs), transitivity was mostly stable ({transitivityStable}), average clustering of the largest component usually depended on density (construction-sensitive in {clusteringSensitive}), and fragmentation measures were stable in only {fragmentationStable}.
            </p>
            <p>
              A raw-weight result under the frozen v1 rule turned out to be a per-subject scale effect, which is why protocol v2 was added. All results are descriptive: five pairs, no significance testing.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
            Plain-Language Summary
          </h2>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '1rem' }}>
              In connectomics, brain networks are frequently constructed by applying an arbitrary threshold to correlation matrices. However, differences observed at one threshold may disappear or reverse at another.
            </p>
            <p>
              This project investigates setting sensitivity by testing five subject pairs across six proportional densities (0.05 to 0.30) using graph theory without machine learning or discarding negative connections. Every global discrepancy is linked to local node and edge alterations, with the settings ID and provenance recorded with every result.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Feature Cards */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Explore the Project
        </h2>
        <div className="grid-3">
          <Link to="/data" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Database size={18} style={{ color: 'var(--accent-blue)' }} /> HCP Data & Validation
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {totalSubjects} validated subjects from HCP S1200 PTN (group-ICA 100 components, netmats1 Gaussianised r-to-Z statistics).
            </p>
          </Link>

          <Link to="/methods" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Sliders size={18} style={{ color: 'var(--accent-blue)' }} /> Methods & Algorithms
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Proportional density construction, Bellman-Ford negative-cycle mechanics, KaTeX formulas, and protocol v1 vs v2.
            </p>
          </Link>

          <Link to="/networks" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Network size={18} style={{ color: 'var(--accent-blue)' }} /> Single Networks
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Interactive Cytoscape network explorer for subjects A ({subA}) and B ({subB}) at d = 0.15, with BFS/DFS reachability.
            </p>
          </Link>

          <Link to="/comparison" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Share2 size={18} style={{ color: 'var(--accent-blue)' }} /> Pairwise Comparison (d = 0.15)
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Edge overlap breakdown ({sharedEdges} shared, {onlyAEdges} A-only, {onlyBEdges} B-only, {signFlips} sign flips) and interactive overlap network.
            </p>
          </Link>

          <Link to="/multi-density" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Layers size={18} style={{ color: 'var(--accent-blue)' }} /> Multi-Density Analysis
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Interactive Plotly charts across 6 densities, post-hoc scale check, and Global-to-Local node rankings.
            </p>
          </Link>

          <Link to="/replication" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <GitBranch size={18} style={{ color: 'var(--accent-blue)' }} /> Replication Across 5 Pairs
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Verification across 4 pre-specified replication pairs, color-coded consistency grid, and tolerance robustness tests.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
};

