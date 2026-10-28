import React from 'react';

type Outcome = 'consistent' | 'partial' | 'sensitive' | 'none';
const OUTCOME_TEXT: Record<Outcome, string> = {
  consistent: 'setting-consistent',
  partial: 'partially consistent',
  sensitive: 'construction-sensitive',
  none: 'no difference',
};

interface Step { q: string[]; yes: Outcome }
interface Props {
  id: string;
  title: string;
  intro: string[];
  steps: Step[];
  /** Outcome when every question is answered "no". */
  last: Outcome;
}

const QW = 300, QH = 62, OW = 200, OH = 40, GAP = 34, X0 = 6, OX = 380;

const OutcomeBox: React.FC<{ x: number; y: number; o: Outcome }> = ({ x, y, o }) => (
  <g>
    <rect x={x} y={y} width={OW} height={OH} rx={20} fill={`var(--lab-${o})`} fillOpacity={0.16} stroke={`var(--lab-${o})`} strokeWidth={2} />
    <text x={x + OW / 2} y={y + OH / 2 + 5} textAnchor="middle" className="dg-label-strong">{OUTCOME_TEXT[o]}</text>
  </g>
);

export const DecisionDiagram: React.FC<Props> = ({ id, title, intro, steps, last }) => {
  const introH = intro.length * 17 + 14;
  const height = introH + steps.length * (QH + GAP) + OH + 10;
  return (
    <svg viewBox={`0 0 ${OX + OW + 6} ${height}`} width="100%" role="img" aria-labelledby={`${id}-title`} className="diagram">
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <marker id={`${id}-arr`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
        </marker>
      </defs>
      {intro.map((line, i) => (
        <text key={i} x={X0} y={16 + i * 17} className="dg-muted">{line}</text>
      ))}
      {steps.map((st, i) => {
        const y = introH + i * (QH + GAP);
        return (
          <g key={i}>
            <rect x={X0} y={y} width={QW} height={QH} rx={8} fill="var(--bg-secondary)" stroke="var(--border-strong)" />
            {st.q.map((line, li) => (
              <text key={li} x={X0 + 14} y={y + QH / 2 + 5 + (li - (st.q.length - 1) / 2) * 17} className="dg-label">{line}</text>
            ))}
            <line x1={X0 + QW} y1={y + QH / 2} x2={OX - 4} y2={y + QH / 2} stroke="var(--text-muted)" strokeWidth={1.5} markerEnd={`url(#${id}-arr)`} />
            <text x={(X0 + QW + OX) / 2} y={y + QH / 2 - 7} textAnchor="middle" className="dg-muted">yes</text>
            <OutcomeBox x={OX} y={y + QH / 2 - OH / 2} o={st.yes} />
            <line x1={X0 + QW / 2} y1={y + QH} x2={X0 + QW / 2} y2={y + QH + GAP - 4} stroke="var(--text-muted)" strokeWidth={1.5} markerEnd={`url(#${id}-arr)`} />
            <text x={X0 + QW / 2 + 8} y={y + QH + GAP / 2 + 4} className="dg-muted">no</text>
          </g>
        );
      })}
      <OutcomeBox x={X0 + QW / 2 - OW / 2} y={introH + steps.length * (QH + GAP)} o={last} />
    </svg>
  );
};

export const V1Decision: React.FC = () => (
  <DecisionDiagram
    id="v1dec"
    title="Frozen v1 rule as a decision diagram"
    intro={['Input: ΔM(d) = A − B at each of the K densities.', 'A delta counts as zero if |ΔM| ≤ ε = 1e-9.']}
    steps={[
      { q: ['All K deltas zero (|ΔM| ≤ ε)?'], yes: 'none' },
      { q: ['All K deltas non-zero', 'and all the same sign?'], yes: 'consistent' },
    ]}
    last="sensitive"
  />
);

export const V2Decision: React.FC = () => (
  <DecisionDiagram
    id="v2dec"
    title="Protocol v2 rule as a decision diagram"
    intro={['Input: ΔM(d) at each density; strength and |w| divided by', "each subject's mean |w|. A density is negligible if", '|ΔM| ≤ max(ε, 1% × mean(|A|, |B|)).']}
    steps={[
      { q: ['Negligible at all densities?'], yes: 'none' },
      { q: ['Both signs among the', 'non-negligible densities?'], yes: 'sensitive' },
      { q: ['One sign, but negligible', 'at some densities?'], yes: 'partial' },
    ]}
    last="consistent"
  />
);
