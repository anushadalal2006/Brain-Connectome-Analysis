import { useTheme } from '../context/ThemeContext';

// Colour meanings are fixed site-wide (brief rule 6):
//   red = positive edge/weight, blue = negative edge/weight (nothing else);
//   overlap: grey both, orange only A, purple only B, gold sign flip;
//   labels: green setting-consistent, amber partial, pink/purple construction-sensitive, grey none.
export function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const c = {
    dark,
    text: dark ? '#f9fafb' : '#0f172a',
    muted: dark ? '#94a3b8' : '#64748b',
    grid: dark ? '#1f2937' : '#e2e8f0',
    zero: dark ? '#64748b' : '#94a3b8',
    surface: dark ? '#111827' : '#ffffff',
    pos: dark ? '#f87171' : '#dc2626',
    neg: dark ? '#60a5fa' : '#2563eb',
    A: dark ? '#fb923c' : '#ea580c',
    B: dark ? '#a78bfa' : '#7c3aed',
    both: dark ? '#94a3b8' : '#64748b',
    flip: dark ? '#facc15' : '#ca8a04',
    consistent: dark ? '#10b981' : '#059669',
    partial: dark ? '#f59e0b' : '#d97706',
    sensitive: dark ? '#d946ef' : '#c026d3',
    none: dark ? '#64748b' : '#94a3b8',
    band: dark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.15)',
  };

  const axis = (title: string, extra: Record<string, unknown> = {}) => ({
    title: { text: title, font: { size: 12 } },
    gridcolor: c.grid,
    zerolinecolor: c.zero,
    linecolor: c.grid,
    tickfont: { size: 11 },
    automargin: true,
    ...extra,
  });

  const layout = (extra: Record<string, unknown> = {}) => ({
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif', color: c.text, size: 12 },
    margin: { t: 20, r: 20, b: 50, l: 60 },
    hoverlabel: { bgcolor: c.surface, bordercolor: c.grid, font: { color: c.text, family: 'Inter, sans-serif' } },
    legend: { orientation: 'h', x: 0, y: 1.12, font: { size: 11 } },
    bargap: 0.25,
    ...extra,
  });

  /** Colour for a consistency label string from the JSON (v1, v2 or replication summary). */
  const labelColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.startsWith('setting-consistent') || l.startsWith('consistent')) return c.consistent;
    if (l.startsWith('partial')) return c.partial;
    if (l.startsWith('construction-sensitive') || l.startsWith('sensitive')) return c.sensitive;
    return c.none;
  };

  return { c, axis, layout, labelColor };
}

export const PLOT_CONFIG = { responsive: true, displayModeBar: false } as const;
