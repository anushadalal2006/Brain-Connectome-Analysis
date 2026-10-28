import React from 'react';
import Plot from './Plot';
import { MultiSettingValues, ProtocolV2Values, ConfigData } from '../types';
import { useJSON, PENDING } from '../data';
import { useTheme } from '../context/ThemeContext';

interface PlotlyTrajectoryChartProps {
  v1Values: MultiSettingValues[];
  v2Values: ProtocolV2Values[];
  mode: 'v1' | 'v2';
  selectedMetric: string;
}

export const PlotlyTrajectoryChart: React.FC<PlotlyTrajectoryChartProps> = ({
  v1Values,
  v2Values,
  mode,
  selectedMetric,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cfg = useJSON<ConfigData>('config.json');
  const subA = cfg?.subjects.A ?? PENDING;
  const subB = cfg?.subjects.B ?? PENDING;

  const densities = (mode === 'v2' ? v2Values : v1Values).map((r) => r.density as number);
  const aVals: number[] = [];
  const bVals: number[] = [];

  densities.forEach((d) => {
    if (mode === 'v2') {
      const row = v2Values.find((r) => Math.abs(r.density - d) < 1e-4);
      if (row) {
        aVals.push((row[`${selectedMetric}_A`] as number) ?? 0);
        bVals.push((row[`${selectedMetric}_B`] as number) ?? 0);
      } else {
        aVals.push(0);
        bVals.push(0);
      }
    } else {
      const row = v1Values.find((r) => Math.abs((r.density as number) - d) < 1e-4);
      if (row) {
        aVals.push((row[`${selectedMetric}_A`] as number) ?? 0);
        bVals.push((row[`${selectedMetric}_B`] as number) ?? 0);
      } else {
        aVals.push(0);
        bVals.push(0);
      }
    }
  });

  const plotData: any[] = [
    {
      x: densities,
      y: aVals,
      type: 'scatter',
      mode: 'lines+markers',
      name: `Subject A (${subA})`,
      line: { color: isDark ? '#fb923c' : '#ea580c', width: 2.5 },
      marker: { size: 8, color: isDark ? '#fb923c' : '#ea580c' },
    },
    {
      x: densities,
      y: bVals,
      type: 'scatter',
      mode: 'lines+markers',
      name: `Subject B (${subB})`,
      line: { color: isDark ? '#a78bfa' : '#7c3aed', width: 2.5 },
      marker: { size: 8, color: isDark ? '#a78bfa' : '#7c3aed' },
    },
  ];

  return (
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
            title: { text: 'Proportional Density (d)' },
            tickvals: densities,
            tickformat: '.2f',
            gridcolor: isDark ? '#1f2937' : '#e2e8f0',
            zerolinecolor: isDark ? '#374151' : '#cbd5e1',
          },
          yaxis: {
            title: { text: `${selectedMetric} value` },
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
  );
};
