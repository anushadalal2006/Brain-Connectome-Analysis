#!/usr/bin/env python3
"""check_data.py - validates website/public/data/*.json against the notebook's results.

Exits with status 1 and a clear message on the first failure; prints "ALL CHECKS PASSED" otherwise.
Run from anywhere:  python website/scripts/check_data.py            (normal)
                    python website/scripts/check_data.py --verbose  (also prints each file's type and first item)
"""
import json
import pprint
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # website/scripts -> repo root
DATA_DIR = ROOT / "website" / "public" / "data"


def error(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def load_json(fname):
    p = DATA_DIR / fname
    if not p.exists():
        error(f"Missing file {p}")
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        error(f"Failed to parse {p}: {e}")


def need_list(data, fname):
    if not isinstance(data, list) or not data:
        error(f"{fname} should be a non-empty list of rows")
    return data


# 0. Optional debug listing
if "--verbose" in sys.argv:
    for json_path in sorted(DATA_DIR.glob("*.json")):
        data = load_json(json_path.name)
        first = None
        if isinstance(data, list) and data:
            first = data[0]
        elif isinstance(data, dict):
            first = next(iter(data.values()), None)
        print(f"{json_path.name}: type={type(data).__name__}, first_item={pprint.pformat(first, width=60)}")

# 1. No raw connectivity values anywhere (HCP data-use rule)
FORBIDDEN = {"w_A", "w_B", "d_w"}


def find_forbidden(obj, fname, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in FORBIDDEN:
                error(f"Forbidden key '{k}' found in {fname}{path}")
            find_forbidden(v, fname, f"{path}->{k}")
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            find_forbidden(item, fname, f"{path}[{i}]")


json_files = sorted(DATA_DIR.glob("*.json"))
if not json_files:
    error(f"No JSON files in {DATA_DIR}")
for json_path in json_files:
    find_forbidden(load_json(json_path.name), json_path.name)

# 2. Edge overlap at d = 0.15
edges = need_list(load_json("comparison_edges_d015.json"), "comparison_edges_d015.json")
if len(edges) != 1131:
    error(f"comparison_edges_d015.json has {len(edges)} rows (expected 1131)")
both = sum(1 for e in edges if e.get("status") == "both")
only_a = sum(1 for e in edges if e.get("status") == "A_only")
only_b = sum(1 for e in edges if e.get("status") == "B_only")
flips = sum(1 for e in edges if e.get("sign_flip") is True)
if (both, only_a, only_b) != (355, 388, 388):
    error(f"Edge status counts both={both}, A_only={only_a}, B_only={only_b} (expected 355, 388, 388)")
if flips != 3:
    error(f"sign_flip count {flips} (expected 3)")

# 3. Global metrics at d = 0.15
metrics = need_list(load_json("metrics_global_d015.json"), "metrics_global_d015.json")
mdict = {m.get("metric"): m for m in metrics}
expected_metrics = {"n_edges": (743, 743), "n_isolated": (15, 26), "n_components": (16, 27),
                    "largest_component_size": (85, 74)}
for name, (ea, eb) in expected_metrics.items():
    row = mdict.get(name)
    if row is None:
        error(f"metrics_global_d015.json has no row for {name}")
    if row.get("A") != ea or row.get("B") != eb:
        error(f"{name}: A={row.get('A')}, B={row.get('B')} (expected {ea}, {eb})")

# 4. Bellman-Ford
sp = need_list(load_json("shortest_path_summary.json"), "shortest_path_summary.json")
expected_sp = {"100206": {"undefined": 85, "unreachable": 15, "finite": 0},
               "100307": {"undefined": 74, "unreachable": 26, "finite": 0}}
if sorted(str(e.get("subject")) for e in sp) != sorted(expected_sp):
    error(f"shortest_path_summary subjects {[e.get('subject') for e in sp]} (expected 100206, 100307)")
for e in sp:
    sub = str(e.get("subject"))
    if e.get("status") != "negative_cycle":
        error(f"shortest_path_summary {sub}: status {e.get('status')} (expected negative_cycle)")
    for k, v in expected_sp[sub].items():
        if e.get(k) != v:
            error(f"shortest_path_summary {sub}: {k}={e.get(k)} (expected {v})")

# 5. BFS / DFS
trav = need_list(load_json("traversal_summary.json"), "traversal_summary.json")
combos = {(str(e.get("subject")), e.get("algorithm")) for e in trav}
expected_combos = {(s, a) for s in ("100206", "100307") for a in ("BFS", "DFS")}
if len(trav) != 4 or combos != expected_combos:
    error(f"traversal_summary combinations {sorted(combos)} (expected BFS and DFS for both subjects)")
expected_reach = {"100206": 85, "100307": 74}
for e in trav:
    sub = str(e.get("subject"))
    if e.get("source") != 34 or e.get("source_label") != "IC035":
        error(f"traversal_summary {sub} {e.get('algorithm')}: source {e.get('source')} / "
              f"{e.get('source_label')} (expected 34 / IC035)")
    if e.get("reachable") != expected_reach[sub]:
        error(f"traversal_summary {sub} {e.get('algorithm')}: reachable {e.get('reachable')} "
              f"(expected {expected_reach[sub]})")

# 6. Frozen v1 labels
msc = need_list(load_json("multi_setting_consistency.json"), "multi_setting_consistency.json")
v1_consistent = {r.get("metric") for r in msc if r.get("label") == "setting-consistent"}
v1_sensitive = {r.get("metric") for r in msc if r.get("label") == "construction-sensitive"}
if len(msc) != 11 or len(v1_consistent) != 9:
    error(f"multi_setting_consistency: {len(msc)} metrics, {len(v1_consistent)} setting-consistent (expected 11, 9)")
if v1_sensitive != {"avg_clustering_all", "avg_clustering_lcc"}:
    error(f"v1 construction-sensitive metrics {v1_sensitive}")

# 7. Protocol v2 labels (the label text "partially consistent" has a space; this is the notebook's spelling)
p2c = need_list(load_json("protocol_v2_consistency.json"), "protocol_v2_consistency.json")
by_label = {}
for r in p2c:
    by_label.setdefault(r.get("label"), set()).add(r.get("metric"))
expected_v2 = {
    "setting-consistent": {"n_components", "largest_component_size", "n_isolated", "mean_strength_norm",
                           "mean_strength_lcc_norm", "mean_abs_weight_norm"},
    "partially consistent": {"avg_clustering_all", "transitivity_all", "transitivity_lcc", "share_negative_edges"},
    "construction-sensitive": {"avg_clustering_lcc"},
}
if by_label != expected_v2:
    error(f"protocol v2 labels {by_label} (expected {expected_v2})")
direction = next((r.get("direction") for r in p2c if r.get("metric") == "mean_abs_weight_norm"), None)
if direction != "A < B":
    error(f"mean_abs_weight_norm v2 direction {direction} (expected 'A < B')")

# 8. Densities
for fname in ("multi_setting_values.json", "protocol_v2_values.json", "posthoc_scale_check.json"):
    vals = need_list(load_json(fname), fname)
    densities = sorted(item.get("density") for item in vals)
    if densities != [0.05, 0.1, 0.15, 0.2, 0.25, 0.3]:
        error(f"{fname} densities {densities}")

# 9. Replication summary
rep = need_list(load_json("replication_summary.json"), "replication_summary.json")
rdict = {r.get("metric"): r for r in rep}
if len(rep) != 11:
    error(f"replication_summary.json has {len(rep)} metrics (expected 11)")
expected_rep = {"avg_clustering_lcc": {"v2_consistent": "1/5"},
                "mean_strength_norm": {"v2_consistent": "4/5"},
                "mean_abs_weight_norm": {"v2_consistent": "4/5", "v1_consistent": "5/5"},
                "n_components": {"v2_consistent": "2/5"}}
for metric, fields in expected_rep.items():
    row = rdict.get(metric)
    if row is None:
        error(f"replication_summary has no row for {metric}")
    for k, v in fields.items():
        if row.get(k) != v:
            error(f"replication_summary {metric}: {k}={row.get(k)} (expected {v})")
for k in ("main", "pair1", "pair2", "pair3", "pair4"):
    if k not in rep[0]:
        error(f"replication_summary is missing column {k}")

# 10. Replication pairs (order matters: main pair first, then pair1..pair4)
struct = need_list(load_json("replication_structure_d015.json"), "replication_structure_d015.json")
expected_pairs = [["100206", "100307"], ["100408", "100610"], ["101006", "101107"],
                  ["101309", "101915"], ["102008", "102109"]]
actual_pairs = [[str(r.get("A")), str(r.get("B"))] for r in struct]
if actual_pairs != expected_pairs:
    error(f"replication pairs {actual_pairs} (expected {expected_pairs})")

# 11. Verification tests, per cell
ver = need_list(load_json("verification_tests.json"), "verification_tests.json")
expected_cells = {"C05T": 27, "C07T": 28, "C08T": 25, "C10": 18, "C11": 9,
                  "C18": 22, "C22R": 5, "C24": 16, "C26": 21, "C27": 10}
seen = set()
for t in ver:
    cell = str(t.get("id"))
    if cell not in expected_cells:
        error(f"Unexpected test cell {cell} in verification_tests.json")
    if t.get("total") != expected_cells[cell] or t.get("passed") != expected_cells[cell]:
        error(f"{cell}: total={t.get('total')} passed={t.get('passed')} (expected {expected_cells[cell]})")
    if t.get("status") != "PASS":
        error(f"{cell}: status {t.get('status')} (expected PASS)")
    seen.add(cell)
if seen != set(expected_cells):
    error(f"verification_tests missing cells {sorted(set(expected_cells) - seen)}")

# 12. Settings ID (config.json is {"config": {..., "hash": ...}, ...} as exported by notebook C25)
config = load_json("config.json")
if not isinstance(config, dict) or config.get("config", {}).get("hash") != "f1ebb3fdc3":
    error("config.json config.hash is not f1ebb3fdc3")

print("ALL CHECKS PASSED")