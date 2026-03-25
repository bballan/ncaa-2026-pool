from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass
class PoolConfig:
    picks_path: Path
    sheet_picks: str = "Picks"
    sheet_master: str | None = "Master"
    bracket_name_column: str = "Bracket Name"
    master_label_column: str = "Bracket Name"
    master_row_master: str = "Master"
    master_row_points: str = "Points"
    master_row_seed: str = "Seed"
    stage: str = "elite8"
    output_dir: Path = Path("output/2026")
    output_prefix: str = "run"
    column_map: dict[str, str] = field(default_factory=dict)
    podium: list[float] | None = None
    expected_unknown_slots: int | None = None
    picks_csv_path: Path | None = None
    master_csv_path: Path | None = None


def load_config(path: Path) -> PoolConfig:
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    base = path.parent

    def p(key: str, default: Any) -> Any:
        return raw.get(key, default)

    picks_path = Path(p("picks_path", "bracket_picks.xlsx"))
    if not picks_path.is_absolute():
        picks_path = (base / picks_path).resolve()

    out_dir = Path(p("output_dir", "output/2026"))
    if not out_dir.is_absolute():
        out_dir = (base / out_dir).resolve()

    picks_csv = p("picks_csv_path", None)
    master_csv = p("master_csv_path", None)
    if picks_csv:
        picks_csv = Path(picks_csv)
        if not picks_csv.is_absolute():
            picks_csv = (base / picks_csv).resolve()
    if master_csv:
        master_csv = Path(master_csv)
        if not master_csv.is_absolute():
            master_csv = (base / master_csv).resolve()

    return PoolConfig(
        picks_path=picks_path,
        sheet_picks=p("sheet_picks", "Picks"),
        sheet_master=raw.get("sheet_master", "Master"),
        bracket_name_column=p("bracket_name_column", "Bracket Name"),
        master_label_column=p("master_label_column", "Bracket Name"),
        master_row_master=p("master_row_master", "Master"),
        master_row_points=p("master_row_points", "Points"),
        master_row_seed=p("master_row_seed", "Seed"),
        stage=p("stage", "elite8").lower(),
        output_dir=out_dir,
        output_prefix=p("output_prefix", "run"),
        column_map=dict(p("column_map", {}) or {}),
        podium=p("podium", None),
        expected_unknown_slots=p("expected_unknown_slots", None),
        picks_csv_path=picks_csv,
        master_csv_path=master_csv,
    )
