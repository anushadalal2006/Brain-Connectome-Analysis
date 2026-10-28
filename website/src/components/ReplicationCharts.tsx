import React from 'react';
import Plot from './Plot';
import { useChartTheme, PLOT_CONFIG } from './chartTheme';
import { Legend } from './Legend';
import { metricName, labelCat, LabelCat, LABEL_TEXT, parseFrac } from '../metrics';
import { ReplicationLabelV2, ReplicationSummary, ReplicationTolerance, ReplicationStructure } from '../types';

export interface PairInfo { key: string; title: string }

const SHORT: Record<LabelCat, string> = { consistent: 'consistent', partial: 'partial', sensitive: 'sensitive', none: 'none' };

export const LabelLegend: React.FC = () => {
  const { c } = useChartTheme();
  const col: Record<LabelCat, string> = { consistent: c.consistent, partial: c.partial, sensitive: c.sensitive, none: c.none };
  return <Legend items={(['consistent', 'partial', 'sensitive', 'none'] as LabelCat[]).map((k) => ({ label: LABEL_TEXT[k], color: col[k] }))} />;
};

/** Metrics (rows) × pairs (columns), coloured by protocol v2 label, label text in each cell. */
export const LabelHeatmap: React.FC<{ labels: ReplicationLabelV2[]; metrics: string[]; pairs: PairInfo[] }> = ({ labels, metrics, pairs }) => {
  const { c, axis, layout } = useChartTheme();
  const code: Record<LabelCat, number> = { none: 0, partial: 1, sensitive: 2, consistent: 3 };
  const z: number[][] = [];
  const text: string[][] = [];
  const hover: string[][] = [];
  metrics.forEach((m) => {
    const rowZ: number[] = [];
    const rowT: string[] = [];
    const rowH: string[] = [];
    pairs.forEach((p) => {
      const r = labels.find((l) => l.metric === m && l.pair === p.key);
      const cat = r ? labelCat(r.label) : 'none';
      rowZ.push(code[cat]);
      rowT.push(r ? `${SHORT[cat]}<br>${r.direction}` : '');
      rowH.push(r ? `${r.label} (${r.direction})<br>densities A>B / A<B / negligible: ${r.n_pos} / ${r.n_neg} / ${r.n_small}` : '');
    });
    z.push(rowZ); text.push(rowT); hover.push(rowH);
  });
  return (
    <Plot
      data={[{
        type: 'heatmap', z, x: pairs.map((p) => p.title), y: metrics.map(metricName), text, texttemplate: '%{text}',
        textfont: { size: 10, color: '#ffffff' }, customdata: hover, hovertemplate: '%{y}<br>%{x}<br>%{customdata}<extra></extra>',
        colorscale: [[0, c.none], [0.25, c.none], [0.25, c.partial], [0.5, c.partial], [0.5, c.sensitive], [0.75, c.sensitive], [0.75, c.consistent], [1, c.consistent]],
        zmin: -0.5, zmax: 3.5, showscale: false, xgap: 3, ygap: 3,
      }] as any}
      layout={layout({
        height: 70 + metrics.length * 42, margin: { t: 10, r: 10, b: 60, l: 10 },
        xaxis: axis('', { side: 'bottom', type: 'category', gridcolor: 'rgba(0,0,0,0)', tickfont: { size: 10 } }),
        yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)', automargin: true }),
      }) as any}
      useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
    />
  );
};

/** Setting-consistent counts per metric: frozen v1 vs protocol v2. */
export const V1V2Bars: React.FC<{ summary: ReplicationSummary[] }> = ({ summary }) => {
  const { c, axis, layout } = useChartTheme();
  const rows = summary.map((r) => ({ name: metricName(r.metric), v1: parseFrac(r.v1_consistent), v2: parseFrac(r.v2_consistent) }));
  const total = rows[0]?.v2?.[1] ?? 0;
  const y = rows.map((r) => r.name);
  const tr = (name: string, key: 'v1' | 'v2', color: string, pattern?: string) => ({
    type: 'bar', orientation: 'h', name, y, x: rows.map((r) => r[key]?.[0] ?? 0),
    marker: { color, line: { color, width: 1.5 }, pattern: pattern ? { shape: pattern, fgcolor: c.surface, size: 6 } : undefined },
    text: rows.map((r) => `${r[key]?.[0] ?? 0}`), textposition: 'outside', cliponaxis: false, textfont: { size: 10, color: c.text },
    hovertemplate: `%{y}<br>${name}: %{x} of ${total} pairs<extra></extra>`,
  });
  return (
    <>
      <Legend items={[{ label: 'protocol v2 (primary)', color: c.consistent }, { label: 'frozen v1 (raw values, no gap)', color: c.muted }]} />
      <Plot
        data={[tr('protocol v2', 'v2', c.consistent), tr('frozen v1', 'v1', c.muted)] as any}
        layout={layout({
          barmode: 'group', bargap: 0.25, bargroupgap: 0.1, height: 80 + rows.length * 40, showlegend: false,
          margin: { t: 10, r: 30, b: 50, l: 10 },
          xaxis: axis(`Pairs labelled setting-consistent (of ${total})`, { dtick: 1, range: [0, total + 0.4] }),
          yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)', automargin: true }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

/** Consistent counts at the three tolerances, per metric. */
export const ToleranceBars: React.FC<{ rows: ReplicationTolerance[]; tolerances: number[] }> = ({ rows, tolerances }) => {
  const { c, axis, layout } = useChartTheme();
  const keyFor = (t: number) => `consistent_at_${+(t * 100).toFixed(1)}%` as keyof ReplicationTolerance;
  const shades = c.dark ? ['#065f46', '#10b981', '#6ee7b7'] : ['#a7f3d0', '#059669', '#064e3b'];
  const y = rows.map((r) => metricName(r.metric));
  const total = parseFrac(rows[0]?.[keyFor(tolerances[0])] as string)?.[1] ?? 0;
  const data = tolerances.map((t, i) => ({
    type: 'bar', orientation: 'h', name: `${t * 100}% gap`, y,
    x: rows.map((r) => parseFrac(r[keyFor(t)] as string)?.[0] ?? 0),
    marker: { color: shades[i % shades.length] },
    hovertemplate: `%{y}<br>${t * 100}% gap: %{x} of ${total} pairs consistent<extra></extra>`,
  }));
  return (
    <>
      <Legend items={tolerances.map((t, i) => ({ label: `${t * 100}% minimum gap${t === 0.01 ? ' (primary)' : ''}`, color: shades[i % shades.length] }))} />
      <Plot
        data={data as any}
        layout={layout({
          barmode: 'group', bargap: 0.25, bargroupgap: 0.05, height: 80 + rows.length * 44, showlegend: false,
          margin: { t: 10, r: 20, b: 50, l: 10 },
          xaxis: axis(`Pairs labelled setting-consistent (of ${total})`, { dtick: 1, range: [0, total] }),
          yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)', automargin: true }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

/** Isolated nodes per subject in each pair at the primary density. */
export const IsolatedPerPair: React.FC<{ rows: ReplicationStructure[]; pairs: PairInfo[] }> = ({ rows, pairs }) => {
  const { c, axis, layout } = useChartTheme();
  const x = pairs.map((p) => p.title);
  const get = (p: PairInfo) => rows.find((r) => r.pair === p.key);
  const tr = (name: string, key: 'n_isolated_A' | 'n_isolated_B', color: string) => ({
    type: 'bar', name, x, y: pairs.map((p) => get(p)?.[key] ?? 0), marker: { color },
    text: pairs.map((p) => String(get(p)?.[key] ?? '')), textposition: 'outside', cliponaxis: false, textfont: { size: 10, color: c.text },
    customdata: pairs.map((p) => (key === 'n_isolated_A' ? get(p)?.A : get(p)?.B)),
    hovertemplate: `%{x}<br>${name} (%{customdata}): %{y} isolated nodes<extra></extra>`,
  });
  return (
    <>
      <Legend items={[{ label: 'subject A of the pair', color: c.A }, { label: 'subject B of the pair', color: c.B }]} />
      <Plot
        data={[tr('A', 'n_isolated_A', c.A), tr('B', 'n_isolated_B', c.B)] as any}
        layout={layout({
          barmode: 'group', height: 320, showlegend: false, margin: { t: 20, r: 10, b: 70, l: 50 },
          xaxis: axis('', { gridcolor: 'rgba(0,0,0,0)', tickfont: { size: 10 } }),
          yaxis: axis('Isolated nodes'),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};

/** Whole-matrix mean |w| of each of the 10 subjects (per-subject scale). */
export const ScalePerSubject: React.FC<{ rows: ReplicationStructure[]; pairs: PairInfo[] }> = ({ rows, pairs }) => {
  const { c, axis, layout } = useChartTheme();
  const items = pairs.flatMap((p) => {
    const r = rows.find((x) => x.pair === p.key);
    return r ? [
      { pair: p.title, role: 'A', id: r.A, v: r.mean_abs_w_all_A },
      { pair: p.title, role: 'B', id: r.B, v: r.mean_abs_w_all_B },
    ] : [];
  });
  const tr = (role: string, color: string, symbol: string) => {
    const sub = items.filter((d) => d.role === role);
    return {
      type: 'scatter', mode: 'markers', name: role, x: sub.map((d) => d.pair), y: sub.map((d) => d.v),
      customdata: sub.map((d) => d.id), marker: { color, size: 13, symbol, line: { color: c.surface, width: 1.5 } },
      hovertemplate: `%{x}<br>subject %{customdata} (${role})<br>mean |w| = %{y:.3f}<extra></extra>`,
    };
  };
  return (
    <>
      <Legend items={[{ label: 'subject A of the pair', color: c.A }, { label: 'subject B of the pair', color: c.B }]} />
      <Plot
        data={[tr('A', c.A, 'circle'), tr('B', c.B, 'square')] as any}
        layout={layout({
          height: 320, showlegend: false, margin: { t: 20, r: 10, b: 70, l: 55 },
          xaxis: axis('', { type: 'category', tickfont: { size: 10 } }),
          yaxis: axis('Whole-matrix mean |w| (r-to-Z units)', { rangemode: 'tozero' }),
        }) as any}
        useResizeHandler style={{ width: '100%' }} config={PLOT_CONFIG}
      />
    </>
  );
};
