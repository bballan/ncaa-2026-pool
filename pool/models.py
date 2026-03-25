from __future__ import annotations

from dataclasses import dataclass, field
from typing import Mapping

import pandas as pd

from pool.slots import SLOT_ORDER


UNKNOWN = -1
UNKNOWN_STR = "-1"


def is_unknown_cell(v) -> bool:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return True
    s = str(v).strip()
    return s == UNKNOWN_STR or s == ""


@dataclass
class MasterState:
    """Master bracket row + per-slot points and seed bonuses."""

    outcomes: dict[str, str]  # slot -> team label or '-1'
    points: dict[str, float]
    seed_bonus: dict[str, float]
    slots: tuple[str, ...] = tuple(SLOT_ORDER)

    def unknown_count(self) -> int:
        return sum(1 for s in self.slots if is_unknown_cell(self.outcomes.get(s)))


@dataclass
class PicksTable:
    """All pool entries: index = entry name, columns = slot ids."""

    frame: pd.DataFrame  # index: entry, columns: SLOT_ORDER subset or full

    @property
    def entry_ids(self) -> list:
        return list(self.frame.index)

    def validate_columns(self, slots: tuple[str, ...]) -> None:
        missing = [s for s in slots if s not in self.frame.columns]
        if missing:
            raise ValueError(f"Picks missing columns: {missing[:5]}{'...' if len(missing) > 5 else ''}")


@dataclass
class ScenarioRow:
    """One enumerated outcome for the last 15 slots + per-entry scores."""

    outcomes_tail: dict[str, str]  # SLOTS_SCENARIO_OUTCOME -> team
    scores: dict[str, float] = field(default_factory=dict)
