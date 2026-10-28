import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Database, GitBranch, ExternalLink } from 'lucide-react';
import { VerificationTest, EnvironmentData } from '../types';

export const Footer: React.FC = () => {
  const [configHash, setConfigHash] = useState('f1ebb3fdc3');
  const [testCount, setTestCount] = useState(181);
  const [generatedAt, setGeneratedAt] = useState('2026-10-21T17:13:03Z');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/config.json`)
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.config?.hash) setConfigHash(cfg.config.hash);
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/verification_tests.json`)
      .then((r) => r.json())
      .then((tests: VerificationTest[]) => {
        const total = tests.reduce((acc, t) => acc + t.total, 0);
        if (total > 0) setTestCount(total);
      })
      .catch(() => {});

    fetch(`${import.meta.env.BASE_URL}data/environment.json`)
      .then((r) => r.json())
      .then((env: EnvironmentData) => {
        if (env.created_at) setGeneratedAt(env.created_at);
      })
      .catch(() => {});
  }, []);

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
                  href="https://github.com/anushadalal/Brain-Connectome-Analysis/blob/main/Brain_Connectome_Analysis.ipynb"
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
            Generated: {generatedAt} UTC
          </div>
        </div>
      </div>
    </footer>
  );
};

