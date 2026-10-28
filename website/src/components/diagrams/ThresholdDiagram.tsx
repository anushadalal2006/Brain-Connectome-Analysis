import React from 'react';

// Illustration only: bar lengths are made up to show the rule, not data.
const BARS = [
  { len: 0.95, pos: true }, { len: 0.88, pos: false }, { len: 0.8, pos: true },
  { len: 0.71, pos: false }, { len: 0.6, pos: true }, { len: 0.52, pos: true },
  { len: 0.41, pos: false }, { len: 0.3, pos: true }, { len: 0.18, pos: false },
];
const UNSORTED = [4, 0, 7, 2, 8, 1, 5, 3, 6];
const KEEP = 4;

export const ThresholdDiagram: React.FC<{ nPairs: number | string }> = ({ nPairs }) => {
  const barH = 14, gap = 7, top = 70, maxW = 150;
  const panel = (x: number, title: string, sub: string, order: number[], kept: boolean, signed: boolean) => (
    <g>
      <text x={x} y={24} className="dg-label-strong">{title}</text>
      <text x={x} y={44} className="dg-muted">{sub}</text>
      {order.map((bi, row) => {
        const b = BARS[bi];
        const y = top + row * (barH + gap);
        const isKept = kept ? row < KEEP : true;
        const fill = signed ? (b.pos ? 'var(--sign-pos)' : 'var(--sign-neg)') : 'var(--text-muted)';
        return (
          <g key={row} opacity={isKept ? 1 : 0.22}>
            <rect x={x} y={y} width={b.len * maxW} height={barH} rx={3} fill={fill} />
            {signed && isKept && (
              <text x={x + b.len * maxW + 6} y={y + 11} className="dg-muted">{b.pos ? '+' : '−'}</text>
            )}
          </g>
        );
      })}
      {kept && (
        <line x1={x - 6} x2={x + maxW + 22} y1={top + KEEP * (barH + gap) - gap / 2} y2={top + KEEP * (barH + gap) - gap / 2}
          stroke="var(--text-primary)" strokeDasharray="4 3" strokeWidth={1.3} />
      )}
    </g>
  );
  const arrow = (x: number) => (
    <line x1={x} x2={x + 34} y1={140} y2={140} stroke="var(--text-muted)" strokeWidth={1.6} markerEnd="url(#thr-arrow)" />
  );
  return (
    <svg viewBox="0 0 760 290" width="100%" role="img" aria-labelledby="thr-title" className="diagram">
      <title id="thr-title">Proportional thresholding: rank all node pairs by absolute weight, keep the top m, and keep each kept edge's sign</title>
      <defs>
        <marker id="thr-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
        </marker>
      </defs>
      {panel(10, `1. All ${nPairs} pairs`, 'magnitude |w|, unordered', UNSORTED, false, false)}
      {arrow(200)}
      {panel(258, '2. Rank by |w|', 'descending; ties by (i, j)', BARS.map((_, i) => i), false, false)}
      {arrow(448)}
      {panel(506, '3. Keep top m, keep sign', 'm = floor(d × pairs + 0.5)', BARS.map((_, i) => i), true, true)}
      <text x={506 + 150 + 30} y={top + KEEP * (barH + gap) - 8} className="dg-muted" textAnchor="end">top m</text>
      <text x={10} y={282} className="dg-muted">Illustration with 9 made-up bars (not data). Red = positive weight, blue = negative weight; faded bars are dropped.</text>
    </svg>
  );
};
