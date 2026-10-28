import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Github, ExternalLink, Menu, X, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Data', path: '/data' },
    { name: 'Methods', path: '/methods' },
    { name: 'Single Networks', path: '/networks' },
    { name: 'Comparison', path: '/comparison' },
    { name: 'Multi-Density', path: '/multi-density' },
    { name: 'Replication', path: '/replication' },
    { name: 'Verification', path: '/verification' },
    { name: 'Limitations', path: '/limitations' },
  ];

  return (
    <nav className="navbar">
      <div className="container nav-container" style={{ maxWidth: 1440 }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
          <Activity size={24} style={{ color: 'var(--accent-blue)' }} />
          <div>
            <span className="nav-title">
              Brain Connectome Analysis
            </span>
            <span className="nav-subtitle">
              Graph-based · No ML · HCP S1200
            </span>
          </div>
        </NavLink>

        {/* Desktop Links */}
        <div className="nav-links" style={{ display: 'none' }} id="desktop-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <a
            href="https://github.com/anushadalal/Brain-Connectome-Analysis/blob/main/Brain_Connectome_Analysis.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ padding: '0.4rem 0.65rem' }}
            title="View Notebook on GitHub"
          >
            <Github size={16} />
            <span className="hide-sm" style={{ fontSize: '0.75rem' }}>GitHub</span>
          </a>

          <a
            href="https://colab.research.google.com/github/anushadalal/Brain-Connectome-Analysis/blob/main/Brain_Connectome_Analysis.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ padding: '0.4rem 0.65rem' }}
            title="Open in Google Colab (Requires HCP data in Google Drive)"
          >
            <ExternalLink size={16} />
            <span className="hide-sm" style={{ fontSize: '0.75rem' }}>Colab</span>
          </a>

          <button
            onClick={toggleTheme}
            className="btn"
            style={{ padding: '0.4rem 0.6rem' }}
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn"
            style={{ padding: '0.4rem 0.6rem', display: 'none' }}
            id="mobile-toggle"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Desktop navigation CSS override */}
      <style>{`
        @media (min-width: 1240px) {
          #desktop-nav { display: flex !important; }
          #mobile-toggle { display: none !important; }
        }
        @media (max-width: 1239px) {
          #mobile-toggle { display: inline-flex !important; }
        }
        @media (max-width: 1499px) {
          .hide-sm { display: none; }
        }
      `}</style>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};
