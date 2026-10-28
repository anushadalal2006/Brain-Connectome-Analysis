import React, { useEffect, useState } from 'react';
import Plot from './Plot';
import { MultiSettingValues, ProtocolV2Values } from '../types';
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
  const [subA, setSubA] = useState('100206');
  const [subB, setSubB] = useState('100307');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/config.json`)
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.subjects?.A) setSubA(cfg.subjects.A);
        if (cfg.subjects?.B) setSubB(cfg.subjects.B);
      })
      .catch(() => {});
  }, []);

  const densities = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
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
      line: { color: '#ea580c', width: 2.5 },
      marker: { size: 8, color: '#ea580c' },
    },
    {
      x: densities,
      y: bVals,
      type: 'scatter',
      mode: 'lines+markers',
      name: `Subject B (${subB})`,
      line: { color: '#7c3aed', width: 2.5 },
      marker: { size: 8, color: '#7c3aed' },
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
            title: { text: `Metric Value: ${selectedMetric}` },
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
