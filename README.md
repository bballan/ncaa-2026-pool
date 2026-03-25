# Scenario viewer

Static site to explore NCAA pool scenario points: compare brackets, filter by game outcomes, and drill into place odds.

**Live site:** whatever URL GitHub Pages gives this repo (Settings → Pages).

## Update data

From a `*_scenario_pts_*.csv` produced by your pool pipeline:

```bash
python3 scripts/prepare_viewer_data.py /path/to/scenario_pts.csv
```

Add the must-win bundle (optional but needed for the **Must-win games** tab on the static site):

```bash
python3 scripts/prepare_viewer_data.py /path/to/scenario_pts.csv --critical-path /path/to/run_critical_path_*.csv
```

That writes `scenario-viewer/public/data/scenarios.csv.gz` and, when `--critical-path` is passed, `critical_path.csv.gz`. Commit those files and push; CI redeploys.

## Local dev

```bash
cd scenario-viewer
npm install
npm run dev
```

If a sibling folder `../output/2026/` exists with `*_scenario_pts_*.csv`, dev mode can load it automatically; otherwise rely on `public/data/scenarios.csv.gz` or add `?mock=1` for sample data.

## Deploy

GitHub Actions workflow **Deploy scenario viewer** builds on push to `main` or `master`. Enable Pages once: **Settings → Pages → Source: GitHub Actions**.
