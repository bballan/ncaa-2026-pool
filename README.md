# 2026 NCAA pool analysis

Python 3 port of the [`2019/`](2019/) scenario, ranking, and critical-games scripts. Reads **`bracket_picks.xlsx`** (or CSV) plus a **Master / Points / Seed** grid, enumerates remaining outcomes (`elite8` or `final4`), and writes CSVs under `output/2026/`.

## Setup

```bash
cd "/Users/brianballan/Library/CloudStorage/Dropbox/NCAA/2026"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configure

Copy [`config.example.yaml`](config.example.yaml) to `config.yaml`, set `picks_path`, sheet names, and `stage` (`elite8` or `final4`). See [`docs/EXCEL_SCHEMA.md`](docs/EXCEL_SCHEMA.md) for workbook layout.

## Run

```bash
python -m pool run --config config.yaml -v
```

### CSV mode (matches 2019 files)

```bash
python -m pool run \
  --picks-csv 2019/picks2019worldsbest.csv \
  --master-csv 2019/masterbracket8teams.csv \
  --stage elite8 \
  --output-dir output/2026 \
  --output-prefix regression_elite8
```

```bash
python -m pool run \
  --picks-csv 2019/picks2019worldsbest.csv \
  --master-csv 2019/masterbracket4teams.csv \
  --stage final4 \
  --output-prefix regression_final4
```

### Inspect an Excel file

```bash
python -m pool inspect path/to/bracket_picks.xlsx
```

## Outputs

| File | Description |
|------|-------------|
| `*_scenario_pts_<stage>.csv` | Each row: 15 game outcomes (EE1–Champ) + one score column per entry |
| `*_output_ranks_<stage>.csv` | Rank frequency counts per entry |
| `*_critgames_<stage>.csv` | Game outcomes + per-scenario ranks |
| `*_critical_path_<stage>.csv` | For each entry and finishing rank, which remaining games are fixed |

## Scenario viewer (web UI)

Static React app under [`scenario-viewer/`](scenario-viewer/) shows the full scenario-points table: pick any subset of bracket columns to compare, filter rows by Elite&nbsp;8 through champion winners, and open a game to see winner frequencies plus a focused scenario’s full path.

1. **Prepare data** (gzip keeps the download small enough for free static hosting):

   ```bash
   python3 scripts/prepare_viewer_data.py output/2026/your_prefix_scenario_pts_s16_elite8.csv
   ```

2. **Run locally**:

   ```bash
   cd scenario-viewer && npm install && npm run dev
   ```

   With `npm run dev`, the app loads the **newest** `*_scenario_pts_*.csv` from `output/2026/` automatically (no need to run `prepare_viewer_data.py` first). Use `?mock=1` if you want the small sample dataset instead.

3. **Deploy to GitHub Pages** (workflow: [`.github/workflows/scenario-viewer-pages.yml`](.github/workflows/scenario-viewer-pages.yml)):

   1. Put data in the repo for the static build: run `python3 scripts/prepare_viewer_data.py …` so `scenario-viewer/public/data/scenarios.csv.gz` exists (this file is committed; raw `output/**/*.csv` is gitignored as too large).
   2. Create a new repository on GitHub (empty, no README required).
   3. From this project root:

      ```bash
      git init -b main
      git add .
      git commit -m "Initial commit: pool tools and scenario viewer"
      git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
      git push -u origin main
      ```

   4. Turn on Pages for Actions (one-time per repo). Either:
      - **Settings → Pages → Build and deployment → Source: GitHub Actions**, or  
      - `gh api -X POST repos/YOUR_USER/YOUR_REPO/pages -f build_type=workflow`
   5. Open **Actions** and confirm **Deploy scenario viewer** succeeds (re-run the workflow if the first deploy failed with “Ensure GitHub Pages has been enabled”). The site will be at `https://YOUR_USER.github.io/YOUR_REPO/`.

   On each push to `main` or `master`, CI rebuilds and redeploys. You can also run the workflow manually (**Actions → Deploy scenario viewer → Run workflow**).

   **Alternatives:** [Cloudflare Pages](https://pages.cloudflare.com/) or [Netlify](https://www.netlify.com/) — upload `scenario-viewer/dist` after `npm run build`.

   Published viewer for this project: [bballan.github.io/ncaa-2026-pool](https://bballan.github.io/ncaa-2026-pool/).

Use `?mock=1` on the URL to load a tiny mock dataset without CSV files.

## Pairwise pick agreement (matrix)

For every pair of brackets, count how many of the 63 games they picked the same (exact team string after trim). Row and column labels are entry names; the diagonal is always **63**.

```bash
python -m pool compare --picks-csv 2019/picks2019worldsbest.csv \
  -o output/2026/pick_agreement_matrix.csv
```

With Excel and a combined picks+master sheet, add `--single-sheet`. With `config.yaml` that only needs picks loading, `python -m pool compare --config config.yaml -o output/2026/matrix.csv` works if `picks_csv_path` or `picks_path` is set.

## Tests

```bash
pip install pytest
pytest tests/
```
