import React from 'react';
import Plot from './Plot';
import { useChartTheme, PLOT_CONFIG } from './chartTheme';
import { Legend } from './Legend';
import { GlobalStatistic, NodeStatistic } from '../types';

const STAT_PANELS: { title: string; stats: { key: string; label: string }[] }[] = [
  { title: 'Centre', stats: [{ key: 'mean', label: 'mean' }, { key: 'median', label: 'median' }] },
  { title: 'Spread', stats: [{ key: 'std', label: 'std' }, { key: 'iqr', label: 'IQR' }, { key: 'mean_abs', label: 'mean |w|' }] },
  { title: 'Shape', stats: [{ key: 'skewness', label: 'skewness' }, { key: 'excess_kurtosis', label: 'excess kurtosis' }] },
];

export const SubjectLegend: React.FC<{ subA: string; subB: string }> = ({ subA, subB }) => {
  const { c } = useChartTheme();
  return <Legend items={[{ label: `A (${subA})`, color: c.A }, { label: `B (${subB})`, color: c.B }]} />;
};

/** Grouped bars A vs B, one small panel per family of statistics (scales differ). */
export const StatisticsPanels: React.FC<{ stats: GlobalStatistic[]; subA: string; subB: string }> = ({ stats, subA, subB }) => {
  const { c, axis, layout } = useChartTheme();
  const get = (k: string) => stats.find((s) => s.statistic === k);
  return (
    <div className="mini-grid">
      {STAT_PANELS.map((p) => {
        const rows = p.stats.filter((s) => get(s.key));
        const x = rows.map((s) => s.label);
        const bar = (who: 'A' | 'B', name: string, color: string) => ({
          type: 'bar', name, x, y: rows.map((s) => get(s.key)![who]), marker: { color },
          hovertemplate: `${name}<br>%{x} = %{y:.4g}<extra></extra>`,
        });
        return (
          <div key={p.title} className="mini-panel">
            <div className="mini-panel-head"><span className="mini-panel-title">{p.title}</span></div>
            <Plot
              data={[bar('A', `A (${subA})`, c.A), bar('B', `B (${subB})`, c.B)] as any}
              layout={layout({
                height: 230, barmode: 'group', bargap: 0.3, bargroupgap: 0.08, showlegend: false,
                margin: { t: 8, r: 8, b: 40, l: 46 },
                xaxis: axis('', { gridcolor: 'rgba(0,0,0,0)' }),
                yaxis: axis('r-to-Z units', { zeroline: true, zerolinecolor: c.zero, title: { text: p.title === 'Shape' ? 'unitless' : 'r-to-Z units', font: { size: 10 } } }),
              }) as any}
              useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
            />
          </div>
        );
      })}
    </div>
  );
};

/** Mean |w| per node for A and B, with the IC067–IC100 range shaded. */
export const NodeStrengthLine: React.FC<{ nodes: NodeStatistic[]; subA: string; subB: string; shadeFrom: string; shadeTo: string }> = ({ nodes, subA, subB, shadeFrom, shadeTo }) => {
  const { c, axis, layout } = useChartTheme();
  const x = nodes.map((n) => n.label);
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines+markers', name: `A (${subA})`, x, y: nodes.map((n) => n.mean_abs_w_A), line: { color: c.A, width: 2 }, marker: { size: 5, color: c.A }, hovertemplate: `A %{x}<br>mean |w| = %{y:.3f}<extra></extra>` },
        { type: 'scatter', mode: 'lines+markers', name: `B (${subB})`, x, y: nodes.map((n) => n.mean_abs_w_B), line: { color: c.B, width: 2, dash: 'dot' }, marker: { size: 5, color: c.B, symbol: 'square' }, hovertemplate: `B %{x}<br>mean |w| = %{y:.3f}<extra></extra>` },
      ] as any}
      layout={layout({
        height: 340, showlegend: false,
        margin: { t: 10, r: 15, b: 60, l: 60 },
        shapes: [{ type: 'rect', xref: 'x', yref: 'paper', x0: shadeFrom, x1: shadeTo, y0: 0, y1: 1, fillcolor: c.band, line: { width: 0 }, layer: 'below' }],
        annotations: [{ xref: 'x', yref: 'paper', x: shadeFrom, y: 1, xanchor: 'left', yanchor: 'top', text: `${shadeFrom}–${shadeTo}`, showarrow: false, font: { size: 10, color: c.muted } }],
        xaxis: axis('Network node (ICA component)', { tickangle: -60, tickfont: { size: 9 }, nticks: 25 }),
        yaxis: axis('Mean |w| over the node\'s 99 pairs'),
      }) as any}
      useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
    />
  );
};

/** Share of positive and negative pairs per subject (red = positive, blue = negative). */
export const SignShareBars: React.FC<{ stats: GlobalStatistic[]; subA: string; subB: string }> = ({ stats, subA, subB }) => {
  const { c, axis, layout } = useChartTheme();
  const pos = stats.find((s) => s.statistic === 'share_positive');
  const neg = stats.find((s) => s.statistic === 'share_negative');
  const n = stats.find((s) => s.statistic === 'n_values');
  if (!pos || !neg) return null;
  const y = [`A (${subA})`, `B (${subB})`];
  const count = (share: number) => (n ? Math.round(share * n.A) : null);
  const seg = (name: string, vals: number[], color: string) => ({
    type: 'bar', orientation: 'h', name, y, x: vals, marker: { color, line: { color: c.surface, width: 2 } },
    text: vals.map((v) => `${(v * 100).toFixed(1)}%`), textposition: 'inside', insidetextanchor: 'middle', textfont: { color: '#ffffff' },
    customdata: vals.map((v) => count(v)),
    hovertemplate: `%{y}<br>${name}: %{x:.1%} (%{customdata} pairs)<extra></extra>`,
  });
  return (
    <>
      <Legend items={[{ label: 'positive pairs (w > 0)', color: c.pos }, { label: 'negative pairs (w < 0)', color: c.neg }]} />
      <Plot
        data={[seg('positive', [pos.A, pos.B], c.pos), seg('negative', [neg.A, neg.B], c.neg)] as any}
        layout={layout({
          barmode: 'stack', height: 170, showlegend: false, margin: { t: 5, r: 15, b: 45, l: 10 },
          xaxis: axis('Share of all node pairs', { tickformat: '.0%', range: [0, 1] }),
          yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)' }),
          shapes: [{ type: 'line', xref: 'x', yref: 'paper', x0: 0.5, x1: 0.5, y0: 0, y1: 1, line: { color: c.text, width: 1, dash: 'dot' } }],
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};
