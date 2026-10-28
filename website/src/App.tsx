import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { DataPage } from './pages/DataPage';
import { MethodsPage } from './pages/MethodsPage';
import { SingleNetworksPage } from './pages/SingleNetworksPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { MultiDensityPage } from './pages/MultiDensityPage';
import { ReplicationPage } from './pages/ReplicationPage';
import { VerificationPage } from './pages/VerificationPage';
import { LimitationsPage } from './pages/LimitationsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
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
          </main>
          <Footer />
        </div>
      </HashRouter>
    </ThemeProvider>
  );
};
