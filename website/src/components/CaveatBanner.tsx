import React from 'react';
import { useJSON, PENDING } from '../data';
import { ConfigData } from '../types';
import { Link } from 'react-router-dom';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface CaveatBannerProps {
  settingsId?: string;
}

export const CaveatBanner: React.FC<CaveatBannerProps> = ({ settingsId }) => {
  const cfg = useJSON<ConfigData>('config.json');
  const pairs = useJSON<{ pairs: string[][] }>('replication_meta.json');
  const hash = settingsId ?? cfg?.config.hash ?? PENDING;
  const nPairs = pairs ? pairs.pairs.length : PENDING;

  return (
    <div className="caveat-banner" role="alert">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertCircle size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
        <span>
          <strong>Descriptive Analysis:</strong> All metrics, labels, and comparisons are descriptive evaluations across {nPairs} subject pairs. This system does not perform significance testing, does not claim causality, and makes no clinical or diagnostic statements.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <span className="badge badge-neutral mono" title="Settings ID (hash of configuration)">
          ID: {hash}
        </span>
        <Link to="/limitations" className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
          <ShieldAlert size={14} />
          Limitations & Integrity
        </Link>
      </div>
    </div>
  );
};

