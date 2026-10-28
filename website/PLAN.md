# Website Implementation Plan: Brain Connectome Visualization and Analysis System

## 1. Project Overview & Architecture
Static, multi-page web application presenting the project, methods, and descriptive findings of the **Brain Connectome Visualization and Analysis System**.
The site is built with **Vite + React + TypeScript** using **HashRouter** for reliable deployment on GitHub Pages (`/Brain-Connectome-Analysis/`).
It strictly complies with the **HCP Open Access Data Use Terms** by never publishing or storing raw connectivity values ($w_A, w_B, d_w$). All numbers, metrics, tables, and figures come directly from the source-of-truth notebook (`Brain_Connectome_Analysis.ipynb`) and the verified exported runs in `site_data/`.

---

## 2. Page List & Structure

| # | Page | Route | Description & Key Contents |
|---|---|---|---|
| 1 | **Home** | `#/` | • Project statement: "a graph-based application ... without using machine learning".<br>• Short plain-language summary of what was done.<br>• 4 headline metric cards:<br>  1) 1003/1003 subjects validated (data check)<br>  2) 743 edges per network at $d=0.15$<br>  3) 5 subject pairs compared across 6 densities<br>  4) 0 finite shortest paths because of negative cycles.<br>• Core result paragraph (setting sensitivity vs stability):<br>  *"Whether a difference between two individuals survives different density choices depends strongly on the metric. Across 5 pre-specified subject pairs, normalised strength and normalised mean \|w\| were the most stable (setting-consistent in 4 of 5 pairs), transitivity was mostly stable (3 of 5), average clustering of the largest component usually depended on density (construction-sensitive in 4 of 5), and fragmentation measures were stable in only 2 of 5. A raw-weight result under the frozen v1 rule turned out to be a per-subject scale effect, which is why protocol v2 was added. All results are descriptive: five pairs, no significance testing."*<br>• Fast navigation to Data, Methods, and Verification.<br>• Links to GitHub repo (`https://github.com/anushadalal/Brain-Connectome-Analysis/blob/main/Brain_Connectome_Analysis.ipynb`) and Open in Colab (`https://colab.research.google.com/github/anushadalal/Brain-Connectome-Analysis/blob/main/Brain_Connectome_Analysis.ipynb`, noting HCP data required in Drive).<br>• Settings ID badge (`f1ebb3fdc3`) & direct link to Limitations page. |
| 2 | **Data** | `#/data` | • HCP Young Adult S1200 PTN release details (1003 subjects, group-ICA 100 components, `netmats1`: full correlation, $r$-to-$Z$ statistics from FSLNets (full correlation, Gaussianised $r$), not Pearson $r$).<br>• Clarification that nodes are ICA spatial components, not anatomical parcels (maps can overlap and contain several separated regions; "brain region" in the project statement means "network node").<br>• Data validation report (data check, not test): 1003/1003 subjects valid, 0 NaN, max asymmetry 0.0, diagonal strictly zero.<br>• Main subject pair identification: A = `100206` (row 0), B = `100307` (row 1).<br>• HCP Data Use Terms compliance notice and ConnectomeDB acquisition requirements (data is not redistributed).<br>• Descriptive statistics table across all 4,950 node pairs (`statistics_global.json`).<br>• High-resolution matrix heatmaps and weight histograms (`A_matrix.png`, `B_matrix.png`, `A_hist.png`, `B_hist.png`). |
| 3 | **Methods** | `#/methods` | • Interactive step-by-step pipeline diagram:<br>  `Load -> Validate -> Preprocess -> Build signed graph -> Statistics -> Metrics -> BFS/DFS -> Bellman–Ford -> Compare -> Multi-density -> Global-to-local -> Report`.<br>• Compatibility check: exact verification of same 100 nodes, same labels, same order before any comparison.<br>• Graph construction algorithm: proportional density ranking by $\|w\|$, deterministic tie-breaking by `abs_desc_then_ij` (descending $\|w\|$, then $(i, j)$ ascending), $m = \lfloor d \times 4950 + 0.5 \rfloor$, preserving signed weights.<br>• Networks A and B built with identical settings at every density (one settings ID per density).<br>• 6 density settings table: $d \in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]$ corresponding to edge counts $[248, 495, 743, 990, 1238, 1485]$.<br>• Mathematical proof/explanation of Bellman–Ford "undefined" result: an undirected negative edge $u \sim v$ with weight $w < 0$ makes an undirected 2-cycle $u \to v \to u$ with traversal cost $2w < 0$, causing shortest paths to reachable nodes to be undefined ($-\infty$).<br>• Formal KaTeX formulas:<br>  - Metric difference: $\Delta M(d) = M(G_A(d)) - M(G_B(d))$<br>  - Sign-consistency score: $S_M = \frac{\max(n^+, n^-)}{n^+ + n^-}$<br>  - Edge retention probabilities: $P_A(e) = \frac{\text{count}_A(e)}{K}$, $P_B(e) = \frac{\text{count}_B(e)}{K}$, and $\Delta P(e) = P_A(e) - P_B(e)$.<br>• Protocol v1 (frozen strict sign rule) vs Revised Protocol v2 (scale-free normalized metrics + 1% relative threshold gap $\text{REL\_TOL} = 0.01$, introducing "partially consistent" label), exactly as worded in `report.md` / C21 / C22R.<br>• Core design rules: No Dijkstra, no $1/w$, negative edges never discarded, identical settings across pairs, settings ID on every result. |
| 4 | **Single Networks** | `#/networks` | • Side-by-side inspection of Subject A (`100206`) and Subject B (`100307`) at $d=0.15$ (743 edges each).<br>• Static network visualizations (`A_network.png`, `B_network.png`).<br>• Interactive Cytoscape network explorer: switchable view of A and B, isolated nodes organized in a dedicated bottom row, edges styled by sign (red = positive, blue = negative), interactive node hover card (label, degree, signed strength, clustering, LCC status from `metrics_nodes.json`).<br>• Statistics and graph metrics summary tables (`statistics_global.json`, `metrics_global_d015.json`).<br>• Traversal summary table (BFS / DFS from source node 34 / IC035; reaches 85 nodes for A in 5 levels, 74 for B in 4 levels; `A_bfs_levels.png`).<br>• Bellman–Ford status chart (`AB_shortest_path_status.png` and `shortest_path_summary.json`) reporting BOTH subjects:<br>  - **A (100206):** 85 undefined, 15 unreachable, 0 finite.<br>  - **B (100307):** 74 undefined, 26 unreachable, 0 finite. |
| 5 | **Comparison (d=0.15)** | `#/comparison` | • Global network difference table ($\Delta M = A - B$ with scale-dependent metrics clearly marked).<br>• Edge overlap breakdown: 355 shared edges, 388 A-only edges, 388 B-only edges, 3 sign flips; Jaccard index $J = 0.314$.<br>• Interactive Cytoscape edge overlap network (and static publication figure `AB_edge_overlap_network.png`) using the notebook's color coding:<br>  - **Grey:** in both networks<br>  - **Orange:** only in network A<br>  - **Purple:** only in network B<br>  - **Line style for sign:** solid = positive, dashed = negative<br>  - **3 sign flips:** distinctly marked with thicker stroke and legend entry.<br>• Sortable node-difference table (`comparison_nodes_d015.json`: degree changes, normalized strength changes, clustering differences, component isolation switches).<br>• Degree vs strength comparison (`AB_degree_strength.png`) and weight difference distribution (`AB_weight_difference.png`). |
| 6 | **Multi-Density Analysis** | `#/multi-density` | • Interactive Plotly chart: Metric difference $\Delta M(d) = A - B$ across the 6 densities with metric dropdown selector and zero-line.<br>• Dynamic tolerance band: Drawn ONLY when viewing protocol v2 values, calculated per density as $\pm 0.01 \times \text{mean}(\|A\|, \|B\|)$. (In raw v1 view, no band is drawn). For scale-dependent metrics, v2 uses normalized versions (`mean_strength_norm`, `mean_strength_lcc_norm`, `mean_abs_weight_norm`).<br>• Interactive Plotly chart: Trajectory of $M(G_A(d))$ and $M(G_B(d))$ side-by-side across densities.<br>• Consistency table showing frozen v1 and v2 labels side by side (`multi_setting_consistency.json`, `protocol_v2_consistency.json`).<br>• Post-hoc scale check showcase (`posthoc_scale_check.json` with all columns including `mean_strength_lcc_norm_A/_B/_delta`, and `posthoc_scale_check_labels.json`): demonstration of how `mean_abs_weight` reverses from raw $A > B$ (subject A scale $\overline{\|w\|}_A = 6.3631$ vs B $\overline{\|w\|}_B = 5.2530$) to normalized $A < B$ across all 6 densities.<br>• Global-to-Local (G2L) explorer: "Nodes whose change goes together with the global difference" (top 10 nodes with mean delta and sign agreement) and top edges by retention change $\Delta P$. (Descriptive association only, no causal claims).<br>• Static overview figures: `AB_values_vs_density.png`, `AB_delta_profiles.png`, node degree heatmap (`AB_node_degree_heatmap.png`), node strength heatmap (`AB_node_strength_heatmap.png`), edge retention matrix (`AB_retention_matrix.png`), and $\Delta P$ histogram (`AB_retention_hist.png`). |
| 7 | **Replication** | `#/replication` | • Analysis of 4 pre-specified subject pairs (fixed before execution: `100408-100610`, `101006-101107`, `101309-101915`, `102008-102109` + main pair `100206-100307`). Rule: next 8 subject IDs after A and B, paired in order.<br>• Colour-coded v2 label grid with text labels (green = consistent, amber = partial, purple = sensitive, distinct from red/blue edge signs).<br>• Stability summary:<br>  - Normalised strength and normalised mean $\|w\|$: setting-consistent in 4 of 5 pairs.<br>  - Transitivity: mostly stable (3 of 5).<br>  - Average clustering of the largest component: usually depended on density (construction-sensitive in 4 of 5 pairs).<br>  - Fragmentation measures: stable in only 2 of 5 pairs (sensitive in 3 of 5).<br>• Tolerance check table at $\text{REL\_TOL} \in [0.5\%, 1.0\%, 2.0\%]$ (`replication_tolerance_check.json`).<br>• Baseline structure table at $d=0.15$ (`replication_structure_d015.json`).<br>• Methodological note: direction ($A > B$) is arbitrary across pairs because subject order is arbitrary; only consistency labels replicate. Descriptive only: 5 pairs, no significance testing. |
| 8 | **Verification & Provenance** | `#/verification` | • Comprehensive test suite results from `Brain_Connectome_Analysis.ipynb`: 181/181 passing tests (100% pass rate) across 10 test cells:<br>  - `C05T` 27/27: data validation and loader tests (Module A)<br>  - `C07T` 28/28: preprocessing and GraphConfiguration (Module B)<br>  - `C08T` 25/25: graph construction (proportional density, ties, rounding, zeros, diagonal) (Module C)<br>  - `C10` 18/18: checks on the REAL graphs (edges, weights equal source, top-743 by \|w\|, same config for A and B)<br>  - `C11` 9/9: foundation integration test (load -> validate -> preprocess -> build graph; invalid input rejected)<br>  - `C18` 22/22: statistics, metrics, BFS/DFS and Bellman–Ford (Modules D–G)<br>  - `C22R` 5/5: protocol v2 rule self-checks<br>  - `C24` 16/16: consistency rule, multi-setting behaviour, pairwise comparison (Modules H–I)<br>  - `C26` 21/21: end-to-end integration tests, including the source scan for Dijkstra / 1/w / reciprocal<br>  - `C27` 10/10: one-call pipeline reproduces the step-by-step results.<br>• Separate data check card: "1003/1003 subjects valid" (0 NaN, max asymmetry 0.0, diagonal 0.0).<br>• Reproducibility: bitwise identical results across reruns, deterministic tie-breaking, fixed seed 42.<br>• Settings ID (hash of configuration): `f1ebb3fdc3`.<br>• Runtime environment audit from `environment.json` (Python 3.13.16, NumPy 2.1.3, NetworkX 3.7, Matplotlib 3.10.0, Linux kernel).<br>• AST source scanner confirmation: no Dijkstra, no $1/w$, no reciprocal calls. |
| 9 | **Limitations & Integrity** | `#/limitations` | • Exhaustive presentation of all 13 `REPORT_CAVEATS` from `report.md` Section 12.<br>• Scientific integrity timeline: documentation of what was observed prior to freezing rules on 21 Oct 2026, sign agreement correction history (C21 v2), post-hoc addition of protocol v2 (fixed before replication pairs).<br>• Strict terminology guidelines: no words like "significant", "proves", "causes", "biomarker", "diagnosis", and no p-values.<br>• Global-to-local associations represent observational co-occurrence, not causality.<br>• ICA components vs anatomical parcels clarification.<br>• Bellman–Ford undefined shortest path analysis due to reachable undirected negative cycles. |

---

## 3. Data Pipeline (`website/scripts/build_data.py`)

Python 3 build script using `pandas` and `json` reading from `site_data/` and writing compact JSON to `website/public/data/` and copying 26 figures to `website/public/figures/`.

### HCP Open Access Rule Compliance
**NO raw connectivity values:** Columns `w_A`, `w_B`, and `d_w` are dropped from all JSON files (`comparison_edges_d015.csv` and `multi_setting_retention.csv`).

### JSON Files Generated:
1. `config.json` (from `run_.../config.json`)
2. `environment.json` (from `run_.../environment.json`)
3. `provenance.json` (from `run_.../provenance.json`)
4. `statistics_global.json` (from `tables/statistics_global.csv`)
5. `statistics_nodes.json` (merged from `tables/statistics_nodes_A.csv` and `tables/statistics_nodes_B.csv`)
6. `metrics_global_d015.json` (from `tables/metrics_global_d015.csv`)
7. `metrics_nodes.json` (merged from `tables/metrics_nodes_A.csv` and `tables/metrics_nodes_B.csv`)
8. `traversal_summary.json` (from `tables/traversal_summary.csv`)
9. `shortest_path_summary.json` (from `tables/shortest_path_summary.csv` - containing both subjects A: 85 undef / 15 unreach / 0 finite, and B: 74 undef / 26 unreach / 0 finite)
10. `comparison_global_d015.json` (from `tables/comparison_global_d015.csv`)
11. `comparison_nodes_d015.json` (from `tables/comparison_nodes_d015.csv`)
12. `comparison_edges_d015.json` (from `tables/comparison_edges_d015.csv`: kept `i, j, label_i, label_j, in_A, in_B, status, sign_A, sign_B, sign_flip`; dropped `w_A, w_B, d_w`)
13. `multi_setting_consistency.json` (from `tables/multi_setting_consistency.csv`)
14. `protocol_v2_consistency.json` (from `tables/protocol_v2_consistency.csv`)
15. `multi_setting_values.json` (from `tables/multi_setting_values.csv`)
16. `protocol_v2_values.json` (from `tables/protocol_v2_values.csv`: density + every `*_A` and `*_B` column)
17. `posthoc_scale_check.json` (from `tables/posthoc_scale_check.csv`: keeping all 10 columns including `mean_strength_lcc_norm_A/_B/_delta`)
18. `posthoc_scale_check_labels.json` (from `tables/posthoc_scale_check_labels.csv`)
19. `multi_setting_g2l.json` (from `tables/multi_setting_g2l.csv`)
20. `multi_setting_retention.json` (from `tables/multi_setting_retention.csv`: kept `i, j, label_i, label_j, count_A, count_B, P_A, P_B, dP, sign_A, sign_B`; dropped `w_A, w_B`)
21. `replication_summary.json` (from `replication_.../replication_summary.csv`)
22. `replication_labels_v1.json` (from `replication_.../replication_labels_v1.csv`)
23. `replication_labels_v2.json` (from `replication_.../replication_labels_v2.csv`)
24. `replication_tolerance_check.json` (from `replication_.../replication_tolerance_check.csv`)
25. `replication_structure_d015.json` (from `replication_.../replication_structure_d015.csv`)
26. `replication_meta.json` (from `replication_.../replication.json`)
27. `verification_tests.json` (clean output and verified counts for C05T, C07T, C08T, C10, C11, C18, C22R, C24, C26, C27).

---

## 4. Visual Styles, Color Correctness & Components

1. **Semantic Color Integrity:**
   - **Edge signs (throughout site):** Red = positive, Blue = negative.
   - **Overlap Network:** Grey = in both, Orange = only in A, Purple = only in B. Solid line = positive, dashed line = negative. Thicker line for 3 sign flips.
   - **Consistency Labels:** Emerald Green = consistent, Amber = partial, Purple = sensitive (distinct from red/blue edge signs).
2. **Tolerance Band on Multi-Density Charts:**
   - Evaluated density-by-density: $\pm 0.01 \times \text{mean}(\|A\|, \|B\|)$ using `protocol_v2_values.json`.
   - Shown ONLY for Protocol v2 view; not shown for raw v1 view.
3. **Components:**
   - `Navbar`: Dark/light toggle, links to all pages, GitHub and Colab links.
   - `Footer`: Settings ID badge `f1ebb3fdc3`, HCP terms note, link to Limitations.
   - `CaveatBanner`: Subtle persistent reminder of descriptive nature.
   - `CytoscapeNetwork`: Interactive canvas for single network at $d=0.15$ with isolated nodes row.
   - `CytoscapeOverlapNetwork`: Interactive canvas with grey/orange/purple membership and solid/dashed sign styles.
   - `PlotlyDeltaChart`: Interactive difference chart with metric selector and dynamic 1% v2 tolerance band.
   - `PlotlyTrajectoryChart`: A vs B trajectory lines across densities.
   - `DataTable`: Accessible sortable tables.
   - `KaTeXFormula`: Rendered formulas for $\Delta M(d)$, $S_M$, $P(e)$, $\Delta P(e)$, and Bellman–Ford 2-cycles.

---

## 5. Execution Stages
- **Stage 1:** `build_data.py` + JSON generation + verify HCP raw weight exclusion + update `.gitignore`.
- **Stage 2:** Initialize Vite React TS in `website/`, routing, theme, layout, Home, Data, Methods.
- **Stage 3:** Results pages: Single Networks, Comparison, Multi-Density (Cytoscape & Plotly).
- **Stage 4:** Replication, Verification, Limitations pages.
- **Stage 5:** GitHub Actions deploy workflow, README updates, `npm run build` verification, browser testing across laptop/phone in light/dark mode.
