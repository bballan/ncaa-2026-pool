from __future__ import annotations

import itertools

import numpy as np
import pandas as pd

from pool.models import MasterState, PicksTable, ScenarioRow, is_unknown_cell
from pool.slots import SLOTS_SCENARIO_OUTCOME, SLOT_ORDER

# Suffix for per-scenario rank columns in scenario CSVs (after score columns).
SCENARIO_RANK_COLUMN_SUFFIX = " [rank]"


def scenario_score_columns(scenarios: pd.DataFrame, n_game_cols: int = 15) -> list[str]:
    """Entry point columns only (excludes trailing rank columns)."""
    return [
        c
        for c in scenarios.columns[n_game_cols:]
        if not str(c).endswith(SCENARIO_RANK_COLUMN_SUFFIX)
    ]


def unique_entry_column_labels(index: pd.Index) -> list[str]:
    """
    Stable unique CSV column names for pool entries. Duplicate Entry Name rows
    (same string index) become 'Name (2)', 'Name (3)', … so scores never merge.
    """
    seen: dict[str, int] = {}
    out: list[str] = []
    for raw in index:
        s = str(raw)
        n = seen.get(s, 0)
        seen[s] = n + 1
        if n == 0:
            out.append(s)
        else:
            out.append(f"{s} ({n + 1})")
    return out


def _full_outcome_list(master: MasterState) -> list[str]:
    return [str(master.outcomes[s]).strip() if not is_unknown_cell(master.outcomes.get(s)) else "-1" for s in SLOT_ORDER]


def apply_sweet16_scenario(full: list[str], scenario: tuple[int, ...]) -> None:
    """Mutate `full` (len 63). scenario: 8 bits; each picks SS winner for one regional semi."""
    if len(scenario) != 8:
        raise ValueError("sweet16 branch requires scenario tuple of length 8")
    # SS1..SS16 at indices 32..47 feed EE1..EE8 at 48..55 (pairs per region, top/bot).
    feeders = (
        (32, 33),
        (34, 35),
        (36, 37),
        (38, 39),
        (40, 41),
        (42, 43),
        (44, 45),
        (46, 47),
    )
    for i, (a, b) in enumerate(feeders):
        full[48 + i] = full[a if scenario[i] == 0 else b]


def apply_elite8_scenario(full: list[str], scenario: tuple[int, ...]) -> None:
    """Mutate `full` (len 63) in place. scenario: 7 bits for FF→championship."""
    if len(scenario) != 7:
        raise ValueError("elite8 requires scenario tuple of length 7")
    full[56] = full[56 - scenario[0] - 7]
    full[57] = full[56 - scenario[1] - 5]
    full[58] = full[56 - scenario[2] - 3]
    full[59] = full[56 - scenario[3] - 1]
    full[60] = full[60 - scenario[4] - 3]
    full[61] = full[60 - scenario[5] - 1]
    full[62] = full[62 - scenario[6] - 1]


def apply_final4_scenario(full: list[str], scenario: tuple[int, ...]) -> None:
    """Mutate `full` (len 63). scenario: 3 bits for semis + championship."""
    if len(scenario) != 3:
        raise ValueError("final4 requires scenario tuple of length 3")
    full[60] = full[60 - scenario[0] - 3]
    full[61] = full[60 - scenario[1] - 1]
    full[62] = full[62 - scenario[2] - 1]


def seed_from_team_label(team: str) -> float:
    if is_unknown_cell(team) or str(team).strip() == "-1":
        return 0.0
    parts = str(team).strip().split(None, 1)
    if not parts or not parts[0].isdigit():
        return 0.0
    return float(int(parts[0]))


def _seed_array_for_tail(full: list[str], master: MasterState) -> np.ndarray:
    """Length 63 seed bonuses; last 15 overwritten from outcome team labels."""
    arr = np.array([master.seed_bonus[s] for s in SLOT_ORDER], dtype=float)
    for i in range(15):
        pos = 48 + i
        arr[pos] = seed_from_team_label(full[pos])
    return arr


def _points_array(master: MasterState) -> np.ndarray:
    return np.array([master.points[s] for s in SLOT_ORDER], dtype=float)


def score_entries(
    picks: PicksTable,
    full: list[str],
    master: MasterState,
    *,
    _pick_matrix: np.ndarray | None = None,
    _entry_labels: list[str] | None = None,
) -> dict[str, float]:
    pointa = _points_array(master)
    seeda = _seed_array_for_tail(full, master)
    if _pick_matrix is None:
        M = picks.frame[list(SLOT_ORDER)].to_numpy(dtype=object)
    else:
        M = _pick_matrix
    labels = _entry_labels
    if labels is None:
        labels = unique_entry_column_labels(picks.frame.index)
    if len(labels) != len(M):
        raise ValueError("entry labels length must match pick matrix rows")
    o = np.array(full, dtype=object)
    match = (M == o).astype(np.float64)
    totals = match @ pointa + match @ seeda
    return {labels[i]: float(totals[i]) for i in range(len(labels))}


def enumerate_scenarios(stage: str, master: MasterState) -> Iterator[tuple[tuple[int, ...], list[str]]]:
    full0 = _full_outcome_list(master)
    if stage == "elite8":
        for bits in itertools.product((0, 1), repeat=7):
            full = list(full0)
            apply_elite8_scenario(full, bits)
            yield bits, full
    elif stage == "final4":
        for bits in itertools.product((0, 1), repeat=3):
            full = list(full0)
            apply_final4_scenario(full, bits)
            yield bits, full
    elif stage == "s16_elite8":
        for bits in itertools.product((0, 1), repeat=15):
            full = list(full0)
            apply_sweet16_scenario(full, bits[:8])
            apply_elite8_scenario(full, bits[8:])
            yield bits, full
    else:
        raise ValueError(
            f"Unknown stage: {stage!r} (use elite8, final4, or s16_elite8)"
        )


def expected_unknown_for_stage(stage: str) -> int:
    if stage == "elite8":
        return 7
    if stage == "final4":
        return 3
    if stage == "s16_elite8":
        return 15
    return -1


def build_scenarios_dataframe(
    picks: PicksTable,
    master: MasterState,
    stage: str,
) -> pd.DataFrame:
    entry_labels = unique_entry_column_labels(picks.frame.index)
    pick_matrix = picks.frame[list(SLOT_ORDER)].to_numpy(dtype=object)
    rows = []
    for _bits, full in enumerate_scenarios(stage, master):
        tail = [full[SLOT_ORDER.index(s)] for s in SLOTS_SCENARIO_OUTCOME]
        scores = score_entries(
            picks,
            full,
            master,
            _pick_matrix=pick_matrix,
            _entry_labels=entry_labels,
        )
        row = dict(zip(SLOTS_SCENARIO_OUTCOME, tail))
        row.update(scores)
        rows.append(row)
    column_order = list(SLOTS_SCENARIO_OUTCOME) + entry_labels
    df = pd.DataFrame(rows, columns=column_order)
    score_block = df[entry_labels]
    rank_block = score_block.rank(axis=1, ascending=False, method="min")
    rank_block.columns = [f"{c}{SCENARIO_RANK_COLUMN_SUFFIX}" for c in entry_labels]
    return pd.concat(
        [df[list(SLOTS_SCENARIO_OUTCOME)], df[entry_labels], rank_block],
        axis=1,
    )


def scenarios_to_csv(df: pd.DataFrame, path) -> None:
    df.to_csv(path, index=False, encoding="utf-8")
