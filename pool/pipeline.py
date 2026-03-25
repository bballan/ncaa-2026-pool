from __future__ import annotations

from pathlib import Path

import pandas as pd

from pool.config_loader import PoolConfig
from pool.load import load_inputs
from pool.ranks_critical import (
    critical_path_rows,
    default_podium,
    ranks_from_scenarios,
    write_critical_path_csv,
)
from pool.scenarios import (
    build_scenarios_dataframe,
    expected_unknown_for_stage,
    scenario_score_columns,
)
from pool.slots import SLOTS_SCENARIO_OUTCOME


def run_pipeline(cfg: PoolConfig, verbose: bool = False) -> dict[str, Path]:
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
                "Set expected_unknown_slots in config to override."
            )

    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    prefix = cfg.output_prefix
    stage_tag = cfg.stage

    scenarios_df = build_scenarios_dataframe(picks, master, cfg.stage)
    scen_path = cfg.output_dir / f"{prefix}_scenario_pts_{stage_tag}.csv"
    scenarios_df.to_csv(scen_path, index=False, encoding="utf-8")

    output_ranks, critgames, ranks_only = ranks_from_scenarios(scenarios_df, n_game_cols=len(SLOTS_SCENARIO_OUTCOME))
    ranks_path = cfg.output_dir / f"{prefix}_output_ranks_{stage_tag}.csv"
    crit_path = cfg.output_dir / f"{prefix}_critgames_{stage_tag}.csv"
    output_ranks.to_csv(ranks_path, encoding="utf-8")
    critgames.to_csv(crit_path, index=False, encoding="utf-8")

    podium = cfg.podium if cfg.podium is not None else default_podium(ranks_only)
    game_cols = list(SLOTS_SCENARIO_OUTCOME)
    entry_cols = scenario_score_columns(scenarios_df, len(SLOTS_SCENARIO_OUTCOME))
    cp_rows = critical_path_rows(
        critgames,
        entry_cols,
        n_game_cols=len(game_cols),
        podium=podium,
    )
    crit_out = cfg.output_dir / f"{prefix}_critical_path_{stage_tag}.csv"
    write_critical_path_csv(crit_out, len(game_cols), cp_rows, game_cols)

    if verbose:
        print("Scenarios:", scen_path)
        print("Ranks summary:", ranks_path)
        print("Critgames:", crit_path)
        print("Critical path:", crit_out)

    return {
        "scenarios": scen_path,
        "output_ranks": ranks_path,
        "critgames": crit_path,
        "critical_path": crit_out,
    }


def inspect_excel(path: Path, sheet_picks: str, sheet_master: str | None) -> None:
    xl = pd.ExcelFile(path, engine="openpyxl")
    print("Sheets:", xl.sheet_names)
    p = pd.read_excel(path, sheet_name=sheet_picks, header=0, nrows=5, engine="openpyxl")
    print(f"\n--- {sheet_picks} (first 5 rows) ---")
    print("Columns:", list(p.columns)[:20], "... total", len(p.columns))
    print(p.head())
    if sheet_master and sheet_master in xl.sheet_names:
        m = pd.read_excel(path, sheet_name=sheet_master, header=0, nrows=5, engine="openpyxl")
        print(f"\n--- {sheet_master} (first 5 rows) ---")
        print(m.head())
