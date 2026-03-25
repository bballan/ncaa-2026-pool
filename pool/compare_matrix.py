from __future__ import annotations

import numpy as np
import pandas as pd

from pool.models import PicksTable
from pool.slots import SLOT_ORDER


def _normalize_pick_cell(x) -> str:
    if x is None or (isinstance(x, float) and pd.isna(x)):
        return ""
    return str(x).strip()


def pick_agreement_matrix(picks: PicksTable) -> pd.DataFrame:
    """
    Square matrix: cell[i,j] = number of games (of 63) where entry i and entry j
    picked the same team string. Diagonal entries are 63 when the full slot grid is present.
    """
    picks.validate_columns(tuple(SLOT_ORDER))
    sub = picks.frame[list(SLOT_ORDER)].apply(lambda s: s.map(_normalize_pick_cell))
    a = sub.to_numpy(dtype=object)
    n_entries = a.shape[0]
    n_slots = a.shape[1]
    same = a.reshape(n_entries, 1, n_slots) == a.reshape(1, n_entries, n_slots)
    counts = same.sum(axis=2).astype(np.int64)
    idx = sub.index.astype(str)
    return pd.DataFrame(counts, index=idx, columns=idx)
