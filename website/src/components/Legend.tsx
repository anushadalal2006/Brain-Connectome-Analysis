import React from 'react';

export interface LegendItem {
  label: string;
  color: string;
  /** 'box' (default), 'line', 'dash' or 'band' */
  shape?: 'box' | 'line' | 'dash' | 'band';
}

/** HTML legend that wraps on narrow screens (Plotly legends do not). */
export const Legend: React.FC<{ items: LegendItem[] }> = ({ items }) => (
  <ul className="chart-legend">
    {items.map((it) => (
      <li key={it.label}>
        <span
          className={`chart-legend-key chart-legend-${it.shape ?? 'box'}`}
          style={it.shape === 'line' || it.shape === 'dash' ? { borderColor: it.color } : { background: it.color }}
          aria-hidden="true"
        />
        {it.label}
      </li>
    ))}
  </ul>
);
