import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Database, GitBranch, ExternalLink } from 'lucide-react';
import { VerificationTest, EnvironmentData, ConfigData } from '../types';
import { useJSON, PENDING } from '../data';
import { NOTEBOOK_GITHUB_URL } from '../config';

export const Footer: React.FC = () => {
  const cfg = useJSON<ConfigData>('config.json');
  const tests = useJSON<VerificationTest[]>('verification_tests.json');
  const env = useJSON<EnvironmentData>('environment.json');
  const configHash = cfg?.config.hash ?? PENDING;
  const testCount = tests ? tests.reduce((acc, t) => acc + t.total, 0) : PENDING;
  const generatedAt = env?.created_at ?? PENDING;

  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
              Brain Connectome Analysis System
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6 }}>
              A graph-theoretic research application evaluating setting-sensitivity across multiple proportional densities without machine learning.
            </p>
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-neutral mono">Settings ID: {configHash}</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
              HCP Data Compliance
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6 }}>
              Based on the Human Connectome Project (HCP) Young Adult S1200 PTN release. Raw data is not redistributed under the HCP Open Access Data Use Terms and must be acquired from <a href="https://db.humanconnectome.org" target="_blank" rel="noopener noreferrer">ConnectomeDB</a>.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
              Resources & Integrity
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>
                <Link to="/limitations" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={14} /> Limitations & Research Integrity
                </Link>
              </li>
              <li>
                <Link to="/verification" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GitBranch size={14} /> Verification Suite ({testCount} Tests)
                </Link>
              </li>
              <li>
                <Link to="/data" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Database size={14} /> HCP Data Contracts & Validation
                </Link>
              </li>
              <li>
                <a
                  href={NOTEBOOK_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={14} /> Notebook Source of Truth
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            gap: '1rem',
          }}
        >
          <div>
            Descriptive Analysis • College Mini Project Presentation • GitHub Pages Static Build
          </div>
          <div className="mono">
            Generated: {generatedAt}
          </div>
        </div>
      </div>
    </footer>
  );
};

