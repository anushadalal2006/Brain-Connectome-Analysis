import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface CaveatBannerProps {
  settingsId?: string;
}

export const CaveatBanner: React.FC<CaveatBannerProps> = ({ settingsId }) => {
  const [hash, setHash] = useState(settingsId || 'f1ebb3fdc3');

  useEffect(() => {
    if (!settingsId) {
      fetch(`${import.meta.env.BASE_URL}data/config.json`)
        .then((r) => r.json())
        .then((cfg) => {
          if (cfg.config?.hash) setHash(cfg.config.hash);
        })
        .catch(() => {});
    } else {
      setHash(settingsId);
    }
  }, [settingsId]);

  return (
    <div className="caveat-banner" role="alert">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertCircle size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
        <span>
          <strong>Descriptive Analysis:</strong> All metrics, labels, and comparisons are descriptive evaluations across 5 subject pairs. This system does not perform significance testing, does not claim causality, and makes no clinical or diagnostic statements.
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

