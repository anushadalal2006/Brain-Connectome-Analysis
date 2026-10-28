import React from 'react';
import Plot from './Plot';
import { useChartTheme, PLOT_CONFIG } from './chartTheme';
import { Legend } from './Legend';
import { metricName } from '../metrics';
import { ComparisonGlobal, ComparisonNode, ComparisonEdge } from '../types';

/** Dumbbell: A and B per metric, each divided by the pair's mean so all metrics share one axis. */
export const GlobalDumbbell: React.FC<{ rows: ComparisonGlobal[]; subA: string; subB: string }> = ({ rows, subA, subB }) => {
  const { c, axis, layout } = useChartTheme();
  const items = rows.map((r) => {
    const m = (r.A + r.B) / 2;
    return { ...r, name: `${metricName(r.metric)}${r.scale_dependent ? ' *' : ''}`, a: m !== 0 ? r.A / m : 1, b: m !== 0 ? r.B / m : 1 };
  });
  const y = items.map((d) => d.name);
  const lineX: (number | null)[] = [];
  const lineY: (string | null)[] = [];
  items.forEach((d) => { lineX.push(d.a, d.b, null); lineY.push(d.name, d.name, null); });
  return (
    <>
      <Legend items={[{ label: `A (${subA})`, color: c.A }, { label: `B (${subB})`, color: c.B }]} />
      <Plot
        data={[
          { type: 'scatter', mode: 'lines', x: lineX, y: lineY, line: { color: c.zero, width: 2 }, hoverinfo: 'skip', showlegend: false },
          { type: 'scatter', mode: 'markers', name: `A (${subA})`, x: items.map((d) => d.a), y, customdata: items.map((d) => d.A), marker: { color: c.A, size: 11, line: { color: c.surface, width: 1.5 } }, hovertemplate: `%{y}<br>A = %{customdata:.4g} (%{x:.2f} × pair mean)<extra></extra>` },
          { type: 'scatter', mode: 'markers', name: `B (${subB})`, x: items.map((d) => d.b), y, customdata: items.map((d) => d.B), marker: { color: c.B, size: 11, symbol: 'square', line: { color: c.surface, width: 1.5 } }, hovertemplate: `%{y}<br>B = %{customdata:.4g} (%{x:.2f} × pair mean)<extra></extra>` },
        ] as any}
        layout={layout({
          height: 60 + items.length * 32, showlegend: false, margin: { t: 10, r: 20, b: 50, l: 10 },
          xaxis: axis('Value relative to the mean of A and B (1 = equal)', { zeroline: false }),
          yaxis: axis('', { autorange: 'reversed', automargin: true }),
          shapes: [{ type: 'line', xref: 'x', yref: 'paper', x0: 1, x1: 1, y0: 0, y1: 1, line: { color: c.text, width: 1, dash: 'dot' } }],
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

/** Degree of each node in A vs B, with the y = x line and the top-10 |Δ degree| nodes labelled. */
export const DegreeScatter: React.FC<{ nodes: ComparisonNode[] }> = ({ nodes }) => {
  const { c, axis, layout } = useChartTheme();
  const top = new Set([...nodes].sort((a, b) => Math.abs(b.d_degree) - Math.abs(a.d_degree) || a.node - b.node).slice(0, 10).map((n) => n.node));
  const rest = nodes.filter((n) => !top.has(n.node));
  const hi = nodes.filter((n) => top.has(n.node));
  const max = Math.max(...nodes.map((n) => Math.max(n.degree_A, n.degree_B))) + 2;
  const hover = 'Node %{text}<br>degree A = %{x}, B = %{y}<br>Δ = %{customdata}<extra></extra>';
  return (
    <>
      <Legend items={[{ label: 'node', color: c.muted }, { label: 'top 10 by |Δ degree| (labelled)', color: c.text }, { label: 'y = x (same degree)', color: c.zero, shape: 'dash' }]} />
      <Plot
        data={[
          { type: 'scatter', mode: 'lines', x: [0, max], y: [0, max], line: { color: c.zero, dash: 'dash', width: 1.2 }, hoverinfo: 'skip' },
          { type: 'scatter', mode: 'markers', x: rest.map((n) => n.degree_A), y: rest.map((n) => n.degree_B), text: rest.map((n) => n.label), customdata: rest.map((n) => n.d_degree), marker: { color: c.muted, size: 7, opacity: 0.7 }, hovertemplate: hover },
          { type: 'scatter', mode: 'markers+text', x: hi.map((n) => n.degree_A), y: hi.map((n) => n.degree_B), text: hi.map((n) => n.label), customdata: hi.map((n) => n.d_degree), textposition: 'top center', textfont: { size: 10, color: c.text }, marker: { color: c.text, size: 10, line: { color: c.surface, width: 1.5 } }, hovertemplate: hover },
        ] as any}
        layout={layout({
          height: 420, showlegend: false, margin: { t: 10, r: 20, b: 50, l: 55 },
          xaxis: axis('Degree in A', { range: [-1, max] }),
          yaxis: axis('Degree in B', { range: [-1, max] }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

/** Diverging bar of the 20 nodes with the largest |Δ degree|. */
export const DegreeDiffBars: React.FC<{ nodes: ComparisonNode[] }> = ({ nodes }) => {
  const { c, axis, layout } = useChartTheme();
  const top = [...nodes].sort((a, b) => Math.abs(b.d_degree) - Math.abs(a.d_degree) || a.node - b.node).slice(0, 20);
  return (
    <>
      <Legend items={[{ label: 'A has more edges', color: c.A }, { label: 'B has more edges', color: c.B }]} />
      <Plot
        data={[{
          type: 'bar', orientation: 'h', y: top.map((n) => n.label), x: top.map((n) => n.d_degree),
          marker: { color: top.map((n) => (n.d_degree >= 0 ? c.A : c.B)) },
          text: top.map((n) => (n.d_degree > 0 ? `+${n.d_degree}` : `−${Math.abs(n.d_degree)}`)), textposition: 'outside', cliponaxis: false, textfont: { size: 10, color: c.text },
          customdata: top.map((n) => [n.degree_A, n.degree_B]),
          hovertemplate: '%{y}<br>degree A = %{customdata[0]}, B = %{customdata[1]}<extra></extra>',
        }] as any}
        layout={layout({
          height: 520, showlegend: false, margin: { t: 10, r: 40, b: 50, l: 10 },
          xaxis: axis('Δ degree = degree A − degree B', { zeroline: true, zerolinecolor: c.text }),
          yaxis: axis('', { autorange: 'reversed', type: 'category', gridcolor: 'rgba(0,0,0,0)' }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

export const ISOLATION_TEXT: Record<string, string> = {
  neither: 'connected in both',
  A_only: 'isolated only in A',
  B_only: 'isolated only in B',
  both: 'isolated in both',
};

/** Number of nodes per isolation-change category. */
export const IsolationBars: React.FC<{ nodes: ComparisonNode[] }> = ({ nodes }) => {
  const { c, axis, layout } = useChartTheme();
  const cats = ['neither', 'B_only', 'both', 'A_only'];
  const colors: Record<string, string> = { neither: c.text, A_only: c.A, B_only: c.B, both: c.both };
  const counts = cats.map((k) => nodes.filter((n) => n.isolation_change === k).length);
  return (
    <Plot
      data={[{
        type: 'bar', x: cats.map((k) => ISOLATION_TEXT[k]), y: counts, marker: { color: cats.map((k) => colors[k]) },
        text: counts.map(String), textposition: 'outside', cliponaxis: false, textfont: { color: c.text },
        hovertemplate: '%{x}: %{y} nodes<extra></extra>',
      }] as any}
      layout={layout({
        height: 300, showlegend: false, margin: { t: 20, r: 10, b: 60, l: 50 },
        xaxis: axis('', { gridcolor: 'rgba(0,0,0,0)' }),
        yaxis: axis('Number of nodes'),
      }) as any}
      useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
    />
  );
};

/** Stacked bar of the union of edges: in both, only A, only B; sign flips marked separately. */
export const OverlapBar: React.FC<{ edges: ComparisonEdge[] }> = ({ edges }) => {
  const { c, axis, layout } = useChartTheme();
  const both = edges.filter((e) => e.status === 'both');
  const flips = both.filter((e) => e.sign_flip).length;
  const segs = [
    { name: 'in both, same sign', n: both.length - flips, color: c.both },
    { name: 'in both, sign flip', n: flips, color: c.flip },
    { name: 'only in A', n: edges.filter((e) => e.status === 'A_only').length, color: c.A },
    { name: 'only in B', n: edges.filter((e) => e.status === 'B_only').length, color: c.B },
  ];
  return (
    <>
      <Legend items={segs.map((s) => ({ label: `${s.name} (${s.n})`, color: s.color }))} />
      <Plot
        data={segs.map((s) => ({
          type: 'bar', orientation: 'h', name: s.name, y: ['all edges'], x: [s.n],
          marker: { color: s.color, line: { color: c.surface, width: 2 } },
          text: [s.n > 20 ? String(s.n) : ''], textposition: 'inside', insidetextanchor: 'middle', textfont: { color: '#ffffff' },
          hovertemplate: `${s.name}: %{x} edges<extra></extra>`,
        })) as any}
        layout={layout({
          barmode: 'stack', height: 140, showlegend: false, margin: { t: 5, r: 15, b: 45, l: 10 },
          xaxis: axis(`Edges in A or B (union of ${edges.length})`),
          yaxis: axis('', { showticklabels: false, gridcolor: 'rgba(0,0,0,0)' }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};
