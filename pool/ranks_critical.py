from __future__ import annotations

import csv
from pathlib import Path

import numpy as np
import pandas as pd

from pool.scenarios import scenario_score_columns


def ranks_from_scenarios(scenarios: pd.DataFrame, n_game_cols: int = 15) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    scenarios: first n_game_cols columns = game outcomes; then entry score columns
    (optional trailing columns named with SCENARIO_RANK_COLUMN_SUFFIX are ignored here).
    Returns (rank_counts_df, critgames_df, ranks_only_df).
    """
    game_cols = list(scenarios.columns[:n_game_cols])
    entry_cols = scenario_score_columns(scenarios, n_game_cols)
    if not entry_cols:
        raise ValueError("No entry score columns after game columns")

    scores = scenarios[entry_cols]
    dfrank = scores.T.rank(ascending=False, method="min")
    ranks = dfrank.T

    ranklist: dict[str, pd.Series] = {}
    for col in ranks.columns:
        ranklist[col] = ranks[col].value_counts()
    output_ranks = pd.DataFrame(ranklist).fillna(0).sort_index()

    gamesremaining = scenarios[game_cols].copy()
    critgames = pd.concat([gamesremaining.reset_index(drop=True), ranks.reset_index(drop=True)], axis=1)
    return output_ranks, critgames, ranks


def default_podium(ranks: pd.DataFrame) -> list[float]:
    """Unique rank values that appear in the matrix, sorted."""
    vals = np.unique(ranks.to_numpy(dtype=float).ravel())
    return sorted(float(x) for x in vals.tolist())


def critical_path_rows(
    critgames: pd.DataFrame,
    entry_names: list[str],
    n_game_cols: int,
    podium: list[float],
) -> list[list]:
    """
    critgames: game columns first (same order as scenarios), then rank columns per entry.
    entry_names must match rank column names.
    """
    game_cols = list(critgames.columns[:n_game_cols])
    rows_out: list[list] = []
    for place in podium:
        for entry in entry_names:
            if entry not in critgames.columns:
                continue
            subset = critgames[critgames[entry] == place]
            if subset.empty:
                continue
            row: list = [entry, place]
            for c in game_cols:
                col = subset[c]
                vc = col.value_counts()
                if len(vc) == 1 and vc.iloc[0] == len(subset):
                    row.append(col.iloc[0])
                else:
                    row.append(" ")
            rows_out.append(row)
    return rows_out


def write_critical_path_csv(path: Path, n_game_cols: int, rows: list[list], game_cols: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    header = ["Entry", "Finishing Position"] + game_cols
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        w.writerow(header)
        for r in rows:
            w.writerow(r)
