import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages are code-split: each loads on first visit.
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const DataPage = lazy(() => import('./pages/DataPage').then((m) => ({ default: m.DataPage })));
const MethodsPage = lazy(() => import('./pages/MethodsPage').then((m) => ({ default: m.MethodsPage })));
const SingleNetworksPage = lazy(() => import('./pages/SingleNetworksPage').then((m) => ({ default: m.SingleNetworksPage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then((m) => ({ default: m.ComparisonPage })));
const MultiDensityPage = lazy(() => import('./pages/MultiDensityPage').then((m) => ({ default: m.MultiDensityPage })));
const ReplicationPage = lazy(() => import('./pages/ReplicationPage').then((m) => ({ default: m.ReplicationPage })));
const VerificationPage = lazy(() => import('./pages/VerificationPage').then((m) => ({ default: m.VerificationPage })));
const LimitationsPage = lazy(() => import('./pages/LimitationsPage').then((m) => ({ default: m.LimitationsPage })));

const PageLoading: React.FC = () => (
  <div className="container" style={{ padding: '3rem 1.25rem', color: 'var(--text-muted)' }}>Loading page…</div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/data" element={<DataPage />} />
              <Route path="/methods" element={<MethodsPage />} />
              <Route path="/networks" element={<SingleNetworksPage />} />
              <Route path="/comparison" element={<ComparisonPage />} />
              <Route path="/multi-density" element={<MultiDensityPage />} />
              <Route path="/replication" element={<ReplicationPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/limitations" element={<LimitationsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </ThemeProvider>
  );
};
