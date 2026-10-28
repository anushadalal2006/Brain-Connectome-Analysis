export interface ConfigData {
  config: {
    density: number;
    rank_rule: string;
    tie_rule: string;
    rounding: string;
    diagonal_policy: string;
    missing_policy: string;
    asym_policy: string;
    symmetry_tol: number;
    signed: boolean;
    directed: boolean;
    path_rule: string;
    hash: string;
  };
  density_settings: number[];
  eps: number;
  compare_metrics: string[];
  consistency_rule: string;
  g2l_map: Record<string, string>;
  subjects: {
    A: string;
    B: string;
  };
}

export interface EnvironmentData {
  environment: {
    python: string;
    platform: string;
    numpy: string;
    pandas: string;
    networkx: string;
    matplotlib: string;
    seed: number;
    colab: boolean;
  };
  project: {
    dataset: string;
    package: string;
    parcellation: string;
    representation: string;
    n_nodes: number;
    graph: string;
    shortest_path: string;
    reciprocal_weights: boolean;
    uses_ml: boolean;
  };
  created_at: string;
}

export interface ProvenanceData {
  source_files: {
    A: string;
    B: string;
  };
  download_record: Array<{
    file: string;
    s3_uri: string;
    bytes: number;
    etag: string;
    last_modified_on_s3: string;
    downloaded_at: string;
  }>;
  all_subject_check: {
    subjects: number;
    valid: number;
    total_nan: number;
    max_asymmetry: number;
    diagonal_values: number[];
  };
}

export interface GlobalStatistic {
  statistic: string;
  A: number;
  B: number;
}

export interface NodeStatistic {
  node: number;
  label: string;
  mean_w_A: number;
  mean_abs_w_A: number;
  n_pos_A: number;
  n_neg_A: number;
  mean_w_B: number;
  mean_abs_w_B: number;
  n_pos_B: number;
  n_neg_B: number;
}

export interface GlobalMetric {
  metric: string;
  A: number;
  B: number;
}

export interface NodeMetric {
  node: number;
  label: string;
  degree_A: number;
  degree_B: number;
  strength_A: number;
  strength_B: number;
  strength_pos_A: number;
  strength_pos_B: number;
  strength_neg_A: number;
  strength_neg_B: number;
  n_pos_edges_A: number;
  n_pos_edges_B: number;
  n_neg_edges_A: number;
  n_neg_edges_B: number;
  clustering_A: number;
  clustering_B: number;
  isolated_A: boolean;
  isolated_B: boolean;
  in_largest_A: boolean;
  in_largest_B: boolean;
  component_id_A: number;
  component_id_B: number;
}

export interface TraversalSummary {
  subject: number;
  algorithm: string;
  source: number;
  source_label: string;
  reachable: number;
  unreachable: number;
  bfs_levels: number;
}

export interface ShortestPathSummary {
  subject: number;
  source: number;
  status: string;
  undefined: number;
  unreachable: number;
  finite: number;
}

export interface ComparisonGlobal {
  metric: string;
  A: number;
  B: number;
  A_minus_B: number;
  scale_dependent: boolean;
}

export interface ComparisonNode {
  node: number;
  label: string;
  degree_A: number;
  degree_B: number;
  d_degree: number;
  strength_A: number;
  strength_B: number;
  d_strength: number;
  strength_norm_A: number;
  strength_norm_B: number;
  d_strength_norm: number;
  clustering_A: number;
  clustering_B: number;
  d_clustering: number;
  isolated_A: boolean;
  isolated_B: boolean;
  isolation_change: string;
}

export interface ComparisonEdge {
  i: number;
  j: number;
  label_i: string;
  label_j: string;
  in_A: boolean;
  in_B: boolean;
  status: 'both' | 'A_only' | 'B_only';
  sign_A: number;
  sign_B: number;
  sign_flip: boolean;
}

export interface ConsistencyRecord {
  metric: string;
  n_pos: number;
  n_neg: number;
  n_zero: number;
  S_M: number;
  label: string;
  direction: string;
  scale_dependent: boolean;
}

export interface ProtocolV2Consistency {
  metric: string;
  v1_label: string;
  v1_direction: string;
  label: string;
  direction: string;
  n_pos: number;
  n_neg: number;
  n_small: number;
}

export interface MultiSettingValues {
  density: number;
  config_hash: string;
  [key: string]: number | string;
}

export interface ProtocolV2Values {
  density: number;
  [key: string]: number;
}

export interface PosthocScaleCheck {
  density: number;
  mean_strength_norm_A: number;
  mean_strength_norm_B: number;
  mean_strength_norm_delta: number;
  mean_strength_lcc_norm_A: number;
  mean_strength_lcc_norm_B: number;
  mean_strength_lcc_norm_delta: number;
  mean_abs_weight_norm_A: number;
  mean_abs_weight_norm_B: number;
  mean_abs_weight_norm_delta: number;
}

export interface PosthocScaleCheckLabels {
  metric: string;
  raw_label: string;
  raw_direction: string;
  normalised_label: string;
  normalised_direction: string;
  n_pos: number;
  n_neg: number;
}

export interface G2LRecord {
  metric: string;
  label: string;
  level: string;
  local_measure: string;
  rank: number;
  node: number;
  node_label: string;
  i: number;
  j: number;
  edge_labels: string;
  mean_abs_delta: number;
  mean_delta: number;
  sign_agreement: number;
  dP: number;
}

export interface RetentionEdge {
  i: number;
  j: number;
  label_i: string;
  label_j: string;
  count_A: number;
  count_B: number;
  P_A: number;
  P_B: number;
  dP: number;
  sign_A: number;
  sign_B: number;
}

export interface ReplicationSummary {
  metric: string;
  main: string;
  pair1: string;
  pair2: string;
  pair3: string;
  pair4: string;
  v2_consistent: string;
  v2_partial: string;
  v1_consistent: string;
}

export interface ReplicationLabelV2 {
  pair: string;
  A: number;
  B: number;
  metric: string;
  label: string;
  direction: string;
  n_pos: number;
  n_neg: number;
  n_small: number;
}

export interface ReplicationTolerance {
  metric: string;
  'consistent_at_0.5%': string;
  'sensitive_at_0.5%': string;
  'consistent_at_1%': string;
  'sensitive_at_1%': string;
  'consistent_at_2%': string;
  'sensitive_at_2%': string;
}

export interface ReplicationStructure {
  pair: string;
  A: number;
  B: number;
  n_isolated_A: number;
  n_isolated_B: number;
  largest_A: number;
  largest_B: number;
  share_neg_A: number;
  share_neg_B: number;
  mean_abs_w_all_A: number;
  mean_abs_w_all_B: number;
}

export interface VerificationTest {
  id: string;
  module: string;
  title: string;
  passed: number;
  total: number;
  status: string;
  description: string;
}

export interface ReplicationLabelV1 {
  pair: string;
  A: number;
  B: number;
  metric: string;
  label: string;
  direction: string;
}

export interface ReplicationMeta {
  pairs: string[][];
  pair_rule: string;
  config_hash: string;
  density_settings: number[];
  eps: number;
  rule_v2: string;
  rel_tol: number;
  tolerance_check: number[];
  metrics_v2: string[];
  rule_v1: string;
  created_at: string;
  note: string;
}
