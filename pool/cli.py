from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from pool.compare_matrix import pick_agreement_matrix
from pool.config_loader import PoolConfig, load_config
from pool.load import load_picks_only
from pool.pipeline import inspect_excel, run_pipeline


def _cmd_run(ns: argparse.Namespace) -> None:
    if ns.config:
        cfg = load_config(Path(ns.config))
    else:
        cfg = PoolConfig(
            picks_path=Path(ns.picks).resolve(),
            sheet_picks=ns.sheet_picks,
            sheet_master=ns.sheet_master,
            stage=ns.stage,
            output_dir=Path(ns.output_dir).resolve(),
            output_prefix=ns.output_prefix,
            picks_csv_path=Path(ns.picks_csv).resolve() if ns.picks_csv else None,
            master_csv_path=Path(ns.master_csv).resolve() if ns.master_csv else None,
        )
    if ns.verbose:
        cfg.output_dir.mkdir(parents=True, exist_ok=True)
    paths = run_pipeline(cfg, verbose=ns.verbose)
    if not ns.verbose:
        for k, p in paths.items():
            print(f"{k}: {p}")


def _cmd_inspect(ns: argparse.Namespace) -> None:
    path = Path(ns.path).resolve()
    inspect_excel(path, ns.sheet_picks, ns.sheet_master)


def _cmd_compare(ns: argparse.Namespace) -> None:
    if ns.config:
        cfg = load_config(Path(ns.config))
    else:
        sm = None if ns.single_sheet else ns.sheet_master
        cfg = PoolConfig(
            picks_path=Path(ns.picks).resolve(),
            sheet_picks=ns.sheet_picks,
            sheet_master=sm,
            picks_csv_path=Path(ns.picks_csv).resolve() if ns.picks_csv else None,
            master_csv_path=None,
        )
    picks = load_picks_only(cfg)
    mat = pick_agreement_matrix(picks)
    out = Path(ns.output).resolve() if ns.output else None
    if out:
        out.parent.mkdir(parents=True, exist_ok=True)
        mat.to_csv(out, encoding="utf-8")
        print(out)
    else:
        with pd.option_context("display.max_rows", 20, "display.max_columns", 10):
            print(mat)


def main() -> None:
    p = argparse.ArgumentParser(description="NCAA pool scenario / ranks / critical path")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="Run full pipeline")
    r.add_argument("--config", "-c", help="YAML config path")
    r.add_argument("--picks", default="bracket_picks.xlsx", help="Excel picks path (if no config)")
    r.add_argument("--sheet-picks", default="Picks")
    r.add_argument("--sheet-master", default="Master")
    r.add_argument(
        "--stage",
        choices=("elite8", "final4", "s16_elite8"),
        default="elite8",
        help="s16_elite8 = Sweet 16 through championship (15 unknowns after Round of 32)",
    )
    r.add_argument("--output-dir", default="output/2026")
    r.add_argument("--output-prefix", default="run")
    r.add_argument("--picks-csv", help="Use CSV picks + --master-csv instead of Excel")
    r.add_argument("--master-csv", help="Master CSV (Master/Points/Seed rows)")
    r.add_argument("-v", "--verbose", action="store_true")
    r.set_defaults(func=_cmd_run)

    i = sub.add_parser("inspect", help="Print Excel sheet names and sample headers")
    i.add_argument("path", help="Path to .xlsx")
    i.add_argument("--sheet-picks", default="Picks")
    i.add_argument("--sheet-master", default="Master")
    i.set_defaults(func=_cmd_inspect)

    c = sub.add_parser(
        "compare",
        help="Matrix of how many of 63 games each pair of brackets match (diagonal = 63)",
    )
    c.add_argument("--config", "-c", help="YAML config path")
    c.add_argument("--picks", default="bracket_picks.xlsx")
    c.add_argument("--sheet-picks", default="Picks")
    c.add_argument("--sheet-master", default="Master", help="Separate master sheet name (Excel)")
    c.add_argument(
        "--single-sheet",
        action="store_true",
        help="Excel: Master/Points/Seed rows live on the picks sheet (no separate master sheet)",
    )
    c.add_argument("--picks-csv", help="CSV picks (index or Bracket Name column)")
    c.add_argument(
        "-o",
        "--output",
        help="Write square CSV (row/column = entry names); omit to print a sample to stdout",
    )
    c.set_defaults(func=_cmd_compare)

    ns = p.parse_args()
    ns.func(ns)


if __name__ == "__main__":
    main()
