import React from 'react';
import Plot from './Plot';
import { useChartTheme, PLOT_CONFIG } from './chartTheme';
import { Legend } from './Legend';
import { metricName, labelCat } from '../metrics';
import { signed } from '../utils/format';
import { G2LRecord, RetentionEdge } from '../types';

type Row = { density: number; [key: string]: number | string };

/** ΔM(d) = A − B for one metric at each density row. */
export const deltas = (rows: Row[], metric: string) =>
  rows.map((r) => (r[`${metric}_A`] as number) - (r[`${metric}_B`] as number));

/** v2 negligible-gap threshold at each density: max(eps, relTol × mean(|A|, |B|)). */
export const tolerances = (rows: Row[], metric: string, eps: number, relTol: number) =>
  rows.map((r) => {
    const a = r[`${metric}_A`] as number;
    const b = r[`${metric}_B`] as number;
    return Math.max(eps, relTol * ((Math.abs(a) + Math.abs(b)) / 2));
  });

const sig = (v: number) => (Math.abs(v) >= 1000 || Math.abs(v) < 0.001 && v !== 0 ? v.toExponential(2) : Number(v.toPrecision(3)).toString());

export interface PanelInfo {
  metric: string;
  label: string;
  direction: string;
}

// ---------------------------------------------------------------------------
// 1. Small multiples: one mini ΔM(d) chart per metric
// ---------------------------------------------------------------------------
interface SmallMultiplesProps {
  rows: Row[];
  panels: PanelInfo[];
  mode: 'v1' | 'v2';
  eps: number;
  relTol: number;
}

const MiniPanel: React.FC<{ rows: Row[]; panel: PanelInfo; mode: 'v1' | 'v2'; eps: number; relTol: number }> = ({ rows, panel, mode, eps, relTol }) => {
  const { c, axis, layout, labelColor } = useChartTheme();
  const x = rows.map((r) => r.density);
  const y = deltas(rows, panel.metric);
  const color = labelColor(panel.label);
  const data: any[] = [];
  if (mode === 'v2') {
    const tol = tolerances(rows, panel.metric, eps, relTol);
    data.push({ x, y: tol, type: 'scatter', mode: 'lines', line: { width: 0, color: c.band }, hoverinfo: 'skip', showlegend: false });
    data.push({
      x, y: tol.map((t) => -t), type: 'scatter', mode: 'lines', fill: 'tonexty', fillcolor: c.band,
      line: { width: 0, color: c.band }, showlegend: false,
      customdata: tol, hovertemplate: 'd = %{x:.2f}<br>1% band: ±%{customdata:.3g}<extra></extra>',
    });
  }
  data.push({
    x, y, type: 'scatter', mode: 'lines+markers', showlegend: false,
    line: { color, width: 2 }, marker: { color, size: 8, line: { color: c.surface, width: 1.5 } },
    hovertemplate: 'd = %{x:.2f}<br>ΔM = %{y:.4g}<extra></extra>',
  });
  return (
    <div className="mini-panel">
      <div className="mini-panel-head">
        <span className="mini-panel-title">{metricName(panel.metric)}</span>
        <span className={`badge badge-${labelCat(panel.label) === 'consistent' ? 'consistent' : labelCat(panel.label) === 'partial' ? 'partial' : labelCat(panel.label) === 'sensitive' ? 'sensitive' : 'neutral'}`} style={{ textTransform: 'none', letterSpacing: 0 }}>
          {panel.label} ({panel.direction})
        </span>
      </div>
      <Plot
        data={data}
        layout={layout({
          height: 190,
          margin: { t: 6, r: 10, b: 34, l: 52 },
          showlegend: false,
          xaxis: axis('', { tickvals: x, tickformat: '.2f', tickfont: { size: 10 } }),
          yaxis: axis('ΔM (A − B)', { zeroline: true, zerolinecolor: c.text, zerolinewidth: 1.2, tickfont: { size: 10 }, title: { text: 'ΔM (A − B)', font: { size: 10 } } }),
        }) as any}
        useResizeHandler
        style={{ width: '100%' }}
        config={PLOT_CONFIG}
      />
    </div>
  );
};

export const SmallMultiples: React.FC<SmallMultiplesProps> = ({ rows, panels, mode, eps, relTol }) => (
  <div className="mini-grid">
    {panels.map((p) => (
      <MiniPanel key={`${mode}-${p.metric}`} rows={rows} panel={p} mode={mode} eps={eps} relTol={relTol} />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// 2. Consistency strip: metrics × densities, sign of ΔM under protocol v2
// ---------------------------------------------------------------------------
export const ConsistencyStrip: React.FC<{ rows: Row[]; panels: PanelInfo[]; eps: number; relTol: number }> = ({ rows, panels, eps, relTol }) => {
  const { c, axis, layout } = useChartTheme();
  const dens = rows.map((r) => (r.density as number).toFixed(2));
  const ylab = panels.map((p) => `${metricName(p.metric)}`);
  const z: number[][] = [];
  const text: string[][] = [];
  const hover: string[][] = [];
  panels.forEach((p) => {
    const d = deltas(rows, p.metric);
    const t = tolerances(rows, p.metric, eps, relTol);
    z.push(d.map((v, i) => (Math.abs(v) <= t[i] ? 0 : v > 0 ? 1 : -1)));
    text.push(d.map((v, i) => (Math.abs(v) <= t[i] ? '≈0' : v > 0 ? '+' : '−')));
    hover.push(d.map((v, i) => `ΔM = ${sig(v)}<br>1% gap = ${sig(t[i])}<br>${Math.abs(v) <= t[i] ? 'negligible' : v > 0 ? 'A > B' : 'A < B'}`));
  });
  return (
    <>
      <Legend items={[{ label: '+  A > B (A higher)', color: c.A }, { label: '−  A < B (B higher)', color: c.B }, { label: '≈0  negligible (under 1% gap)', color: c.none }]} />
      <Plot
        data={[{
          type: 'heatmap', z, x: dens, y: ylab, text, texttemplate: '%{text}', textfont: { size: 15, color: '#ffffff' },
          customdata: hover, hovertemplate: '%{y}<br>d = %{x}<br>%{customdata}<extra></extra>',
          colorscale: [[0, c.B], [0.333, c.B], [0.334, c.none], [0.666, c.none], [0.667, c.A], [1, c.A]],
          zmin: -1, zmax: 1, showscale: false, xgap: 3, ygap: 3,
        }] as any}
        layout={layout({
          height: 60 + panels.length * 34,
          margin: { t: 10, r: 10, b: 45, l: 10 },
          xaxis: axis('Proportional density d', { type: 'category', side: 'bottom', gridcolor: 'rgba(0,0,0,0)' }),
          yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)', automargin: true }),
        }) as any}
        useResizeHandler
        style={{ width: '100%' }}
        config={PLOT_CONFIG}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// 3. Post-hoc scale check: raw vs normalised ΔM across densities
// ---------------------------------------------------------------------------
export const ScaleCheckChart: React.FC<{ rawRows: Row[]; normRows: Row[]; metric: string }> = ({ rawRows, normRows, metric }) => {
  const { c, axis, layout } = useChartTheme();
  const x = rawRows.map((r) => r.density);
  const raw = deltas(rawRows, metric);
  const norm = normRows.map((r) => r[`${metric}_norm_delta`] as number);
  return (
    <>
      <Legend items={[{ label: 'Raw ΔM (frozen v1)', color: c.muted, shape: 'dash' }, { label: 'Normalised ΔM (÷ own mean |w|, protocol v2)', color: c.text, shape: 'line' }]} />
      <Plot
        data={[
          { x, y: raw, type: 'scatter', mode: 'lines+markers', name: 'Raw ΔM', line: { color: c.muted, width: 2, dash: 'dash' }, marker: { size: 8, color: c.muted, symbol: 'square' }, hovertemplate: 'd = %{x:.2f}<br>raw ΔM = %{y:.4g}<extra></extra>' },
          { x, y: norm, type: 'scatter', mode: 'lines+markers', name: 'Normalised ΔM', line: { color: c.text, width: 2.5 }, marker: { size: 8, color: c.text }, hovertemplate: 'd = %{x:.2f}<br>normalised ΔM = %{y:.4g}<extra></extra>' },
        ] as any}
        layout={layout({
          height: 330,
          showlegend: false,
          margin: { t: 10, r: 20, b: 50, l: 60 },
          xaxis: axis('Proportional density d', { tickvals: x, tickformat: '.2f' }),
          yaxis: axis('ΔM = A − B', { zeroline: true, zerolinecolor: c.text, zerolinewidth: 1.5 }),
          annotations: [
            { xref: 'paper', yref: 'y', x: 1, y: 0, xanchor: 'right', yanchor: 'bottom', text: 'A > B above, A < B below', showarrow: false, font: { size: 10, color: c.muted } },
          ],
        }) as any}
        useResizeHandler
        style={{ width: '100%' }}
        config={PLOT_CONFIG}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// 4. Global-to-local: top 10 nodes for one metric
// ---------------------------------------------------------------------------
export const G2LBarChart: React.FC<{ records: G2LRecord[] }> = ({ records }) => {
  const { c, axis, layout } = useChartTheme();
  const rows = [...records].sort((a, b) => a.rank - b.rank);
  const y = rows.map((r) => `#${r.rank} ${r.node_label}`);
  return (
    <>
      <Legend items={[{ label: 'mean change A − B > 0 (A higher)', color: c.A }, { label: 'mean change A − B < 0 (B higher)', color: c.B }]} />
      <Plot
        data={[{
          type: 'bar', orientation: 'h', y, x: rows.map((r) => r.mean_delta),
          marker: { color: rows.map((r) => (r.mean_delta >= 0 ? c.A : c.B)) },
          text: rows.map((r) => signed(r.mean_delta, 3)), textposition: 'outside', cliponaxis: false,
          textfont: { color: c.text, size: 11 },
          customdata: rows.map((r) => [r.local_measure, r.sign_agreement.toFixed(2), r.mean_abs_delta.toPrecision(3)]),
          hovertemplate: '%{y}<br>mean %{customdata[0]} (A − B) = %{x:.4g}<br>mean |change| = %{customdata[2]}<br>sign agreement with global ΔM = %{customdata[1]}<extra></extra>',
        }] as any}
        layout={layout({
          height: 360,
          showlegend: false,
          margin: { t: 10, r: 60, b: 50, l: 10 },
          xaxis: axis(`Mean ${rows[0]?.local_measure ?? ''} across densities (A − B)`, { zeroline: true, zerolinecolor: c.text }),
          yaxis: axis('', { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)' }),
        }) as any}
        useResizeHandler
        style={{ width: '100%' }}
        config={PLOT_CONFIG}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// 5. Retention: histogram of ΔP and P_A vs P_B jittered scatter
// ---------------------------------------------------------------------------
export const RetentionHistogram: React.FC<{ edges: RetentionEdge[]; K: number }> = ({ edges, K }) => {
  const { c, axis, layout } = useChartTheme();
  const steps = Array.from({ length: 2 * K + 1 }, (_, i) => i - K); // dP × K
  const counts = steps.map((s) => edges.filter((e) => Math.round(e.dP * K) === s).length);
  const x = steps.map((s) => s / K);
  return (
    <>
      <Legend items={[{ label: 'ΔP > 0: kept more often in A', color: c.A }, { label: 'ΔP = 0: same in both', color: c.both }, { label: 'ΔP < 0: kept more often in B', color: c.B }]} />
      <Plot
        data={[{
          type: 'bar', x, y: counts,
          marker: { color: steps.map((s) => (s > 0 ? c.A : s < 0 ? c.B : c.both)) },
          customdata: steps.map((s) => `${s > 0 ? '+' : s < 0 ? '−' : ''}${Math.abs(s)}/${K}`),
          hovertemplate: 'ΔP = %{customdata} (%{x:.2f})<br>%{y} edges<extra></extra>',
        }] as any}
        layout={layout({
          height: 320,
          showlegend: false,
          bargap: 0.12,
          margin: { t: 10, r: 15, b: 50, l: 60 },
          xaxis: axis('ΔP(e) = P_A(e) − P_B(e)', { tickvals: x.filter((_, i) => i % 2 === 0), tickformat: '.2f' }),
          yaxis: axis('Number of edges'),
        }) as any}
        useResizeHandler
        style={{ width: '100%' }}
        config={PLOT_CONFIG}
      />
    </>
  );
};

// Deterministic jitter so the plot is identical on every load.
const jitter = (i: number, j: number, salt: number) => {
  const h = Math.sin(i * 12.9898 + j * 78.233 + salt * 37.719) * 43758.5453;
  return (h - Math.floor(h) - 0.5) * 0.11;
};

export const RetentionScatter: React.FC<{ edges: RetentionEdge[]; K: number }> = ({ edges, K }) => {
  const { c, axis, layout } = useChartTheme();
  const cells = new Map<string, number>();
  edges.forEach((e) => {
    const k = `${e.count_A},${e.count_B}`;
    cells.set(k, (cells.get(k) ?? 0) + 1);
  });
  const cellList = [...cells.entries()].map(([k, n]) => {
    const [a, b] = k.split(',').map(Number);
    return { a: a / K, b: b / K, n };
  });
  const ticks = Array.from({ length: K + 1 }, (_, i) => i / K);
  return (
    <Plot
      data={[
        {
          type: 'scatter', mode: 'markers', showlegend: false,
          x: edges.map((e) => e.P_A + jitter(e.i, e.j, 1)), y: edges.map((e) => e.P_B + jitter(e.i, e.j, 2)),
          marker: { size: 4, color: c.muted, opacity: 0.28 },
          hoverinfo: 'skip',
        },
        {
          type: 'scatter', mode: 'text', showlegend: false,
          x: cellList.map((d) => d.a), y: cellList.map((d) => d.b), text: cellList.map((d) => String(d.n)),
          textfont: { size: 12, color: c.text, family: 'Inter, sans-serif' },
          hovertemplate: 'P_A = %{x:.2f}, P_B = %{y:.2f}<br>%{text} edges<extra></extra>',
        },
        {
          type: 'scatter', mode: 'lines', showlegend: false, x: [0, 1], y: [0, 1],
          line: { color: c.zero, width: 1, dash: 'dot' }, hoverinfo: 'skip',
        },
      ] as any}
      layout={layout({
        height: 420,
        showlegend: false,
        margin: { t: 10, r: 15, b: 55, l: 60 },
        xaxis: axis('P_A(e): share of densities where A keeps the edge', { tickvals: ticks, tickformat: '.2f', range: [-0.1, 1.1] }),
        yaxis: axis('P_B(e)', { tickvals: ticks, tickformat: '.2f', range: [-0.1, 1.1], scaleanchor: 'x' }),
      }) as any}
      useResizeHandler
      style={{ width: '100%' }}
      config={PLOT_CONFIG}
    />
  );
};
