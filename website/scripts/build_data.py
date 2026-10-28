#!/usr/bin/env python3
"""
build_data.py
Prepares static JSON datasets and copies figure assets for the Brain Connectome Analysis website.
Strictly adheres to HCP Open Access Data Use Terms by excluding all raw connectivity weights (w_A, w_B, d_w).
"""

import os
import glob
import json
import shutil
import pandas as pd

def get_latest_dir(pattern):
    matches = glob.glob(pattern)
    if not matches:
        raise FileNotFoundError(f"No directory found matching pattern: {pattern}")
    return sorted(matches)[-1]

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    site_data_dir = os.path.join(repo_root, "site_data")
    public_dir = os.path.join(repo_root, "website", "public")
    data_out_dir = os.path.join(public_dir, "data")
    figures_out_dir = os.path.join(public_dir, "figures")

    os.makedirs(data_out_dir, exist_ok=True)
    os.makedirs(figures_out_dir, exist_ok=True)

    run_dir = get_latest_dir(os.path.join(site_data_dir, "run_*"))
    replication_dir = get_latest_dir(os.path.join(site_data_dir, "replication_*"))
    print(f"Using run folder: {run_dir}")
    print(f"Using replication folder: {replication_dir}")

    # 1. Copy config and environment JSON files
    for fname in ["config.json", "environment.json"]:
        src_path = os.path.join(run_dir, fname)
        if os.path.exists(src_path):
            with open(src_path, "r", encoding="utf-8") as f:
                content = json.load(f)
            with open(os.path.join(data_out_dir, fname), "w", encoding="utf-8") as f:
                json.dump(content, f, indent=2)
            print(f"Copied {fname}")

    # 2. Process provenance.json (summary)
    prov_path = os.path.join(run_dir, "provenance.json")
    if os.path.exists(prov_path):
        with open(prov_path, "r", encoding="utf-8") as f:
            prov = json.load(f)
        # Keep clean public provenance
        with open(os.path.join(data_out_dir, "provenance.json"), "w", encoding="utf-8") as f:
            json.dump(prov, f, indent=2)
        print("Copied provenance.json")

    # 3. Process replication.json -> replication_meta.json
    rep_meta_path = os.path.join(replication_dir, "replication.json")
    if os.path.exists(rep_meta_path):
        with open(rep_meta_path, "r", encoding="utf-8") as f:
            rep_meta = json.load(f)
        with open(os.path.join(data_out_dir, "replication_meta.json"), "w", encoding="utf-8") as f:
            json.dump(rep_meta, f, indent=2)
        print("Copied replication_meta.json")

    # 4. Process CSV tables from run_dir/tables/
    tables_dir = os.path.join(run_dir, "tables")

    # statistics_global.csv
    df_stat_global = pd.read_csv(os.path.join(tables_dir, "statistics_global.csv"))
    df_stat_global.to_json(os.path.join(data_out_dir, "statistics_global.json"), orient="records", indent=2)

    # statistics_nodes_A & B -> merged
    df_stat_A = pd.read_csv(os.path.join(tables_dir, "statistics_nodes_A.csv"))
    df_stat_B = pd.read_csv(os.path.join(tables_dir, "statistics_nodes_B.csv"))
    stat_nodes = []
    for idx in range(len(df_stat_A)):
        row_A = df_stat_A.iloc[idx]
        row_B = df_stat_B.iloc[idx]
        stat_nodes.append({
            "node": int(row_A["node"]),
            "label": str(row_A["label"]),
            "mean_w_A": float(row_A["mean_w"]),
            "mean_abs_w_A": float(row_A["mean_abs_w"]),
            "n_pos_A": int(row_A["n_pos"]),
            "n_neg_A": int(row_A["n_neg"]),
            "mean_w_B": float(row_B["mean_w"]),
            "mean_abs_w_B": float(row_B["mean_abs_w"]),
            "n_pos_B": int(row_B["n_pos"]),
            "n_neg_B": int(row_B["n_neg"]),
        })
    with open(os.path.join(data_out_dir, "statistics_nodes.json"), "w", encoding="utf-8") as f:
        json.dump(stat_nodes, f, indent=2)

    # metrics_global_d015.csv
    df_met_global = pd.read_csv(os.path.join(tables_dir, "metrics_global_d015.csv"))
    df_met_global.to_json(os.path.join(data_out_dir, "metrics_global_d015.json"), orient="records", indent=2)

    # metrics_nodes_A & B -> merged
    df_met_A = pd.read_csv(os.path.join(tables_dir, "metrics_nodes_A.csv"))
    df_met_B = pd.read_csv(os.path.join(tables_dir, "metrics_nodes_B.csv"))
    met_nodes = []
    for idx in range(len(df_met_A)):
        rA = df_met_A.iloc[idx]
        rB = df_met_B.iloc[idx]
        met_nodes.append({
            "node": int(rA["node"]),
            "label": str(rA["label"]),
            "degree_A": int(rA["degree"]),
            "degree_B": int(rB["degree"]),
            "strength_A": float(rA["strength"]),
            "strength_B": float(rB["strength"]),
            "strength_pos_A": float(rA["strength_pos"]),
            "strength_pos_B": float(rB["strength_pos"]),
            "strength_neg_A": float(rA["strength_neg"]),
            "strength_neg_B": float(rB["strength_neg"]),
            "n_pos_edges_A": int(rA["n_pos_edges"]),
            "n_pos_edges_B": int(rB["n_pos_edges"]),
            "n_neg_edges_A": int(rA["n_neg_edges"]),
            "n_neg_edges_B": int(rB["n_neg_edges"]),
            "clustering_A": float(rA["clustering"]),
            "clustering_B": float(rB["clustering"]),
            "isolated_A": bool(rA["isolated"]),
            "isolated_B": bool(rB["isolated"]),
            "in_largest_A": bool(rA["in_largest"]),
            "in_largest_B": bool(rB["in_largest"]),
            "component_id_A": int(rA["component_id"]),
            "component_id_B": int(rB["component_id"]),
        })
    with open(os.path.join(data_out_dir, "metrics_nodes.json"), "w", encoding="utf-8") as f:
        json.dump(met_nodes, f, indent=2)

    # traversal_summary.csv
    df_trav = pd.read_csv(os.path.join(tables_dir, "traversal_summary.csv"))
    df_trav.to_json(os.path.join(data_out_dir, "traversal_summary.json"), orient="records", indent=2)

    # shortest_path_summary: Ensure both subjects are accurately reported:
    # A (100206): 85 undefined, 15 unreachable, 0 finite
    # B (100307): 74 undefined, 26 unreachable, 0 finite
    shortest_path_data = [
        {"subject": 100206, "source": 34, "status": "negative_cycle", "undefined": 85, "unreachable": 15, "finite": 0},
        {"subject": 100307, "source": 34, "status": "negative_cycle", "undefined": 74, "unreachable": 26, "finite": 0}
    ]
    with open(os.path.join(data_out_dir, "shortest_path_summary.json"), "w", encoding="utf-8") as f:
        json.dump(shortest_path_data, f, indent=2)

    # comparison_global_d015.csv
    df_cmp_glob = pd.read_csv(os.path.join(tables_dir, "comparison_global_d015.csv"))
    df_cmp_glob.to_json(os.path.join(data_out_dir, "comparison_global_d015.json"), orient="records", indent=2)

    # comparison_nodes_d015.csv
    df_cmp_nodes = pd.read_csv(os.path.join(tables_dir, "comparison_nodes_d015.csv"))
    df_cmp_nodes.to_json(os.path.join(data_out_dir, "comparison_nodes_d015.json"), orient="records", indent=2)

    # comparison_edges_d015.csv -> STRICTLY DROP w_A, w_B, d_w
    df_edges = pd.read_csv(os.path.join(tables_dir, "comparison_edges_d015.csv"))
    allowed_edge_cols = ["i", "j", "label_i", "label_j", "in_A", "in_B", "status", "sign_A", "sign_B", "sign_flip"]
    df_edges_clean = df_edges[[c for c in allowed_edge_cols if c in df_edges.columns]]
    df_edges_clean.to_json(os.path.join(data_out_dir, "comparison_edges_d015.json"), orient="records", indent=2)
    print(f"comparison_edges_d015.json saved with {len(df_edges_clean)} edges (raw weights w_A, w_B, d_w excluded)")

    # multi_setting_consistency.csv (frozen v1)
    df_v1_cons = pd.read_csv(os.path.join(tables_dir, "multi_setting_consistency.csv"))
    df_v1_cons.to_json(os.path.join(data_out_dir, "multi_setting_consistency.json"), orient="records", indent=2)

    # protocol_v2_consistency.csv
    df_v2_cons = pd.read_csv(os.path.join(tables_dir, "protocol_v2_consistency.csv"))
    df_v2_cons.to_json(os.path.join(data_out_dir, "protocol_v2_consistency.json"), orient="records", indent=2)

    # multi_setting_values.csv
    df_multi_vals = pd.read_csv(os.path.join(tables_dir, "multi_setting_values.csv"))
    df_multi_vals.to_json(os.path.join(data_out_dir, "multi_setting_values.json"), orient="records", indent=2)

    # protocol_v2_values.csv (density + every *_A / *_B column)
    df_v2_vals = pd.read_csv(os.path.join(tables_dir, "protocol_v2_values.csv"))
    df_v2_vals.to_json(os.path.join(data_out_dir, "protocol_v2_values.json"), orient="records", indent=2)

    # posthoc_scale_check.csv (keep ALL columns including mean_strength_lcc_norm_A/_B/_delta)
    df_posthoc = pd.read_csv(os.path.join(tables_dir, "posthoc_scale_check.csv"))
    df_posthoc.to_json(os.path.join(data_out_dir, "posthoc_scale_check.json"), orient="records", indent=2)

    # posthoc_scale_check_labels.csv
    df_posthoc_lbl = pd.read_csv(os.path.join(tables_dir, "posthoc_scale_check_labels.csv"))
    df_posthoc_lbl.to_json(os.path.join(data_out_dir, "posthoc_scale_check_labels.json"), orient="records", indent=2)

    # multi_setting_g2l.csv
    df_g2l = pd.read_csv(os.path.join(tables_dir, "multi_setting_g2l.csv"))
    df_g2l.to_json(os.path.join(data_out_dir, "multi_setting_g2l.json"), orient="records", indent=2)

    # multi_setting_retention.csv -> STRICTLY DROP w_A, w_B
    df_ret = pd.read_csv(os.path.join(tables_dir, "multi_setting_retention.csv"))
    ret_allowed_cols = ["i", "j", "label_i", "label_j", "count_A", "count_B", "P_A", "P_B", "dP", "sign_A", "sign_B"]
    # Filter to edges that appear in at least one setting (count_A > 0 or count_B > 0) to keep JSON compact & fast
    df_ret_present = df_ret[(df_ret["count_A"] > 0) | (df_ret["count_B"] > 0)]
    df_ret_clean = df_ret_present[[c for c in ret_allowed_cols if c in df_ret.columns]]
    df_ret_clean.to_json(os.path.join(data_out_dir, "multi_setting_retention.json"), orient="records", indent=2)
    print(f"multi_setting_retention.json saved with {len(df_ret_clean)} active edges (raw weights w_A, w_B excluded)")

    # 5. Process replication tables
    df_rep_sum = pd.read_csv(os.path.join(replication_dir, "replication_summary.csv"))
    df_rep_sum.to_json(os.path.join(data_out_dir, "replication_summary.json"), orient="records", indent=2)

    df_rep_v1 = pd.read_csv(os.path.join(replication_dir, "replication_labels_v1.csv"))
    df_rep_v1.to_json(os.path.join(data_out_dir, "replication_labels_v1.json"), orient="records", indent=2)

    df_rep_v2 = pd.read_csv(os.path.join(replication_dir, "replication_labels_v2.csv"))
    df_rep_v2.to_json(os.path.join(data_out_dir, "replication_labels_v2.json"), orient="records", indent=2)

    df_rep_tol = pd.read_csv(os.path.join(replication_dir, "replication_tolerance_check.csv"))
    df_rep_tol.to_json(os.path.join(data_out_dir, "replication_tolerance_check.json"), orient="records", indent=2)

    df_rep_struct = pd.read_csv(os.path.join(replication_dir, "replication_structure_d015.csv"))
    df_rep_struct.to_json(os.path.join(data_out_dir, "replication_structure_d015.json"), orient="records", indent=2)

    # 6. Build verification_tests.json with exact notebook test specifications
    verification_tests = [
        {
            "id": "C05T",
            "module": "Module A",
            "title": "Data validation and loader tests",
            "passed": 27,
            "total": 27,
            "status": "PASS",
            "description": "Validation of HCP netmats format, matrix symmetry, zero diagonal, no NaNs, and subject loader contracts."
        },
        {
            "id": "C07T",
            "module": "Module B",
            "title": "Preprocessing and GraphConfiguration",
            "passed": 28,
            "total": 28,
            "status": "PASS",
            "description": "Configuration hashing, missing value handling, asymmetry checks, and preprocessing pipeline."
        },
        {
            "id": "C08T",
            "module": "Module C",
            "title": "Graph construction (proportional density, ties, rounding, zeros, diagonal)",
            "passed": 25,
            "total": 25,
            "status": "PASS",
            "description": "Proportional density graph build, deterministic tie-breaking (abs_desc_then_ij), signed weights preservation."
        },
        {
            "id": "C10",
            "module": "Graph Verification",
            "title": "Checks on the REAL graphs (edges, weights equal source, top-743 by |w|, same config for A and B)",
            "passed": 18,
            "total": 18,
            "status": "PASS",
            "description": "Verification of subject A and B real graphs at d=0.15: exact edge count (743), top-|w| alignment, identical settings."
        },
        {
            "id": "C11",
            "module": "Integration A-C",
            "title": "Foundation integration test (load -> validate -> preprocess -> build graph; invalid input rejected)",
            "passed": 9,
            "total": 9,
            "status": "PASS",
            "description": "End-to-end foundation pipeline check and defensive rejection of corrupt/incompatible inputs."
        },
        {
            "id": "C18",
            "module": "Modules D–G",
            "title": "Statistics, metrics, BFS/DFS and Bellman–Ford",
            "passed": 22,
            "total": 22,
            "status": "PASS",
            "description": "Full validation of graph metrics, degree/strength distributions, BFS/DFS tree reachability, and Bellman-Ford negative-cycle detection."
        },
        {
            "id": "C22R",
            "module": "Rule Protocol",
            "title": "Protocol v2 rule self-checks",
            "passed": 5,
            "total": 5,
            "status": "PASS",
            "description": "Self-checks for protocol v2: 1% relative tolerance thresholding, scale normalization, and partially consistent classification."
        },
        {
            "id": "C24",
            "module": "Modules H–I",
            "title": "Consistency rule, multi-setting behaviour, pairwise comparison",
            "passed": 16,
            "total": 16,
            "status": "PASS",
            "description": "Pairwise comparison logic, multi-density profile stability, edge retention calculations, and Global-to-Local rankings."
        },
        {
            "id": "C26",
            "module": "Integration Suite",
            "title": "End-to-end integration tests, including the source scan for Dijkstra / 1/w / reciprocal",
            "passed": 21,
            "total": 21,
            "status": "PASS",
            "description": "Full integration audit, AST source scan verifying zero forbidden algorithms (Dijkstra, 1/w, reciprocal weights)."
        },
        {
            "id": "C27",
            "module": "Pipeline Equivalence",
            "title": "One-call pipeline reproduces the step-by-step results",
            "passed": 10,
            "total": 10,
            "status": "PASS",
            "description": "run_pipeline() produces bitwise-identical results across all steps compared to cell-by-cell execution."
        }
    ]
    with open(os.path.join(data_out_dir, "verification_tests.json"), "w", encoding="utf-8") as f:
        json.dump(verification_tests, f, indent=2)

    # 7. Copy all PNG figures from run_dir/figures/
    fig_src_dir = os.path.join(run_dir, "figures")
    png_files = glob.glob(os.path.join(fig_src_dir, "*.png"))
    for fig_path in png_files:
        fig_name = os.path.basename(fig_path)
        shutil.copy2(fig_path, os.path.join(figures_out_dir, fig_name))
    print(f"Copied {len(png_files)} figure files to {figures_out_dir}")

    print("Stage 1 data pipeline completed successfully!")

if __name__ == "__main__":
    main()
