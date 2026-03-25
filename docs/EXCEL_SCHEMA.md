# `bracket_picks.xlsx` expected layout

Place the workbook at the repo root as `bracket_picks.xlsx`, or set `picks_path` in your config to an absolute path.

## Option A: Two sheets (recommended)

### Sheet `Picks` (name configurable)

| Bracket Name | R32-1 | R32-2 | … | Champ |
|--------------|-------|-------|---|-------|
| Alice        | 1 Foo | …     | … | …     |
| Bob          | …     | …     | … | …     |

- Row 1 is the header row.
- Column A is the pool entry name (`bracket_name_column`).
- Remaining columns are the **63** game slots in canonical order (see `pool/slots.py` / `config.example.yaml`). Headers must match those ids unless you supply `column_map`.

### Sheet `Master` (name configurable)

| Bracket Name | R32-1 | … | Champ |
|--------------|-------|---|-------|
| Master       | `1 Duke` / team string / `-1` if unknown | … | … |
| Points       | numeric points per correct pick per slot | … | … |
| Seed         | seed bonus per slot (use `-1` if N/A), same shape as 2019 `masterbracket*.csv` | … | … |

- First column holds row labels `Master`, `Points`, `Seed` (`master_label_column`).
- Team cells should match pick strings (e.g. `1 Duke`) so equality scoring matches the legacy CSV pipeline.

## Option B: One sheet

If `sheet_master` is omitted, the loader scans the picks sheet for rows whose first cell is `Master`, `Points`, or `Seed` (case-sensitive) and treats them as master rows; all other rows with a non-empty bracket name are picks.

## Column rename map

If your export uses different headers (e.g. `Round1-1`), add entries under `column_map` in `config.yaml` mapping **export header → canonical id** (e.g. `R32-1`).

## Undecided games

Use `-1` in the **Master** row for games not yet decided, consistent with the 2019 CSVs. The chosen **stage** (`elite8`, `final4`) must match how many games are still branching in the legacy scenario scripts.
