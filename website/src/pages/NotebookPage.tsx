import React from 'react';
import { Link } from 'react-router-dom';
import { CaveatBanner } from '../components/CaveatBanner';
import { BookOpen, ExternalLink } from 'lucide-react';
import { NOTEBOOK_GITHUB_URL, NOTEBOOK_COLAB_URL } from '../config';

// Cell list taken from the notebook's own cell headers ("Writes:" lines).
// Owners follow the team split in the project brief.
interface Cell {
  id: string;
  title: string;
  does: string;
  keys: string;
  owner: string;
  page?: { to: string; name: string };
  test?: boolean;
}

interface Group {
  name: string;
  range: string;
  cells: Cell[];
}

const P1 = 'Person 1';
const P2 = 'Person 2';
const P3 = 'Person 3';

const GROUPS: Group[] = [
  {
    name: 'Foundation', range: 'C01–C11',
    cells: [
      { id: 'C01', title: 'Setup', does: 'Imports, random seed, environment record.', keys: 'ENV_INFO, SEED', owner: P1, page: { to: '/verification', name: 'Verification' } },
      { id: 'C02', title: 'Configuration', does: 'Project settings: density, subjects A and B, density list, paths.', keys: 'GraphConfiguration, CFG, DENSITY_SETTINGS, EPS_ZERO', owner: P1, page: { to: '/methods', name: 'Methods' } },
      { id: 'C03', title: 'Shared contracts', does: 'Data classes every module uses, provenance, the result store.', keys: 'Provenance, ConnectomeGraph, AnalysisResult, ResultStore, RESULTS', owner: P1 },
      { id: 'S3 (3 cells, commented out)', title: 'Data acquisition', does: 'Searched the HCP S3 bucket and downloaded the PTN files into Drive once; kept as a record, not re-run.', keys: 'boto3, S3_BUCKET, FILES', owner: P1, page: { to: '/verification', name: 'Verification (provenance)' } },
      { id: 'C04', title: 'Module A: data import', does: 'Finds the PTN files and extracts netmats1 rows for a subject.', keys: 'HCPNetmatsLoader, load_subject, extract_netmats1', owner: P1, page: { to: '/data', name: 'Data' } },
      { id: 'C05', title: 'Module A: validation', does: 'Checks shape, symmetry, diagonal and missing values; negative values are never an issue.', keys: 'DataValidator, validate', owner: P1, page: { to: '/data', name: 'Data' } },
      { id: 'C05T', title: 'Tests for module A', does: 'Data validation tests on small fixtures.', keys: '_check, _sym, _fixture', owner: P1, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C06', title: 'Module A run', does: 'Loads and validates subjects A and B (and checks all subjects).', keys: 'loader, data_A, data_B, val_A, val_B', owner: P1, page: { to: '/data', name: 'Data' } },
      { id: 'C07', title: 'Module B: preprocessing', does: 'Works on a copy; zero diagonal; signs kept; no 1/w; no thresholding.', keys: 'preprocess', owner: P1, page: { to: '/methods', name: 'Methods' } },
      { id: 'C07T', title: 'Tests for module B', does: 'Preprocessing and configuration tests.', keys: '—', owner: P1, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C08', title: 'Module C: graph construction', does: 'Proportional density by |w|, ties by (i, j), m = floor(d·E + 0.5), signed weights stored.', keys: 'n_edges_for_density, build_graph, edge_list', owner: P1, page: { to: '/methods', name: 'Methods' } },
      { id: 'C08T', title: 'Tests for module C', does: 'Graph construction on 4-node hand-checkable fixtures.', keys: '—', owner: P1, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C09', title: 'Modules B + C run', does: 'Preprocesses and builds the graphs of A and B.', keys: 'proc_A, proc_B, G_A, G_B', owner: P1, page: { to: '/networks', name: 'Single Networks' } },
      { id: 'C10', title: 'Checks on real graphs', does: 'Edge counts, signs and settings on the real graphs.', keys: '—', owner: P1, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C11', title: 'Foundation integration test', does: 'Load → validate → configure → preprocess → build on one controlled matrix.', keys: '—', owner: P1, test: true, page: { to: '/verification', name: 'Verification' } },
    ],
  },
  {
    name: 'Analysis', range: 'C12–C19',
    cells: [
      { id: 'C12', title: 'Module D: descriptive statistics', does: 'Whole-matrix statistics of each subject (mean, spread, shape, sign shares).', keys: 'compute_statistics, stats_A, stats_B', owner: P2, page: { to: '/data', name: 'Data' } },
      { id: 'C13', title: 'Module E: graph metrics', does: 'Degree, signed strength, binary clustering, transitivity, components, isolated nodes.', keys: 'compute_metrics, METRIC_KEYS', owner: P2, page: { to: '/networks', name: 'Single Networks' } },
      { id: 'C14', title: 'Module E run', does: 'Metrics of A and B at d = 0.15.', keys: 'metrics_A, metrics_B', owner: P2, page: { to: '/networks', name: 'Single Networks' } },
      { id: 'C15', title: 'Module F: traversal', does: 'Source node choice, BFS with a queue, DFS with an explicit stack.', keys: 'pick_source, bfs, dfs, SOURCE_NODE', owner: P2, page: { to: '/networks', name: 'Single Networks' } },
      { id: 'C16', title: 'Module G: Bellman–Ford', does: 'Shortest paths on signed weights with negative-cycle detection.', keys: 'bellman_ford_arcs, bellman_ford, reconstruct_path', owner: P2, page: { to: '/methods', name: 'Methods' } },
      { id: 'C17', title: 'Module G run', does: 'Bellman–Ford from the source node in A and B.', keys: 'sp_A, sp_B', owner: P2, page: { to: '/networks', name: 'Single Networks' } },
      { id: 'C18', title: 'Tests for D–G', does: 'Statistics, metrics, traversal and Bellman–Ford tests.', keys: '—', owner: P2, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C19', title: 'Module J part 1: figures', does: 'Single-network figures (matrices, histograms, networks, BFS levels).', keys: 'FIGURES, stamp, COLOR_POS, COLOR_NEG', owner: P2, page: { to: '/data', name: 'Data' } },
    ],
  },
  {
    name: 'Research', range: 'C20–C28',
    cells: [
      { id: 'C20', title: 'Module H: comparison', does: 'Compatibility check and A vs B comparison at d = 0.15 (global, node, edge overlap).', keys: 'check_compatibility, compare_networks, cmp_AB', owner: P3, page: { to: '/comparison', name: 'Comparison' } },
      { id: 'C21', title: 'Module I: multi-setting global-to-local', does: 'Frozen v1 rule, global-to-local map, multi-density run definitions.', keys: 'CONSISTENCY_RULE, G2L_MAP, classify_metric, run_multi_setting', owner: P3, page: { to: '/multi-density', name: 'Multi-Density' } },
      { id: 'C22', title: 'Module I run', does: 'A vs B at all six densities under the frozen v1 rule.', keys: 'ms_AB', owner: P3, page: { to: '/multi-density', name: 'Multi-Density' } },
      { id: 'C22S', title: 'Post-hoc scale check', does: 'Divides each subject\'s values by their own mean |w| for the 3 scale-dependent metrics.', keys: 'scale_check, scale_check_labels', owner: P3, page: { to: '/multi-density', name: 'Multi-Density' } },
      { id: 'C22R', title: 'Protocol v2', does: 'Normalised metrics and a 1% minimum gap; adds "partially consistent".', keys: 'REL_TOL, classify_metric_v2, protocol_v2, consistency_v2', owner: P3, page: { to: '/multi-density', name: 'Multi-Density' } },
      { id: 'C23', title: 'Module J part 2: figures', does: 'Comparison and research figures (overlap, heatmaps, profiles, G2L panels).', keys: 'AB_* figures', owner: P3, page: { to: '/comparison', name: 'Comparison' } },
      { id: 'C24', title: 'Tests for H–I', does: 'Comparison and multi-setting tests on fixtures.', keys: '—', owner: P3, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C25', title: 'Module K: report and export', does: 'report.md, tables, figures and JSON with settings and provenance; never writes inside the data folder.', keys: 'build_report, export, REPORT_CAVEATS', owner: P3, page: { to: '/limitations', name: 'Limitations' } },
      { id: 'C26', title: 'Integration tests', does: 'Reproducibility, settings, source scan for Dijkstra / 1/w, export checks.', keys: '—', owner: P2, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C27', title: 'One-call pipeline', does: 'run_pipeline() reproduces the step-by-step results in one call.', keys: 'ANALYSES, run_pipeline, pipe_AB', owner: P1, test: true, page: { to: '/verification', name: 'Verification' } },
      { id: 'C28', title: 'Replication', does: 'Four pre-specified pairs, protocol v2 primary, v1 alongside, tolerance check.', keys: 'REPLICATION_PAIRS, replication_v2, replication_v1', owner: P3, page: { to: '/replication', name: 'Replication' } },
    ],
  },
];

export const NotebookPage: React.FC = () => (
  <div className="container" style={{ paddingBottom: '3rem' }}>
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <span className="badge badge-neutral">Notebook</span>
        <span className="badge badge-neutral mono">Brain_Connectome_Analysis.ipynb</span>
      </div>
      <h1 className="page-title">Notebook Walkthrough</h1>
      <p className="page-subtitle">
        Every cell of the notebook in order: what it does, the main functions and variables it defines, who owns it, and where its results appear on this site.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <a href={NOTEBOOK_GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn"><BookOpen size={16} /> Notebook on GitHub</a>
        <a href={NOTEBOOK_COLAB_URL} target="_blank" rel="noopener noreferrer" className="btn"><ExternalLink size={16} /> Open in Colab</a>
      </div>
    </div>

    <CaveatBanner />

    <p className="section-lead">
      Owners: Person 1 built the foundation (C01–C11) and the one-call pipeline (C27); Person 2 the statistics, metrics, traversal, Bellman–Ford, figures and integration tests (C12–C19, C26); Person 3 the comparison, multi-density analysis, report and replication (C20–C25, C22S, C22R, C28). Test cells are marked <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>test</span>.
    </p>

    {GROUPS.map((g) => (
      <section key={g.name} style={{ marginBottom: '2rem' }}>
        <h2 className="section-title">{g.name} <span className="mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{g.range}</span></h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cell</th>
                <th>What it does</th>
                <th>Key functions / variables</th>
                <th>Owner</th>
                <th>Results on</th>
              </tr>
            </thead>
            <tbody>
              {g.cells.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.id}</span>
                    {c.test && <span className="badge badge-neutral" style={{ fontSize: '0.6rem', marginLeft: '0.35rem' }}>test</span>}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.title}</div>
                  </td>
                  <td style={{ minWidth: 220 }}>{c.does}</td>
                  <td className="mono" style={{ fontSize: '0.75rem', minWidth: 180 }}>{c.keys}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.owner}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.page ? <Link to={c.page.to}>{c.page.name}</Link> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    ))}
  </div>
);
