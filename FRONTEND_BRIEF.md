# Frontend brief: Brain Connectome Visualization and Analysis System

Read this whole file before changing anything. It is the single source of truth for the website work: what the project is, what is already built, mistakes that were made and must not be repeated, the verified results, what is still wrong, and the full specification of what to add.

Deadline: the project is presented on 29 Oct 2026. Work in the priority order of section 8 (P0 first). After every task: `python website/scripts/check_data.py` must print `ALL CHECKS PASSED` and `npm run build` (in `website/`) must succeed with no TypeScript errors.

---

## 1. The project in one paragraph

A graph-based system for analysing brain connectivity **without machine learning**. Input: HCP Young Adult S1200 PTN release, group-ICA 100 components, `netmats1` (full correlation, r-to-Z statistics from FSLNets) for 1003 subjects: one 100 × 100 signed matrix per person. The notebook (`Brain_Connectome_Analysis.ipynb`, cells C01–C28) validates the data, builds a signed weighted graph by proportional density, computes statistics and graph metrics, runs BFS, DFS and Bellman–Ford, compares two people (A = 100206, B = 100307), repeats the comparison at 6 densities to see which differences keep their direction (the research question), links global differences to local node/edge changes, and replicates on 4 more pre-specified pairs. Everything is descriptive: 5 pairs, no significance tests.

Research question: *How do graph-construction choices affect the observed differences between brain connectivity networks, and can global network-level changes be linked to corresponding local node- and edge-level changes?*

Main finding: whether a difference survives density choices depends strongly on the metric. Normalised strength and normalised mean |w| were setting-consistent in 4 of 5 pairs; transitivity in 3 of 5; average clustering of the largest component was construction-sensitive in 4 of 5; fragmentation measures were consistent in only 2 of 5. A raw-weight result under the frozen v1 rule was a per-subject scale effect, which is why protocol v2 was added.

---

## 2. Repository and how the site works

```
Brain_Connectome_Analysis.ipynb   FINAL, tested notebook. Never edit.
README.md                         Keep existing content; update the website section only.
.gitignore                        site_data/, node_modules/, website/dist/, raw HCP files are ignored.
.github/workflows/deploy.yml      Builds website/ and deploys to GitHub Pages. Must NOT run build_data.py.
website/
  scripts/build_data.py           site_data/ (local only) -> public/data/*.json + public/figures/*.png
  scripts/check_data.py           Verifies every key number. Never weaken it to make it pass.
  public/data/*.json              27 files, committed. The site reads ONLY these at run time.
  public/figures/*.png            26 notebook figures, committed.
  src/                            React 18 + Vite 6 + TypeScript, HashRouter, Plotly (react-plotly.js),
                                  Cytoscape.js, KaTeX, lucide-react. Theme context for light/dark.
  src/pages/                      Home, Data, Methods, SingleNetworks, Comparison, MultiDensity,
                                  Replication, Verification, Limitations
  src/components/                 Navbar, Footer, CaveatBanner, DataTable, MetricCard, KaTeX,
                                  CytoscapeNetwork, CytoscapeOverlapNetwork, PlotlyDeltaChart,
                                  PlotlyTrajectoryChart
```

- Vite `base` is `/Brain-Connectome-Analysis/`. Data and figure URLs must use `` `${import.meta.env.BASE_URL}data/...` ``.
- Routing is HashRouter: internal links must use `<Link to="/page">`, never `<a href="/page">` (that 404s on GitHub Pages).
- `site_data/` exists only on the owner's laptop. If it is missing, do not run `build_data.py`; work from the committed JSON.
- Repos: test repo `anushadalal2006/Brain-Connectome-Analysis` (live at https://anushadalal2006.github.io/Brain-Connectome-Analysis/); final repo `anushadalal/Brain-Connectome-Analysis`. GitHub/Colab links in the site point to the final repo (correct). Put the repo owner in ONE constant (`src/config.ts`) and use it everywhere.

---

## 3. Non-negotiable rules (apply to code, text, charts and data)

1. **HCP data-use terms:** never publish raw connectivity values. No `w_A`, `w_B`, `d_w`, `max_abs_w_*` or any per-edge weight in `public/data`, charts, tooltips or tables. Derived values (degree, signed node strength, clustering, counts, retention P_A/P_B/dP, signs, statistics summaries, normalised metrics) and the notebook PNG figures are allowed. Never commit `site_data/`, `.tar.gz`, `netmats*.txt`, `subjectIDs.txt`.
2. **No Dijkstra, no 1/w,** anywhere, not even in explanatory examples presented as something we did.
3. **Shortest paths are "undefined"** (reachable negative cycle), never shown as numbers.
4. **Descriptive wording only.** Never: "significant" (except "no significance testing"), "proves", "causes", "drives/driving", "explains" (for global-to-local), "contributes/contributing", "biomarker", "diagnosis" (except "no clinical or diagnostic statements"), "cryptographic", "stability ratio", "Fisher r-to-Z". Use: "goes together with", "sign-consistency score S_M", "settings ID (hash of the configuration)", "r-to-Z statistics from FSLNets".
5. **Frozen v1 and protocol v2 are always shown side by side.** v2 is primary; v1 is labelled "frozen v1". Never hide v1.
6. **Colours carry meaning everywhere:** red = positive edge/weight, blue = negative edge/weight. Overlap membership: grey = in both, orange = only A, purple = only B, gold thick = sign flip; edge sign in overlap view by line style (solid +, dashed −). Labels: green = setting-consistent, amber = partially consistent, purple/pink = construction-sensitive, grey = no difference. Never use red/blue for anything other than sign; never use colour alone (always a text label or legend).
7. **Every number comes from `public/data/*.json`** (or is a fixed fact listed in section 5). No hard-coded results.
8. **Direction is arbitrary across replication pairs;** only labels replicate. Say so wherever replication results appear.
9. **Nodes are ICA components, not anatomical regions.** Say "network node" / "ICA component".

---

## 4. History: what was done, and mistakes that were made (do not repeat)

Built with Antigravity (Gemini) in stages: PLAN.md, build_data.py, 9 pages, check script, chart fixes; then fixed and pushed from Claude.

Mistakes found and already fixed:
- Results were hard-coded in pages. Fixed: pages load JSON. **Do not reintroduce hard-coded numbers.**
- The deploy workflow ran `build_data.py`, which can never work on GitHub. Fixed. **Never add it back.**
- `handleModeToggle` was defined but unused, so `tsc` failed the build. Fixed by adding the v1/v2 toggle buttons. **Always run `npm run build`.**
- `<a href="/limitations">` broke under HashRouter. Fixed with `<Link>`. **Use `<Link>` for internal links.**
- `max_abs_w_A/B` (single raw values) were published. Removed from JSON, types and build_data.py.
- Limitations page: the isolated-node range "15–26" was presented as if across all pairs (it was the main pair; across 5 pairs the range is 14–26). Fixed to "main pair at d = 0.15: 15 in A, 26 in B".
- Limitations caveat 13 overclaimed novelty. Fixed: it is a *candidate* contribution still to be compared with published methods.
- Limitations timeline mixed up the order: the sign_agreement bug fix happened right after the first C22 run; the scale check came later. Fixed.
- A stray character `a` after a `</div>` rendered on the page. Fixed. Watch for stray text in JSX.
- "Cryptographic Audit" on Verification. Fixed to "Checksum Record". Two more remain (section 7).
- The check script was briefly weakened by an agent to make it pass. It is now strict. **Never edit check_data.py to make a failing check pass; investigate the data instead.**
- An agent got stuck in long chats and claimed tasks done without doing them. **Verify every claim by building and looking at the page.**

---

## 5. Verified results (reference values; the JSON already holds them)

Use these to check what the site shows. Read from JSON for display.

**Data:** 1003/1003 subjects valid; 0 NaN; max asymmetry 0.0; diagonal 0; 100 nodes; 4950 unique pairs; seed 42; settings ID `f1ebb3fdc3` (d = 0.15).

**Densities → edges:** 0.05 → 248, 0.10 → 495, 0.15 → 743, 0.20 → 990, 0.25 → 1238, 0.30 → 1485 (m = floor(d·4950 + 0.5)).

**Descriptive statistics (all 4950 pairs), A / B:** mean 0.3738 / 0.1715; median 0.0734 / −0.0783; variance 76.468 / 59.067; std 8.745 / 7.686; min −32.465 / −35.597; max 49.629 / 46.213; IQR 9.236 / 6.629; skewness 0.530 / 0.550; excess kurtosis 2.137 / 3.431; mean |w| 6.363 / 5.253 (ratio 1.21); share positive 0.505 / 0.495.

**Graph at d = 0.15, A / B:** 743 / 743 edges; mean degree 14.86; negative edges 330 (44.4%) / 351 (47.2%); components 16 / 27; largest component 85 / 74; isolated 15 / 26; avg clustering all 0.4394 / 0.4044; avg clustering lcc 0.5169 / 0.5465; transitivity 0.5163 / 0.5230 (all = lcc); mean strength 47.89 / 27.34; mean strength lcc 56.34 / 36.94; mean |w| of kept edges 17.775 / 16.027.

**Isolated nodes:** A: IC071, IC075, IC078, IC081, IC085, IC086, IC087, IC091, IC092, IC094, IC095, IC097, IC098, IC099, IC100. B: IC067, IC068, IC069, IC071, IC073, IC076, IC077, IC079, IC080, IC081, IC084–IC087, IC089–IC100 (26). Isolated in both: 13. Isolation change counts: neither 72, only B 13, both 13, only A 2.

**BFS/DFS:** common source node 34 (IC035); BFS reaches 85 (A, 5 levels) and 74 (B, 4 levels); DFS reaches the same sets.

**Bellman–Ford:** status negative_cycle for both; undefined 85 (A) / 74 (B); unreachable 15 / 26; finite 0 / 0. Reason: an undirected negative edge u–v makes the cycle u → v → u with cost 2w < 0.

**Comparison at d = 0.15:** 355 edges in both, 388 only A, 388 only B, 3 sign flips, Jaccard 0.314 (355 / 1131).

**Frozen v1 (main pair, 6 densities):** 9 setting-consistent; construction-sensitive = avg_clustering_all, avg_clustering_lcc.

**Post-hoc scale check (C22S):** mean_strength and mean_strength_lcc stay A > B after dividing by each subject's own mean |w|; mean_abs_weight reverses from A > B (raw) to A < B (normalised) at all 6 densities.

**Protocol v2 (C22R; 1% minimum gap; normalised strength/weight; main pair):** setting-consistent = n_components, largest_component_size, n_isolated, mean_strength_norm, mean_strength_lcc_norm, mean_abs_weight_norm (A < B); partially consistent = avg_clustering_all, transitivity_all, transitivity_lcc, share_negative_edges; construction-sensitive = avg_clustering_lcc.

**Replication (C28):** pairs fixed before running (next 8 subject IDs after A and B, paired in order): 100408–100610, 101006–101107, 101309–101915, 102008–102109. v2 setting-consistent counts over 5 pairs: mean_strength_norm 4/5, mean_strength_lcc_norm 4/5, mean_abs_weight_norm 4/5 (v1 raw 5/5), transitivity 3/5, avg_clustering_all 2/5, n_components / largest_component_size / n_isolated 2/5 (sensitive 3/5), share_negative_edges 1/5 (partial 3/5), avg_clustering_lcc 1/5 (sensitive 4/5). Patterns hold at 0.5%, 1% and 2% tolerance. Per-subject scale mean |w| ranges 5.25–9.05.

**Tests (181 checks):** C05T 27, C07T 28, C08T 25, C10 18, C11 9, C18 22, C22R 5, C24 16, C26 21, C27 10 (titles in verification_tests.json). Report export: 51 files (21 tables, 26 figures, report.md, 3 JSON). Environment: Python 3.13.16, NumPy 2.1.3, pandas 2.2.3, NetworkX 3.7, Matplotlib 3.10.0 (Colab).

**Research integrity timeline:** rules frozen 21 Oct 2026 before the multi-density run (isolated-node pattern and d = 0.15 values had been seen and are declared) → sign_agreement bug fixed after the first C22 run (G2L_DIRECTION; labels unchanged) → post-hoc scale check → protocol v2 written after seeing the main pair (shown beside v1) and frozen before the replication pairs ran.

**Team:** Person 1 C01–C11 + C27 (foundation, pipeline); Person 2 C12–C19 + C26 (statistics, metrics, traversal, Bellman–Ford, figures, integration tests); Person 3 C20–C25, C22S, C22R, C28 (comparison, multi-density, report, replication).

---

## 6. Current state of each page (what exists)

- **Home:** title, badges, project statement, 4 headline cards, caveat banner, findings text, navigation cards, GitHub/Colab buttons.
- **Data:** HCP description, validation summary, statistics table, matrix and histogram PNGs.
- **Methods:** pipeline steps, thresholding rule, density table, KaTeX formulas, Bellman–Ford negative-cycle explanation, v1 vs v2 rules, design rules.
- **Single Networks:** network PNGs, interactive Cytoscape network (A/B switch, isolated row, hover), metrics tables, BFS/DFS summary, Bellman–Ford chart.
- **Comparison:** global difference table, overlap counts, interactive overlap network (colours per rule 6), node difference table, degree-strength and weight-difference PNGs.
- **Multi-Density:** v2/v1 toggle, Plotly ΔM(d) chart with per-density 1% band in v2 only, A/B trajectory chart, v1 vs v2 consistency table, post-hoc scale check table, G2L node table, top edges by |ΔP|, G2L PNG selector, heatmap and retention PNGs.
- **Replication:** summary cards, direction note, label grid, tolerance table, structure table.
- **Verification:** test scorecard, environment, provenance and checksum record.
- **Limitations:** 13 caveats, wording rules, integrity timeline.

---

## 7. Inconsistencies still to correct (P0)

1. `src/pages/Home.tsx` (around line 242): "full cryptographic settings tracking" → "settings ID and provenance recorded with every result".
2. `src/pages/VerificationPage.tsx` (around line 127): subtitle "Cryptographic configuration hash" → "Hash of the configuration (settings ID)".
3. Figures `AB_delta_profiles.png` and `AB_values_vs_density.png` are never shown. Add them to Multi-Density (with a note that their titles use frozen v1 labels).
4. Data files loaded nowhere: `replication_labels_v1.json`, `replication_labels_v2.json`, `statistics_nodes.json`. `posthoc_scale_check.json` is fetched but ignored. Use them (section 8).
5. Multi-Density G2L table colours mean delta green/red. Red means positive edge elsewhere: use neutral text with an explicit sign (+/−), or an A-colour/B-colour pair that is not red/blue.
6. Navbar subtitle "Graph-Theoretic • No ML • HCP S1200" wraps awkwardly at laptop width; shorten or hide below 1280 px.
7. Bundle is 5.8 MB (full Plotly). Switch to `plotly.js-basic-dist-min` (or `plotly.js-cartesian-dist-min` if heatmaps are needed) via `react-plotly.js/factory`, and lazy-load pages with `React.lazy` + `Suspense`. Pin versions.
8. README "Project website" section: keep the final URL https://anushadalal.github.io/Brain-Connectome-Analysis/ and add one line that the test deployment is at https://anushadalal2006.github.io/Brain-Connectome-Analysis/. Make sure the README still describes how to regenerate data, run check_data.py and run locally.
9. Search the whole site for every banned word in rule 4 and fix any left.

---

## 8. What to add: "every detail, organised, with many graphs"

All charts: Plotly unless stated; read from JSON; titles state the finding, not the topic; axis titles with units; legends; hover values to 3–4 significant digits; light and dark mode via the theme context; `config={{ responsive: true, displayModeBar: false }}`; each chart has a one-sentence caption saying what to notice. Put wide charts in containers that scroll inside themselves on phones. Reuse one small `ChartCard` component (title, caption, chart, optional "data source: <file>.json" note).

### P0: complete the story (do these first)

**Home**
- A 4-step "what we did" strip: Validate 1003 subjects → Build signed graphs at 6 densities → Compare A vs B and link global to local → Replicate on 4 pairs.
- "Key findings" chart: horizontal bar of v2 setting-consistent count out of 5 per metric (replication_summary.json), sorted, labelled "x of 5", grouped colours by label rule. Caption: robustness depends on the metric.
- Keep the 4 headline cards; card 3 reads "Subject pairs compared: 5".

**Methods**
- Add an SVG diagram of the full pipeline (3 rows: Foundation C01–C11, Analysis C12–C19, Research C20–C28, then Website), each box with its cell number and one line.
- Add an SVG illustration of proportional thresholding: rank 4950 pairs by |w| → keep top m → keep sign.
- Add an SVG of the negative cycle u → v → u (cost 2w < 0) next to the Bellman–Ford text.
- Add a decision diagram for the v1 rule and the v2 rule (all deltas same sign? any negligible? both signs?).
- Add a table: algorithm, data structure, time complexity (BFS queue O(V+E); DFS stack O(V+E); Bellman–Ford O(V·E); graph build O(E log E) for sorting 4950 pairs; binary clustering; transitivity = 3 × triangles / connected triples).

**Multi-Density**
- Small multiples: an 11-panel grid (one mini chart per metric) of ΔM(d) across densities, v2 values in v2 view, v1 in v1 view, zero line, 1% band in v2 only, panel subtitle = label. This is the single most important research figure.
- Consistency strip: a metrics × densities heatmap of sign(ΔM) (+, −, negligible) under v2, text in each cell.
- Scale-check chart from `posthoc_scale_check.json`: mean_abs_weight raw ΔM vs normalised ΔM across densities on one chart (two lines) showing the reversal.
- G2L bar chart for the selected metric: top 10 nodes, mean delta (A − B), with sign agreement in hover.
- Interactive retention: histogram of ΔP for edges kept at least once (multi_setting_retention.json) and a P_A vs P_B jittered scatter with counts.
- Add the two unused PNGs (item 7.3).

### P1: depth per page

**Data**
- Statistics comparison chart: grouped bars A vs B for mean, median, std, IQR, skewness, excess kurtosis, mean |w| (statistics_global.json); separate small panels where scales differ.
- Node-level chart from `statistics_nodes.json`: mean |w| per node for A and B (100 nodes, line or bar), noting IC067–IC100 are the most weakly connected.
- Share positive / negative pairs bar.

**Single Networks**
- Degree distribution histograms A and B (metrics_nodes.json), same bins, overlaid or side by side.
- Signed strength distribution A and B.
- Clustering vs degree scatter per subject.
- Positive vs negative edge count per node (stacked bars, red/blue per rule 6), sortable by node.
- Component sizes bar (largest component + singletons) per subject, computed from component_id.
- Isolated-node list as chips for A and B, with "isolated in both" highlighted.
- Bellman–Ford status stacked bar (undefined / unreachable / finite) from shortest_path_summary.json (interactive, in addition to the PNG).

**Comparison**
- Global differences chart: for each of the 11 metrics, A and B side by side, normalised per metric (A/B relative to their mean) so they share an axis; mark scale-dependent metrics.
- Node degree A vs B scatter (comparison_nodes_d015.json) with the y = x line; hover node label; highlight the top 10 |d_degree| nodes.
- Top 20 nodes by |d_degree| as a diverging bar.
- Isolation change counts bar (neither 72, only B 13, both 13, only A 2).
- Edge overlap stacked bar (both / only A / only B) plus the 3 sign flips listed by node labels.

**Replication**
- Label heatmap: metrics (rows) × 5 pairs (columns), cell colour by v2 label with the text inside.
- Grouped bar: v1 vs v2 setting-consistent counts per metric (shows where v1 overstated).
- Tolerance chart: for each metric, consistent counts at 0.5%, 1%, 2%.
- Per-pair detail table from replication_labels_v2.json (n_pos, n_neg, n_small) with a pair selector; v1 labels from replication_labels_v1.json beside them.
- Structure across pairs: isolated nodes A/B per pair and per-subject scale mean |w| per pair (shows why normalisation is needed: 5.25 to 9.05).

**Verification**
- Bar chart of checks per test cell (total 181) with titles in hover.
- "How we know it's correct" list: tests, integration scan for Dijkstra / 1/w, one-call pipeline reproduces results, reruns identical, check_data.py on the site data.

### P2: new pages for completeness (only after P0 and P1 build and look right)

- **Notebook walkthrough** (`#/notebook`): table of every cell C01–C28 (incl. C05T, C07T, C08T, C22S, C22R and the commented S3 cells) with what it does, key functions/variables and owner (use section 5 team split; cell details from the notebook headers). Link each cell group to the page that shows its results.
- **Glossary** (`#/glossary`): ICA component, netmats1, r-to-Z, proportional density, degree, signed strength, clustering, transitivity, component, isolated node, BFS, DFS, Bellman–Ford, negative cycle, ΔM(d), S_M, setting-consistent, partially consistent, construction-sensitive, retention P(e), ΔP, global-to-local, sign agreement, settings ID.
- **FAQ / viva** (`#/faq`): concise answers to: why no ML; why keep negative edges; why proportional thresholding; why 6 densities; why Bellman–Ford not Dijkstra; why all paths undefined; why not 1/w; what setting-consistent means; why protocol v2; what global-to-local shows; how correctness was verified; why a static website (HCP terms).

Add new pages to the navbar (keep it tidy: group under a "More" menu if it gets crowded) and the footer.

---

## 9. Quality gates (run after every task, and before every commit)

1. `python website/scripts/check_data.py` → `ALL CHECKS PASSED` (only if public/data changed; never edit the checks to pass).
2. `cd website && npm run build` → no errors.
3. `npm run preview`, open http://localhost:4173/Brain-Connectome-Analysis/ and check every page at 1366 px and 390 px wide, light and dark mode: no sideways page scroll, charts render, figures load, no console errors except blocked web fonts.
4. Search for banned words (rule 4) and for `w_A|w_B|d_w|max_abs_w` in `website/src` and `website/public/data`.
5. No hard-coded result numbers added.
6. Small commits with clear messages; push to `main` only when asked. The GitHub Actions deploy runs on push.

## 10. Do not

- Do not edit the notebook, `check_data.py` checks, or anything in `site_data/`.
- Do not run `build_data.py` unless `site_data/` exists locally; if you change build_data.py, regenerate and re-run check_data.py.
- Do not add a backend, analytics, trackers or external data calls.
- Do not invent numbers, metrics or results not in the JSON or section 5.
- Do not remove the frozen v1 results, the caveats or the integrity timeline.
