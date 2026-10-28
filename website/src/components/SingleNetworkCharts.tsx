import React from 'react';
import Plot from './Plot';
import { useChartTheme, PLOT_CONFIG } from './chartTheme';
import { Legend } from './Legend';
import { NodeMetric, ShortestPathSummary } from '../types';

type Who = 'A' | 'B';
const val = (n: NodeMetric, field: string, who: Who) => (n as any)[`${field}_${who}`] as number;

export const ABLegend: React.FC<{ subA: string; subB: string }> = ({ subA, subB }) => {
  const { c } = useChartTheme();
  return <Legend items={[{ label: `A (${subA})`, color: c.A }, { label: `B (${subB})`, color: c.B }]} />;
};

/** Overlaid histograms of one node measure for A and B, same bins. */
export const NodeHistogram: React.FC<{ nodes: NodeMetric[]; field: 'degree' | 'strength'; binSize: number; xTitle: string; subA: string; subB: string }> = ({ nodes, field, binSize, xTitle, subA, subB }) => {
  const { c, axis, layout } = useChartTheme();
  const all = nodes.flatMap((n) => [val(n, field, 'A'), val(n, field, 'B')]);
  const start = Math.floor(Math.min(...all) / binSize) * binSize;
  const end = Math.ceil((Math.max(...all) + 1e-9) / binSize) * binSize;
  const tr = (who: Who, name: string, color: string) => ({
    type: 'histogram', name, x: nodes.map((n) => val(n, field, who)),
    xbins: { start, end, size: binSize }, autobinx: false,
    marker: { color, line: { color: c.surface, width: 1 } }, opacity: 0.7,
    hovertemplate: `${name}<br>${xTitle} %{x}<br>%{y} nodes<extra></extra>`,
  });
  return (
    <Plot
      data={[tr('A', `A (${subA})`, c.A), tr('B', `B (${subB})`, c.B)] as any}
      layout={layout({
        barmode: 'overlay', height: 300, showlegend: false, bargap: 0.05,
        margin: { t: 10, r: 15, b: 50, l: 55 },
        xaxis: axis(xTitle, { zeroline: field === 'strength', zerolinecolor: c.text }),
        yaxis: axis('Number of nodes'),
      }) as any}
      useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
    />
  );
};

/** Clustering vs degree, one trace per subject. */
export const ClusteringScatter: React.FC<{ nodes: NodeMetric[]; subA: string; subB: string }> = ({ nodes, subA, subB }) => {
  const { c, axis, layout } = useChartTheme();
  const tr = (who: Who, name: string, color: string, symbol: string) => ({
    type: 'scatter', mode: 'markers', name,
    x: nodes.map((n) => val(n, 'degree', who)), y: nodes.map((n) => val(n, 'clustering', who)),
    text: nodes.map((n) => n.label),
    marker: { color, size: 8, symbol, opacity: 0.8, line: { color: c.surface, width: 1 } },
    hovertemplate: `${name} %{text}<br>degree %{x}<br>clustering %{y:.3f}<extra></extra>`,
  });
  return (
    <Plot
      data={[tr('A', `A (${subA})`, c.A, 'circle'), tr('B', `B (${subB})`, c.B, 'square')] as any}
      layout={layout({
        height: 340, showlegend: false, margin: { t: 10, r: 15, b: 50, l: 55 },
        xaxis: axis('Degree (number of kept edges)'),
        yaxis: axis('Clustering coefficient (binary)', { range: [-0.03, 1.03] }),
      }) as any}
      useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
    />
  );
};

/** Positive (red) and negative (blue) edge counts per node, stacked. */
export const SignCountBars: React.FC<{ nodes: NodeMetric[]; who: Who; sortBy: 'node' | 'degree' }> = ({ nodes, who, sortBy }) => {
  const { c, axis, layout } = useChartTheme();
  const rows = [...nodes].sort((a, b) => (sortBy === 'node' ? a.node - b.node : val(b, 'degree', who) - val(a, 'degree', who) || a.node - b.node));
  const x = rows.map((n) => n.label);
  const seg = (name: string, field: string, color: string) => ({
    type: 'bar', name, x, y: rows.map((n) => val(n, field, who)), marker: { color },
    hovertemplate: `%{x}<br>${name}: %{y}<extra></extra>`,
  });
  return (
    <>
      <Legend items={[{ label: 'positive edges (w > 0)', color: c.pos }, { label: 'negative edges (w < 0)', color: c.neg }]} />
      <Plot
        data={[seg('positive edges', 'n_pos_edges', c.pos), seg('negative edges', 'n_neg_edges', c.neg)] as any}
        layout={layout({
          barmode: 'stack', height: 330, showlegend: false, bargap: 0.15,
          margin: { t: 10, r: 10, b: 60, l: 50 },
          xaxis: axis('Network node (ICA component)', { type: 'category', tickangle: -60, tickfont: { size: 9 }, nticks: 30 }),
          yaxis: axis('Kept edges at the node'),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

/** Component structure per subject: largest component, other components, isolated nodes. */
export const ComponentBars: React.FC<{ nodes: NodeMetric[]; subA: string; subB: string }> = ({ nodes, subA, subB }) => {
  const { c, axis, layout } = useChartTheme();
  const summary = (who: Who) => {
    const sizes = new Map<number, number>();
    nodes.forEach((n) => sizes.set(val(n, 'component_id', who), (sizes.get(val(n, 'component_id', who)) ?? 0) + 1));
    const list = [...sizes.values()].sort((a, b) => b - a);
    return { largest: list[0] ?? 0, other: list.slice(1).filter((s) => s > 1).reduce((a, b) => a + b, 0), singletons: list.slice(1).filter((s) => s === 1).length, n: list.length };
  };
  const sA = summary('A');
  const sB = summary('B');
  const y = [`A (${subA}) · ${sA.n} components`, `B (${subB}) · ${sB.n} components`];
  const seg = (name: string, key: 'largest' | 'other' | 'singletons', color: string) => ({
    type: 'bar', orientation: 'h', name, y, x: [sA[key], sB[key]],
    marker: { color, line: { color: c.surface, width: 2 } },
    text: [sA[key], sB[key]].map((v) => (v > 0 ? String(v) : '')), textposition: 'inside', insidetextanchor: 'middle',
    textfont: { color: key === 'largest' ? c.surface : c.text },
    hovertemplate: `%{y}<br>${name}: %{x} nodes<extra></extra>`,
  });
  const showOther = sA.other + sB.other > 0;
  return (
    <>
      <Legend items={[
        { label: 'nodes in the largest component', color: c.text },
        ...(showOther ? [{ label: 'nodes in other components (2+ nodes)', color: c.muted }] : []),
        { label: 'isolated nodes (1-node components)', color: c.none },
      ]} />
      <Plot
        data={[seg('largest component', 'largest', c.text), ...(showOther ? [seg('other components', 'other', c.muted)] : []), seg('isolated', 'singletons', c.none)] as any}
        layout={layout({
          barmode: 'stack', height: 180, showlegend: false, margin: { t: 5, r: 15, b: 45, l: 10 },
          xaxis: axis('Number of nodes', { range: [0, nodes.length] }),
          yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)' }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

/** Bellman–Ford outcome per subject: undefined / unreachable / finite node counts. */
export const BellmanFordBars: React.FC<{ rows: ShortestPathSummary[]; names: Record<string, string> }> = ({ rows, names }) => {
  const { c, axis, layout } = useChartTheme();
  const y = rows.map((r) => names[String(r.subject)] ?? String(r.subject));
  const seg = (name: string, key: 'undefined' | 'unreachable' | 'finite', color: string, textColor: string) => ({
    type: 'bar', orientation: 'h', name, y, x: rows.map((r) => r[key]),
    marker: { color, line: { color: c.surface, width: 2 } },
    text: rows.map((r) => (r[key] > 0 ? String(r[key]) : '')), textposition: 'inside', insidetextanchor: 'middle', textfont: { color: textColor },
    hovertemplate: `%{y}<br>${name}: %{x} nodes<extra></extra>`,
  });
  return (
    <>
      <Legend items={[
        { label: 'undefined (reachable negative cycle)', color: c.partial },
        { label: 'unreachable (other component)', color: c.none },
        { label: 'finite distance', color: c.text },
      ]} />
      <Plot
        data={[seg('undefined', 'undefined', c.partial, '#111827'), seg('unreachable', 'unreachable', c.none, c.text), seg('finite', 'finite', c.text, c.surface)] as any}
        layout={layout({
          barmode: 'stack', height: 170, showlegend: false, margin: { t: 5, r: 15, b: 45, l: 10 },
          xaxis: axis('Number of nodes (from the source node)'),
          yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)' }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};
