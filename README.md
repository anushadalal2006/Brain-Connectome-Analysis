# Brain Connectome Visualization and Analysis System

A graph-based system for analysing brain connectivity without machine learning. Brain network nodes are connected by signed, weighted edges. Statistical and graph-theoretic methods are used to visualise, analyse and compare connectivity networks.

## Data

- **Source:** Human Connectome Project (HCP) Young Adult S1200, PTN release (1003 subjects), group-ICA 100 components, `netmats1` (full correlation, r-to-Z statistics).
- **Not included in this repository.** HCP data must be obtained from [ConnectomeDB](https://db.humanconnectome.org) after accepting the HCP Open Access Data Use Terms.
- The notebook expects the files in `MyDrive/HCP_PTN1200` on Google Drive. See the "Data acquisition" cell in the notebook.
- Nodes are ICA components, not anatomical parcels.

## How to run

1. Open `Brain_Connectome_Analysis.ipynb` in Google Colab.
2. Place the HCP PTN files in `MyDrive/HCP_PTN1200`.
3. Choose Runtime → Run all, and allow Google Drive access when asked.

Outputs (report, tables, figures, provenance) are written to `MyDrive/connectome_outputs/`. The source data is never overwritten.

## What the notebook does

| Cells | Modules |
|---|---|
| C01–C03 | Setup, configuration, shared data contracts and result store |
| C04–C11 | Data import and validation, preprocessing, signed weighted graph construction (proportional density) |
| C12–C19 | Descriptive statistics, graph metrics, BFS/DFS, Bellman–Ford with negative-cycle detection, single-network figures |
| C20–C25 | Pairwise comparison, multi-density analysis linking global differences to node and edge changes, comparison figures, report export |
| C22S, C22R | Post-hoc scale check, and revised protocol v2 (scale-free metrics, 1% minimum gap), reported next to the frozen v1 rule |
| C26 | Integration tests |
| C27 | `run_pipeline()` one-call pipeline |
| C28 | Replication on 4 pre-specified subject pairs |

Test cells (C05T, C07T, C08T, C10, C11, C18, C24, C26, C27) check every module. The saved notebook shows a full clean run with all tests passing.

## Design rules

- No Dijkstra and no `1/w` conversion of weights.
- Negative weights are kept.
- Shortest paths are reported as undefined when a reachable negative cycle exists.
- Both networks are always built with identical settings.
- Every result records its settings and provenance.

## Main result (descriptive)

Whether a difference between two individuals survives different density choices depends strongly on the metric. Across 5 pre-specified subject pairs:

- **Most stable:** normalised strength and normalised mean |w| (setting-consistent in 4 of 5 pairs).
- **Mostly stable:** transitivity (3 of 5).
- **Usually density-dependent:** average clustering of the largest component (construction-sensitive in 4 of 5).
- **Not stable in general:** fragmentation measures (number of components, largest component size, isolated nodes; consistent in 2 of 5).

A raw-weight finding under the frozen v1 rule turned out to be a per-subject scale effect, which is why protocol v2 was added.

These results are descriptive: five pairs, no significance testing.

## Project website

An interactive, multi-page static presentation website for this project is available in [`website/`](./website/) and is deployed to GitHub Pages at:
**[https://anushadalal.github.io/Brain-Connectome-Analysis/](https://anushadalal.github.io/Brain-Connectome-Analysis/)**

The test deployment is at [https://anushadalal2006.github.io/Brain-Connectome-Analysis/](https://anushadalal2006.github.io/Brain-Connectome-Analysis/).

The site features interactive Cytoscape network views at $d = 0.15$, interactive Plotly multi-density charts with dynamic 1% tolerance bands, sortable node difference tables, replication grids across 5 pairs, and the full 181-test verification scorecard.

### HCP Open Access Compliance
In strict compliance with the **HCP Open Access Data Use Terms**, raw connectivity values (per-edge weights of A and B, or their differences) are never published or committed. The data pipeline drops all raw weights before generating public JSON files; only derived graph structures, signs, and normalized statistics are retained.

### How to build and run the website locally

The site reads only the committed files in `website/public/data/*.json` and `website/public/figures/*.png`, so you can run it without the HCP data.

```bash
cd website
npm ci
npm run dev        # development server
npm run build      # production build into website/dist/
npm run preview    # serve the build at http://localhost:4173/Brain-Connectome-Analysis/
```

### How to regenerate the site data (owner only)

`build_data.py` needs `site_data/` (notebook outputs: `site_data/run_*/` and `site_data/replication_*/`). That folder is HCP-derived, is git-ignored and exists only on the owner's machine. Never run the script without it, and never run it in GitHub Actions.

```bash
python website/scripts/build_data.py    # site_data/ -> website/public/data/*.json and public/figures/*.png
python website/scripts/check_data.py    # must print ALL CHECKS PASSED before committing
```

`check_data.py` verifies every key number against the notebook results and checks that no raw weight fields are published. Run it after any change to `website/public/data/`.
