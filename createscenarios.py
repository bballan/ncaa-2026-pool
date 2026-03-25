"""
Enumerate scenario outcomes (elite8, final4, or s16_elite8) and score pool entries.

Reads picks from bracket_picks.xlsx (and Master/Points/Seed from the same file
or from master_csv_path in config) using the same rules as `python -m pool run`.
Prefer config.yaml or config.bracket_picks.yaml beside this script for sheet
names, column_map, and optional master_csv_path when the workbook is picks-only.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from pool.config_loader import PoolConfig, load_config
from pool.load import load_inputs
from pool.scenarios import build_scenarios_dataframe, expected_unknown_for_stage
from pool.slots import SLOTS_SCENARIO_OUTCOME


def _default_config_path() -> Path | None:
    for name in ("config.yaml", "config.bracket_picks.yaml"):
        p = _ROOT / name
        if p.is_file():
            return p
    return None


def _resolve_cfg(ns: argparse.Namespace) -> PoolConfig:
    if ns.config:
        return load_config(Path(ns.config).resolve())
    auto = _default_config_path()
    if auto:
        return load_config(auto)
    picks = Path(ns.picks)
    if not picks.is_absolute():
        picks = (_ROOT / picks).resolve()
    out_dir = Path(ns.output_dir)
    if not out_dir.is_absolute():
        out_dir = (_ROOT / out_dir).resolve()
    else:
        out_dir = out_dir.resolve()
    return PoolConfig(
        picks_path=picks,
        sheet_picks=ns.sheet_picks,
        sheet_master=None if ns.single_sheet else ns.sheet_master,
        stage=ns.stage,
        output_dir=out_dir,
        output_prefix=ns.output_prefix,
        bracket_name_column=ns.bracket_name_column,
        master_label_column=ns.master_label_column,
    )


def main() -> None:
    p = argparse.ArgumentParser(description="Build scenario points CSV from bracket_picks.xlsx")
    p.add_argument("--config", "-c", help="YAML config (default: config.yaml or config.bracket_picks.yaml beside this script)")
    p.add_argument("--picks", default="bracket_picks.xlsx", help="Excel path when no config file exists")
    p.add_argument("--sheet-picks", default="Picks")
    p.add_argument("--sheet-master", default="Master")
    p.add_argument(
        "--single-sheet",
        action="store_true",
        help="Master/Points/Seed rows are on the picks sheet (no separate master sheet)",
    )
    p.add_argument(
        "--stage",
        choices=("elite8", "final4", "s16_elite8"),
        default="elite8",
        help="s16_elite8: 15 branches after Round of 32 (Sweet 16 → title)",
    )
    p.add_argument("--output-dir", default="output/2026")
    p.add_argument("--output-prefix", default="run")
    p.add_argument("-o", "--output", help="Scenario CSV path (default: output-dir / prefix_scenario_pts_stage.csv)")
    p.add_argument("--bracket-name-column", default="Bracket Name")
    p.add_argument("--master-label-column", default="Bracket Name")
    ns = p.parse_args()

    cfg = _resolve_cfg(ns)
    if not cfg.picks_path.exists():
        raise SystemExit(f"Picks file not found: {cfg.picks_path}")

    picks, master = load_inputs(cfg)
    picks.validate_columns(master.slots)

    if cfg.expected_unknown_slots is not None:
        if master.unknown_count() != cfg.expected_unknown_slots:
            raise ValueError(
                f"expected_unknown_slots={cfg.expected_unknown_slots} but master has {master.unknown_count()}"
            )
    else:
        exp = expected_unknown_for_stage(cfg.stage)
        if exp >= 0 and master.unknown_count() != exp:
            raise ValueError(
                f"Master has {master.unknown_count()} unknown (-1) slots; stage {cfg.stage!r} expects {exp}. "
                "Fix the Master row or set expected_unknown_slots in your config."
            )

    out_dir = cfg.output_dir
    if not out_dir.is_absolute():
        out_dir = (_ROOT / out_dir).resolve()
    else:
        out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if ns.output:
        out_path = Path(ns.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
    else:
        out_path = out_dir / f"{cfg.output_prefix}_scenario_pts_{cfg.stage}.csv"

    df = build_scenarios_dataframe(picks, master, cfg.stage)
    df.to_csv(out_path, index=False, encoding="utf-8")
    print(out_path)
    print(f"rows={len(df)} scenarios, game_cols={len(SLOTS_SCENARIO_OUTCOME)}, entries={len(picks.frame.index)}")


if __name__ == "__main__":
    main()
