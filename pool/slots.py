"""Canonical 63 game slot ids (column order contract from 2019 CSVs)."""

SLOT_ORDER: list[str] = (
    [f"R32-{i}" for i in range(1, 33)]
    + [f"SS{i}" for i in range(1, 17)]
    + [f"EE{i}" for i in range(1, 9)]
    + [f"FinalFour{i}" for i in range(1, 5)]
    + ["Finalist1", "Finalist2", "Champ"]
)

assert len(SLOT_ORDER) == 63

# Last 15 slots: Elite 8 through championship (legacy slice [48:])
SLOTS_SCENARIO_OUTCOME: list[str] = SLOT_ORDER[48:63]
