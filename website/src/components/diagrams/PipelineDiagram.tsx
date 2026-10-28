import React from 'react';

// Notebook cells, grouped as in the brief (section 8, Methods). Text only:
// no results appear in this diagram.
interface Cell { id: string; text: string }
interface Group { title: string; range: string; cells: Cell[] }

const GROUPS: Group[] = [
  {
    title: 'Foundation', range: 'C01–C11',
    cells: [
      { id: 'C01', text: 'Setup, imports, seed' },
      { id: 'C02', text: 'Configuration' },
      { id: 'C03', text: 'Shared data contracts' },
      { id: 'C04', text: 'Data import (netmats1)' },
      { id: 'C05 + C05T', text: 'Validation + tests' },
      { id: 'C06', text: 'Validate real HCP data' },
      { id: 'C07 + C07T', text: 'Preprocessing + tests' },
      { id: 'C08 + C08T', text: 'Signed graph build + tests' },
      { id: 'C09', text: 'Build graphs A and B' },
      { id: 'C10', text: 'Checks on real graphs' },
      { id: 'C11', text: 'Foundation integration' },
    ],
  },
  {
    title: 'Analysis', range: 'C12–C19',
    cells: [
      { id: 'C12', text: 'Descriptive statistics' },
      { id: 'C13', text: 'Graph metrics' },
      { id: 'C14', text: 'Metrics on A and B' },
      { id: 'C15', text: 'BFS queue / DFS stack' },
      { id: 'C16', text: 'Bellman–Ford' },
      { id: 'C17', text: 'Shortest paths, A and B' },
      { id: 'C18', text: 'Tests for D–G' },
      { id: 'C19', text: 'Single-network figures' },
    ],
  },
  {
    title: 'Research', range: 'C20–C28',
    cells: [
      { id: 'C20', text: 'Pairwise comparison' },
      { id: 'C21', text: 'Global-to-local analysis' },
      { id: 'C22', text: 'Run at 6 densities (v1)' },
      { id: 'C22S', text: 'Post-hoc scale check' },
      { id: 'C22R', text: 'Protocol v2 (1% gap)' },
      { id: 'C23', text: 'Comparison figures' },
      { id: 'C24', text: 'Tests for H–I' },
      { id: 'C25', text: 'Report and export' },
      { id: 'C26', text: 'Integration tests' },
      { id: 'C27', text: 'run_pipeline() one call' },
      { id: 'C28', text: 'Replication, 4 more pairs' },
    ],
  },
  {
    title: 'Website', range: 'this site',
    cells: [
      { id: 'site_data/', text: 'Notebook exports (local)' },
      { id: 'build_data.py', text: 'No raw weights → JSON' },
      { id: 'check_data.py', text: 'Verifies key numbers' },
      { id: 'React site', text: 'Reads public/data only' },
    ],
  },
];

const PER_LINE = 6;
const BOX_W = 158;
const BOX_H = 52;
const GAP_X = 10;
const GAP_Y = 10;
const LABEL_W = 108;
const GROUP_GAP = 30;
const PAD = 8;
const WIDTH = PAD * 2 + LABEL_W + PER_LINE * BOX_W + (PER_LINE - 1) * GAP_X;

export const PipelineDiagram: React.FC = () => {
  let y = PAD;
  const groups = GROUPS.map((g) => {
    const lines = Math.ceil(g.cells.length / PER_LINE);
    const h = lines * BOX_H + (lines - 1) * GAP_Y;
    const top = y;
    y += h + GROUP_GAP;
    return { ...g, top, h };
  });
  const height = y - GROUP_GAP + PAD;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" role="img" aria-labelledby="pipeline-title" className="diagram">
      <title id="pipeline-title">Notebook pipeline: Foundation C01–C11, Analysis C12–C19, Research C20–C28, then the website</title>
      <defs>
        <marker id="pipe-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
        </marker>
      </defs>
      {groups.map((g, gi) => (
        <g key={g.title}>
          <rect x={PAD} y={g.top} width={LABEL_W - 12} height={g.h} rx={8} fill="var(--bg-tertiary)" stroke="var(--border-strong)" />
          <text x={PAD + (LABEL_W - 12) / 2} y={g.top + g.h / 2 - 4} textAnchor="middle" className="dg-group">{g.title}</text>
          <text x={PAD + (LABEL_W - 12) / 2} y={g.top + g.h / 2 + 13} textAnchor="middle" className="dg-small">{g.range}</text>
          {g.cells.map((cell, i) => {
            const col = i % PER_LINE;
            const line = Math.floor(i / PER_LINE);
            const x = PAD + LABEL_W + col * (BOX_W + GAP_X);
            const by = g.top + line * (BOX_H + GAP_Y);
            return (
              <g key={cell.id}>
                <rect x={x} y={by} width={BOX_W} height={BOX_H} rx={6} fill="var(--bg-secondary)" stroke="var(--border-strong)" />
                <text x={x + 10} y={by + 21} className="dg-id">{cell.id}</text>
                <text x={x + 10} y={by + 39} className="dg-text">{cell.text}</text>
              </g>
            );
          })}
          {gi < groups.length - 1 && (
            <line
              x1={PAD + (LABEL_W - 12) / 2} y1={g.top + g.h + 3}
              x2={PAD + (LABEL_W - 12) / 2} y2={g.top + g.h + GROUP_GAP - 4}
              stroke="var(--text-muted)" strokeWidth={1.5} markerEnd="url(#pipe-arrow)"
            />
          )}
        </g>
      ))}
    </svg>
  );
};
