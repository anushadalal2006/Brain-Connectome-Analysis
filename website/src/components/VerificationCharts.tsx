import React from 'react';
import Plot from './Plot';
import { useChartTheme, PLOT_CONFIG } from './chartTheme';
import { VerificationTest } from '../types';

/** Checks per test cell; hover shows the cell title. */
export const TestsBar: React.FC<{ tests: VerificationTest[] }> = ({ tests }) => {
  const { c, axis, layout } = useChartTheme();
  return (
    <Plot
      data={[{
        type: 'bar', x: tests.map((t) => t.id), y: tests.map((t) => t.passed),
        marker: { color: tests.map((t) => (t.passed === t.total ? c.consistent : c.partial)) },
        text: tests.map((t) => `${t.passed}/${t.total}`), textposition: 'outside', cliponaxis: false, textfont: { size: 11, color: c.text },
        customdata: tests.map((t) => [t.title, t.module]),
        hovertemplate: '%{x} · %{customdata[1]}<br>%{customdata[0]}<br>%{text} checks passed<extra></extra>',
      }] as any}
      layout={layout({
        height: 320, showlegend: false, margin: { t: 25, r: 10, b: 50, l: 50 },
        xaxis: axis('Notebook test cell', { type: 'category', gridcolor: 'rgba(0,0,0,0)' }),
        yaxis: axis('Checks passed'),
      }) as any}
      useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
    />
  );
};
