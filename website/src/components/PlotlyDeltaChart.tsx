import React from 'react';
import Plot from './Plot';
import { MultiSettingValues, ProtocolV2Values } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PlotlyDeltaChartProps {
  v1Values: MultiSettingValues[];
  v2Values: ProtocolV2Values[];
  mode: 'v1' | 'v2';
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
}

export const PlotlyDeltaChart: React.FC<PlotlyDeltaChartProps> = ({
  v1Values,
  v2Values,
  mode,
  selectedMetric,
  onMetricChange,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Metrics options based on mode derived dynamically from loaded JSON records
  const v1Metrics = React.useMemo(() => {
    if (v1Values.length > 0) {
      const keys = Object.keys(v1Values[0]);
      return Array.from(new Set(keys.filter((k) => k.endsWith('_A')).map((k) => k.replace(/_A$/, ''))));
    }
    return [
      'avg_clustering_all',
      'avg_clustering_lcc',
      'transitivity_all',
      'transitivity_lcc',
      'n_components',
      'largest_component_size',
      'n_isolated',
      'mean_strength',
      'mean_strength_lcc',
      'share_negative_edges',
      'mean_abs_weight',
    ];
  }, [v1Values]);

  const v2Metrics = React.useMemo(() => {
    if (v2Values.length > 0) {
      const keys = Object.keys(v2Values[0]);
      return Array.from(new Set(keys.filter((k) => k.endsWith('_A')).map((k) => k.replace(/_A$/, ''))));
    }
    return [
      'avg_clustering_all',
      'avg_clustering_lcc',
      'transitivity_all',
      'transitivity_lcc',
      'n_components',
      'largest_component_size',
      'n_isolated',
      'mean_strength_norm',
      'mean_strength_lcc_norm',
      'share_negative_edges',
      'mean_abs_weight_norm',
    ];
  }, [v2Values]);

  const currentMetrics = mode === 'v2' ? v2Metrics : v1Metrics;

  // Compute densities, deltas, and tolerance band
  const densities = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
  const deltas: number[] = [];
  const upperBand: number[] = [];
  const lowerBand: number[] = [];

  densities.forEach((d) => {
    if (mode === 'v2') {
      const row = v2Values.find((r) => Math.abs(r.density - d) < 1e-4);
      if (row) {
        const valA = (row[`${selectedMetric}_A`] as number) ?? 0;
        const valB = (row[`${selectedMetric}_B`] as number) ?? 0;
        const delta = valA - valB;
        deltas.push(delta);

        // 1% relative tolerance threshold: ±0.01 * mean(|A|, |B|)
        const meanMag = (Math.abs(valA) + Math.abs(valB)) / 2;
        const tol = Math.max(1e-9, 0.01 * meanMag);
        upperBand.push(tol);
        lowerBand.push(-tol);
      } else {
        deltas.push(0);
        upperBand.push(0);
        lowerBand.push(0);
      }
    } else {
      const row = v1Values.find((r) => Math.abs((r.density as number) - d) < 1e-4);
      if (row) {
        const valA = (row[`${selectedMetric}_A`] as number) ?? 0;
        const valB = (row[`${selectedMetric}_B`] as number) ?? 0;
        deltas.push(valA - valB);
      } else {
        deltas.push(0);
      }
    }
  });

  const plotData: any[] = [];

  // If in v2 mode, draw the shaded 1% tolerance band
  if (mode === 'v2') {
    // Upper band trace
    plotData.push({
      x: densities,
      y: upperBand,
      type: 'scatter',
      mode: 'lines',
      line: { color: 'rgba(100, 116, 139, 0.2)', width: 0 },
      hoverinfo: 'none',
      showlegend: false,
    });
    // Lower band trace with fill to upper
    plotData.push({
      x: densities,
      y: lowerBand,
      type: 'scatter',
      mode: 'lines',
      fill: 'tonexty',
      fillcolor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.15)',
      line: { color: 'rgba(100, 116, 139, 0.2)', width: 0 },
      name: '1% minimum gap (negligible zone)',
      hoverinfo: 'y',
    });
  }

  // Delta trajectory line
  plotData.push({
    x: densities,
    y: deltas,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'ΔM(d) = A − B',
    line: {
      color: isDark ? '#f9fafb' : '#0f172a',
      width: 2.5,
    },
    marker: {
      size: 8,
      color: isDark ? '#f9fafb' : '#0f172a',
    },
  });

  // Zero reference line
  plotData.push({
    x: [0.04, 0.31],
    y: [0, 0],
    type: 'scatter',
    mode: 'lines',
    name: 'Zero Baseline',
    line: {
      color: isDark ? '#64748b' : '#94a3b8',
      width: 1.5,
      dash: 'dash',
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="metric-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select Metric:</label>
          <select
            id="metric-select"
            value={selectedMetric}
            onChange={(e) => onMetricChange(e.target.value)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
            }}
          >
            {currentMetrics.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {mode === 'v2' ? 'Protocol v2 (with ±1% tolerance band)' : 'Frozen Protocol v1 (Raw deltas)'}
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            height: 420,
            margin: { t: 30, r: 30, b: 50, l: 60 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {
              family: 'Inter, sans-serif',
              color: isDark ? '#f9fafb' : '#0f172a',
            },
            xaxis: {
              title: { text: 'Proportional density d' },
              tickvals: densities,
              tickformat: '.2f',
              gridcolor: isDark ? '#1f2937' : '#e2e8f0',
              zerolinecolor: isDark ? '#374151' : '#cbd5e1',
            },
            yaxis: {
              title: { text: `Δ ${selectedMetric} (A − B)` },
              automargin: true,
              gridcolor: isDark ? '#1f2937' : '#e2e8f0',
              zerolinecolor: isDark ? '#374151' : '#cbd5e1',
            },
            showlegend: true,
            legend: {
              orientation: 'h',
              y: 1.12,
              x: 0,
            },
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
};
