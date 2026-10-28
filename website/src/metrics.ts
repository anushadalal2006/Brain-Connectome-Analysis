// Readable names for metric keys used in the JSON files.
export const METRIC_NAMES: Record<string, string> = {
  avg_clustering_all: 'Avg clustering (all nodes)',
  avg_clustering_lcc: 'Avg clustering (largest comp.)',
  transitivity_all: 'Transitivity (all)',
  transitivity_lcc: 'Transitivity (largest comp.)',
  n_components: 'Number of components',
  largest_component_size: 'Largest component size',
  n_isolated: 'Isolated nodes',
  mean_strength: 'Mean strength (raw)',
  mean_strength_lcc: 'Mean strength, largest comp. (raw)',
  mean_strength_norm: 'Mean strength (normalised)',
  mean_strength_lcc_norm: 'Mean strength, largest comp. (norm.)',
  share_negative_edges: 'Share of negative edges',
  mean_abs_weight: 'Mean |w| of kept edges (raw)',
  mean_abs_weight_norm: 'Mean |w| of kept edges (norm.)',
};

export const metricName = (m: string) => METRIC_NAMES[m] ?? m;

/** Parse "4/5" into [4, 5]. */
export const parseFrac = (s: string | undefined): [number, number] | null => {
  if (!s) return null;
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
};

/** Normalise a label string from any JSON file to one of four categories. */
export type LabelCat = 'consistent' | 'partial' | 'sensitive' | 'none';
export const labelCat = (label: string): LabelCat => {
  const l = label.toLowerCase();
  if (l.startsWith('setting-consistent') || l.startsWith('consistent')) return 'consistent';
  if (l.startsWith('partial')) return 'partial';
  if (l.startsWith('construction-sensitive') || l.startsWith('sensitive')) return 'sensitive';
  return 'none';
};

export const LABEL_TEXT: Record<LabelCat, string> = {
  consistent: 'setting-consistent',
  partial: 'partially consistent',
  sensitive: 'construction-sensitive',
  none: 'no difference',
};
