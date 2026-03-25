from __future__ import annotations

import pandas as pd

from pool.models import MasterState, PicksTable, is_unknown_cell
from pool.slots import SLOT_ORDER


def apply_column_map(columns: list[str], column_map: dict[str, str]) -> list[str]:
    return [column_map.get(c, c) for c in columns]


def _normalize_outcome(v) -> str:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return "-1"
    s = str(v).strip()
    if s.endswith(".0") and s[:-2].isdigit():
        s = s[:-2]
    return s


def master_from_labeled_rows(
    df: pd.DataFrame,
    row_master: str,
    row_points: str,
    row_seed: str,
    slots: tuple[str, ...],
) -> MasterState:
    """df: index = Master/Points/Seed, columns = slot ids (+ maybe extra cols)."""
    for name in (row_master, row_points, row_seed):
        if name not in df.index:
            raise ValueError(f"Master sheet missing row label: {name!r}")
    outcomes = {}
    points = {}
    seeds = {}
    for s in slots:
        if s not in df.columns:
            raise ValueError(f"Master row missing slot column: {s}")
        outcomes[s] = _normalize_outcome(df.loc[row_master, s])
        points[s] = float(df.loc[row_points, s])
        seeds[s] = float(df.loc[row_seed, s])
    return MasterState(outcomes=outcomes, points=points, seed_bonus=seeds, slots=tuple(slots))


def load_master_csv(path, column_map: dict[str, str]) -> MasterState:
    raw = pd.read_csv(path, index_col=0)
    raw.columns = apply_column_map(list(raw.columns), column_map)
    return master_from_labeled_rows(
        raw,
        row_master="Master",
        row_points="Points",
        row_seed="Seed",
        slots=tuple(SLOT_ORDER),
    )


def load_picks_csv(path: str, bracket_name_column: str, column_map: dict[str, str]) -> PicksTable:
    raw = pd.read_csv(path, index_col=0)
    raw.columns = apply_column_map(list(raw.columns), column_map)
    if bracket_name_column in raw.columns:
        raw = raw.set_index(bracket_name_column)
    raw.index = raw.index.astype(str)
    return PicksTable(frame=raw)


def _read_excel_sheet(path, sheet: str) -> pd.DataFrame:
    return pd.read_excel(path, sheet_name=sheet, header=0, engine="openpyxl")


def load_from_excel(
    path,
    sheet_picks: str,
    sheet_master: str | None,
    bracket_name_column: str,
    master_label_column: str,
    row_master: str,
    row_points: str,
    row_seed: str,
    column_map: dict[str, str],
) -> tuple[PicksTable, MasterState]:
    picks_df = _read_excel_sheet(path, sheet_picks)
    picks_df.columns = [str(c).strip() for c in picks_df.columns]
    picks_df.columns = apply_column_map(list(picks_df.columns), column_map)

    if sheet_master:
        master_df = _read_excel_sheet(path, sheet_master)
        master_df.columns = [str(c).strip() for c in master_df.columns]
        master_df.columns = apply_column_map(list(master_df.columns), column_map)
        if master_label_column not in master_df.columns:
            raise ValueError(f"Master sheet missing label column {master_label_column!r}")
        master_df = master_df.set_index(master_label_column)
        master = master_from_labeled_rows(
            master_df,
            row_master=row_master,
            row_points=row_points,
            row_seed=row_seed,
            slots=tuple(SLOT_ORDER),
        )
        # Picks: all rows from picks sheet (exclude label rows if present)
        if bracket_name_column not in picks_df.columns:
            raise ValueError(f"Picks sheet missing {bracket_name_column!r}")
        mask_label = picks_df[bracket_name_column].astype(str).isin(
            {row_master, row_points, row_seed}
        )
        picks_only = picks_df.loc[~mask_label].copy()
        picks_only = picks_only.set_index(bracket_name_column)
        picks_only.index = picks_only.index.astype(str)
        return PicksTable(frame=picks_only), master

    # Single-sheet: Master/Points/Seed embedded in picks sheet
    if bracket_name_column not in picks_df.columns:
        raise ValueError(f"Picks sheet missing {bracket_name_column!r}")
    label_vals = picks_df[bracket_name_column].astype(str)
    m_mask = label_vals == row_master
    p_mask = label_vals == row_points
    s_mask = label_vals == row_seed
    if not (m_mask.any() and p_mask.any() and s_mask.any()):
        raise ValueError(
            "Single-sheet mode requires rows labeled Master, Points, Seed in "
            f"{bracket_name_column!r}"
        )
    slot_cols = [c for c in SLOT_ORDER if c in picks_df.columns]
    if len(slot_cols) != len(SLOT_ORDER):
        missing = [s for s in SLOT_ORDER if s not in picks_df.columns]
        raise ValueError(f"Single-sheet picks missing slot columns: {missing[:8]}...")

    def row_dict(mask):
        r = picks_df.loc[mask].iloc[0]
        return {c: r[c] for c in slot_cols}

    mo = {c: _normalize_outcome(row_dict(m_mask)[c]) for c in slot_cols}
    pt = {c: float(row_dict(p_mask)[c]) for c in slot_cols}
    sd = {c: float(row_dict(s_mask)[c]) for c in slot_cols}
    outcomes = {s: mo[s] for s in SLOT_ORDER}
    points = {s: pt[s] for s in SLOT_ORDER}
    seeds = {s: sd[s] for s in SLOT_ORDER}
    master = MasterState(outcomes=outcomes, points=points, seed_bonus=seeds, slots=tuple(SLOT_ORDER))

    picks_only = picks_df.loc[~(m_mask | p_mask | s_mask)].copy()
    picks_only = picks_only.set_index(bracket_name_column)
    picks_only.index = picks_only.index.astype(str)
    return PicksTable(frame=picks_only), master


def load_picks_only(cfg) -> PicksTable:
    """
    Load bracket picks only (no master). Use for pick-agreement matrix etc.
    Excel: same row filtering as full load (drops Master/Points/Seed rows when present).
    """
    if cfg.picks_csv_path:
        return load_picks_csv(cfg.picks_csv_path, cfg.bracket_name_column, cfg.column_map)
    if not cfg.picks_path.exists():
        raise FileNotFoundError(
            f"Picks file not found: {cfg.picks_path}. Set picks_path or picks_csv_path."
        )
    picks_df = _read_excel_sheet(cfg.picks_path, cfg.sheet_picks)
    picks_df.columns = [str(c).strip() for c in picks_df.columns]
    picks_df.columns = apply_column_map(list(picks_df.columns), cfg.column_map)
    bn = cfg.bracket_name_column
    if bn not in picks_df.columns:
        raise ValueError(f"Picks sheet missing {bn!r}")
    labels = {cfg.master_row_master, cfg.master_row_points, cfg.master_row_seed}
    if cfg.sheet_master:
        mask_label = picks_df[bn].astype(str).isin(labels)
        picks_only = picks_df.loc[~mask_label].copy()
    else:
        lv = picks_df[bn].astype(str)
        m = lv == cfg.master_row_master
        p = lv == cfg.master_row_points
        s = lv == cfg.master_row_seed
        if m.any() and p.any() and s.any():
            picks_only = picks_df.loc[~(m | p | s)].copy()
        else:
            picks_only = picks_df.copy()
    picks_only = picks_only.set_index(bn)
    picks_only.index = picks_only.index.astype(str)
    return PicksTable(frame=picks_only)


def load_inputs(cfg) -> tuple[PicksTable, MasterState]:
    if cfg.picks_csv_path and cfg.master_csv_path:
        picks = load_picks_csv(cfg.picks_csv_path, cfg.bracket_name_column, cfg.column_map)
        master = load_master_csv(cfg.master_csv_path, cfg.column_map)
        return picks, master
    if cfg.master_csv_path:
        if not cfg.master_csv_path.exists():
            raise FileNotFoundError(f"Master CSV not found: {cfg.master_csv_path}")
        if not cfg.picks_path.exists():
            raise FileNotFoundError(
                f"Picks file not found: {cfg.picks_path}. Set picks_path or use picks_csv_path."
            )
        master = load_master_csv(cfg.master_csv_path, cfg.column_map)
        picks = load_picks_only(cfg)
        return picks, master
    if not cfg.picks_path.exists():
        raise FileNotFoundError(
            f"Picks file not found: {cfg.picks_path}. Set picks_path or use picks_csv_path."
        )
    return load_from_excel(
        cfg.picks_path,
        cfg.sheet_picks,
        cfg.sheet_master,
        cfg.bracket_name_column,
        cfg.master_label_column,
        cfg.master_row_master,
        cfg.master_row_points,
        cfg.master_row_seed,
        cfg.column_map,
    )
