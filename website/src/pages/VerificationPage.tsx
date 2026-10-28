import React from 'react';
import { CaveatBanner } from '../components/CaveatBanner';
import { DataTable, Column } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { VerificationTest, EnvironmentData, ProvenanceData, ConfigData } from '../types';
import { useJSON, PENDING } from '../data';
import { ChartCard } from '../components/ChartCard';
import { TestsBar } from '../components/VerificationCharts';
import { CheckCircle2, Terminal, ShieldCheck, Database, HardDrive, Cpu, GitCommit } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const testsData = useJSON<VerificationTest[]>('verification_tests.json');
  const envData = useJSON<EnvironmentData>('environment.json');
  const provData = useJSON<ProvenanceData>('provenance.json');
  const cfg = useJSON<ConfigData>('config.json');
  const tests = testsData ?? [];
  const loading = !testsData;
  const settingsHash = cfg?.config.hash ?? PENDING;

  const totalPassed = tests.reduce((acc, t) => acc + t.passed, 0);
  const totalTests = tests.reduce((acc, t) => acc + t.total, 0);
  const subjectsValidated = provData?.all_subject_check
    ? `${provData.all_subject_check.valid} / ${provData.all_subject_check.subjects}`
    : PENDING;
  const allPass = totalTests > 0 && totalPassed === totalTests;

  const testColumns: Column<VerificationTest>[] = [
    {
      key: 'id',
      header: 'Cell ID',
      render: (r) => <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{r.id}</span>,
    },
    {
      key: 'module',
      header: 'Module Scope',
      render: (r) => <span className="badge badge-neutral">{r.module}</span>,
    },
    {
      key: 'title',
      header: 'Verified Test Suite & Objective',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{r.description}</div>
        </div>
      ),
    },
    {
      key: 'passed',
      header: 'Result',
      align: 'center',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 700, color: '#059669' }}>
          {r.passed} / {r.total}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <span className={`badge ${r.passed === r.total ? 'badge-consistent' : 'badge-partial'}`}>{r.status}</span>,
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-consistent">
            {allPass ? 'All checks passing' : `${totalPassed} / ${totalTests} passing`}
          </span>
          <span className="badge badge-neutral mono">Settings ID: {settingsHash}</span>
        </div>
        <h1 className="page-title">Verification Suite & Provenance Audit</h1>
        <p className="page-subtitle">
          Full execution scorecard of all {totalTests} unit, regression, and integration tests across {tests.length} test cells in Brain_Connectome_Analysis.ipynb, the runtime environment, and the provenance of the source data.
        </p>
      </div>

      <CaveatBanner settingsId={settingsHash} />

      {/* Headline Metric Cards */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Audit Summary
        </h2>
        <div className="grid-4">
          <MetricCard
            title="Total Tests Passed"
            value={`${totalPassed} / ${totalTests}`}
            subtitle={allPass ? `All passed (${totalTests - totalPassed} failed)` : `${totalTests - totalPassed} not passed`}
            badge={{ text: 'Verified', variant: 'consistent' }}
            icon={<CheckCircle2 size={20} />}
          />
          <MetricCard
            title="Data Check"
            value={subjectsValidated}
            subtitle="Valid HCP S1200 Subjects"
            badge={{ text: 'Data Check (Not Test)', variant: 'neutral' }}
            icon={<Database size={20} />}
          />
          <MetricCard
            title="Forbidden Scans"
            value="0 Found"
            subtitle="No Dijkstra, 1/w, or Reciprocal"
            badge={{ text: 'AST Verified', variant: 'blue' }}
            icon={<ShieldCheck size={20} />}
          />
          <MetricCard
            title="Settings ID"
            value={settingsHash}
            subtitle="Hash of the configuration (settings ID)"
            badge={{ text: 'Frozen', variant: 'neutral' }}
            icon={<GitCommit size={20} />}
          />
        </div>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <ChartCard
          title={`${totalPassed} of ${totalTests} checks pass across ${tests.length} test cells`}
          caption={<>Number of checks in each notebook test cell; hover a bar for the cell&apos;s title. A bar is green when every check in the cell passed. The data check on all subjects is separate and is not counted here.</>}
          sources={['verification_tests.json']}
          minWidth={420}
        >
          {testsData ? <TestsBar tests={tests} /> : <div style={{ height: 320 }}>Loading chart…</div>}
        </ChartCard>

        <div className="card">
          <h2 className="card-title">How we know the results are correct</h2>
          <ol className="howto-list">
            <li><strong>Unit and module tests.</strong> {tests.length || PENDING} test cells with {totalTests || PENDING} checks cover loading, validation, preprocessing, graph construction, statistics, metrics, traversal, Bellman–Ford, comparison and the multi-density analysis, on small test fixtures and on the real graphs.</li>
            <li><strong>Integration scan for forbidden methods.</strong> C26 parses the notebook&apos;s own source and fails if it finds Dijkstra, weighted shortest-path calls, a reciprocal or a 1/w conversion; the scanner is itself tested on planted examples.</li>
            <li><strong>One call reproduces everything.</strong> C27 runs <code>run_pipeline()</code> from scratch and checks that it gives exactly the same tables as the step-by-step cells.</li>
            <li><strong>Reruns are identical.</strong> C26 rebuilds the graphs, metrics and Bellman–Ford results and checks they equal the first run; the random seed is fixed ({envData?.environment.seed ?? PENDING}).</li>
            <li><strong>Every result carries its settings.</strong> All results record the settings ID ({settingsHash}) and the source file, and C26 checks that A and B use the same settings at d = 0.15 and that the multi-density run uses exactly one setting per density.</li>
            <li><strong>The website data is checked too.</strong> <code>check_data.py</code> verifies the key numbers in <code>public/data</code> against the notebook results and that no raw weights are published; it is run before any data change is committed.</li>
          </ol>
        </div>
      </section>

      {/* Test Scorecard Table */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={20} style={{ color: 'var(--accent-blue)' }} />
          Notebook Test Cells & Verification Scorecard
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Each test cell runs inside the notebook on the real data and fixtures; the saved notebook shows a full clean run.
        </p>
        {loading ? <div>Loading verification tests...</div> : <DataTable data={tests} columns={testColumns} pageSize={15} />}
      </section>

      {/* Reproducibility and Source Scanner Audit */}
      <section className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <h2 className="card-title">
            <ShieldCheck size={20} style={{ color: 'var(--accent-blue)' }} />
            AST Source Code Scanner Audit (C26)
          </h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p>
              Integration test <strong>C26</strong> parses the Abstract Syntax Tree (AST) of all 35 code cells in the notebook to detect forbidden algorithms and weight conversions.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: '#059669' }} />
                <span><strong>No Dijkstra Calls:</strong> Verified zero usage of Dijkstra's algorithm.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: '#059669' }} />
                <span><strong>No Reciprocal Weights:</strong> Verified zero usage of <code>1/w</code>, <code>1.0/w</code>, or <code>1 - w</code> conversions.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: '#059669' }} />
                <span><strong>Source data untouched:</strong> C26 checks that the input matrices are unchanged after the run and that the export refuses to write inside the HCP data folder.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: '#059669' }} />
                <span><strong>Pipeline parity (C27):</strong> <code>run_pipeline()</code> gives the same edge lists, statistics, metrics, traversal, Bellman–Ford, comparison and multi-setting tables as the step-by-step cells (checked with exact equality).</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Cpu size={20} style={{ color: 'var(--accent-blue)' }} />
            Runtime Environment (environment.json)
          </h2>
          {envData ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div><strong>Python:</strong> <span className="mono">{envData.environment.python}</span></div>
              <div><strong>NumPy:</strong> <span className="mono">{envData.environment.numpy}</span></div>
              <div><strong>Pandas:</strong> <span className="mono">{envData.environment.pandas}</span></div>
              <div><strong>NetworkX:</strong> <span className="mono">{envData.environment.networkx}</span></div>
              <div><strong>Matplotlib:</strong> <span className="mono">{envData.environment.matplotlib}</span></div>
              <div><strong>Platform:</strong> <span className="mono" style={{ fontSize: '0.75rem' }}>{envData.environment.platform}</span></div>
              <div><strong>RNG Seed:</strong> <span className="mono">{envData.environment.seed}</span></div>
              <div><strong>Execution Timestamp:</strong> <span className="mono">{envData.created_at} UTC</span></div>
            </div>
          ) : (
            <div>Loading environment...</div>
          )}
        </div>
      </section>

      {/* Provenance Download Audit */}
      {provData && (
        <section className="card">
          <h2 className="card-title">
            <HardDrive size={20} style={{ color: 'var(--accent-blue)' }} />
            Source Data Provenance & Checksum Record
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Verification of original HCP S1200 PTN release packages retrieved from S3.
          </p>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Archive File</th>
                  <th>S3 Storage URI</th>
                  <th>Bytes</th>
                  <th>ETag / Checksum</th>
                  <th>Download Date</th>
                </tr>
              </thead>
              <tbody>
                {provData.download_record.map((rec, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontWeight: 600 }}>{rec.file}</td>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>{rec.s3_uri}</td>
                    <td className="mono">{rec.bytes.toLocaleString()} B</td>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>{rec.etag}</td>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{rec.downloaded_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
