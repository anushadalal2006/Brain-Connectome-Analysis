import React from 'react';

interface ChartCardProps {
  title: string;
  caption: React.ReactNode;
  sources?: string[];
  /** Minimum drawing width; narrower screens scroll inside the card. */
  minWidth?: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Rendered above the chart, outside the horizontal scroll area. */
  legend?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, caption, sources, minWidth = 0, children, actions, legend }) => (
  <figure className="card chart-card">
    <div className="chart-card-head">
      <h3 className="chart-card-title">{title}</h3>
      {actions}
    </div>
    {legend}
    <div className="chart-scroll">
      <div style={{ minWidth }}>{children}</div>
    </div>
    <figcaption className="chart-caption">
      {caption}
      {sources && sources.length > 0 && (
        <span className="chart-source">
          {' '}Data source: {sources.map((s, i) => (
            <React.Fragment key={s}>{i > 0 && ', '}<code>{s}</code></React.Fragment>
          ))}
        </span>
      )}
    </figcaption>
  </figure>
);
