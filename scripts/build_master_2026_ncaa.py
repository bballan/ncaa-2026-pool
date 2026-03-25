#!/usr/bin/env python3
"""
Regenerate master_elite8_from_pool.csv from NCAA.com bracket results.

Source (men's D-I 2026): https://www.ncaa.com/interactive-bracket/basketball/men/d1/2026

As of end of Round of 32 (2026-03-22): R32 + SS16 filled; EE1–Champ are -1.
After Sweet 16 / Elite 8, edit the Master row (or extend this script) and set
stage to elite8 (7 unknowns) or final4 (3 unknowns) in config.

Run from repo root:
  python3 scripts/build_master_2026_ncaa.py
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pandas as pd

from pool.slots import SLOT_ORDER

# Winners through SS16; labels match modal strings in bracket_picks.xlsx.
R32: dict[str, str] = {
    "R32-1": "1 Duke",
    "R32-2": "9 TCU",
    "R32-3": "5 St. John's",
    "R32-4": "4 Kansas",
    "R32-5": "6 Louisville",
    "R32-6": "3 Michigan St.",
    "R32-7": "7 UCLA",
    "R32-8": "2 UConn",
    "R32-9": "1 Arizona",
    "R32-10": "9 Utah St.",
    "R32-11": "12 High Point",
    "R32-12": "4 Arkansas",
    "R32-13": "11 Texas",
    "R32-14": "3 Gonzaga",
    "R32-15": "7 Miami",
    "R32-16": "2 Purdue",
    "R32-17": "1 Florida",
    "R32-18": "9 Iowa",
    "R32-19": "5 Vanderbilt",
    "R32-20": "4 Nebraska",
    "R32-21": "11 VCU",
    "R32-22": "3 Illinois",
    "R32-23": "10 Texas A&M",
    "R32-24": "2 Houston",
    "R32-25": "1 Michigan",
    "R32-26": "9 Saint Louis",
    "R32-27": "5 Texas Tech",
    "R32-28": "4 Alabama",
    "R32-29": "6 Tennessee",
    "R32-30": "3 Virginia",
    "R32-31": "7 Kentucky",
    "R32-32": "2 Iowa St.",
}
SS: dict[str, str] = {
    "SS1": "1 Duke",
    "SS2": "5 St. John's",
    "SS3": "3 Michigan St.",
    "SS4": "2 UConn",
    "SS5": "1 Arizona",
    "SS6": "4 Arkansas",
    "SS7": "11 Texas",
    "SS8": "2 Purdue",
    "SS9": "9 Iowa",
    "SS10": "4 Nebraska",
    "SS11": "3 Illinois",
    "SS12": "2 Houston",
    "SS13": "1 Michigan",
    "SS14": "4 Alabama",
    "SS15": "6 Tennessee",
    "SS16": "2 Iowa St.",
}
TAIL_UNKNOWN = (
    "EE1",
    "EE2",
    "EE3",
    "EE4",
    "EE5",
    "EE6",
    "EE7",
    "EE8",
    "FinalFour1",
    "FinalFour2",
    "FinalFour3",
    "FinalFour4",
    "Finalist1",
    "Finalist2",
    "Champ",
)


def main() -> None:
    master_out: dict[str, str] = {}
    for s in SLOT_ORDER:
        if s in R32:
            master_out[s] = R32[s]
        elif s in SS:
            master_out[s] = SS[s]
        elif s in TAIL_UNKNOWN:
            master_out[s] = "-1"
        else:
            master_out[s] = "-1"

    ref = pd.read_csv(_ROOT / "2019/masterbracket8teams.csv", index_col=0)
    pts = [ref.loc["Points", s] for s in SLOT_ORDER]
    sd = [ref.loc["Seed", s] for s in SLOT_ORDER]

    out_path = _ROOT / "master_elite8_from_pool.csv"
    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Bracket Name", *SLOT_ORDER])
        w.writerow(["Master", *[master_out[s] for s in SLOT_ORDER]])
        w.writerow(["Points", *pts])
        w.writerow(["Seed", *sd])

    unk = sum(1 for s in SLOT_ORDER if master_out[s] == "-1")
    print(f"Wrote {out_path} ({unk} unknown slots)")


if __name__ == "__main__":
    main()
