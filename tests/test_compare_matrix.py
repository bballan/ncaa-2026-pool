from __future__ import annotations

from pathlib import Path

import pandas as pd

from pool.compare_matrix import pick_agreement_matrix
from pool.models import PicksTable
from pool.slots import SLOT_ORDER


def test_diagonal_is_63_for_2019_picks():
    _ROOT = Path(__file__).resolve().parents[1]
    picks_path = _ROOT / "2019" / "picks2019worldsbest.csv"
    raw = pd.read_csv(picks_path, index_col=0)
    picks = PicksTable(frame=raw)
    mat = pick_agreement_matrix(picks)
    assert mat.shape[0] == mat.shape[1]
    diag = mat.values.diagonal()
    assert (diag == 63).all(), f"expected all 63, got min={diag.min()} max={diag.max()}"


def test_off_diagonal_symmetric_and_bounded():
    a = {s: ("1 A" if s == SLOT_ORDER[0] else "2 B") for s in SLOT_ORDER}
    b = dict(a)
    b[SLOT_ORDER[0]] = "9 Z"
    frame = pd.DataFrame([a, b], index=["alice", "bob"])
    mat = pick_agreement_matrix(PicksTable(frame=frame))
    assert mat.loc["alice", "alice"] == 63
    assert mat.loc["bob", "bob"] == 63
    assert mat.loc["alice", "bob"] == 62
    assert mat.loc["bob", "alice"] == 62
    assert mat.loc["alice", "bob"] == mat.loc["bob", "alice"]
