from __future__ import annotations

from pathlib import Path

import pandas as pd

from pool.config_loader import PoolConfig
from pool.pipeline import run_pipeline

ROOT = Path(__file__).resolve().parents[1]


def test_elite8_matches_2019_scenario_csv():
    cfg = PoolConfig(
        picks_path=ROOT / "missing.xlsx",
        picks_csv_path=ROOT / "2019" / "picks2019worldsbest.csv",
        master_csv_path=ROOT / "2019" / "masterbracket8teams.csv",
        stage="elite8",
        output_dir=ROOT / "output" / "2026",
        output_prefix="pytest_elite8",
    )
    run_pipeline(cfg)
    new = pd.read_csv(cfg.output_dir / "pytest_elite8_scenario_pts_elite8.csv")
    old = pd.read_csv(ROOT / "2019" / "scenario_pts_elite8_WB.csv")
    assert len(new) == 128 == len(old)
    assert float(new.iloc[0]["bos2"]) == float(old.iloc[0]["bos2"])


def test_final4_matches_2019_scenario_csv():
    cfg = PoolConfig(
        picks_path=ROOT / "missing.xlsx",
        picks_csv_path=ROOT / "2019" / "picks2019worldsbest.csv",
        master_csv_path=ROOT / "2019" / "masterbracket4teams.csv",
        stage="final4",
        output_dir=ROOT / "output" / "2026",
        output_prefix="pytest_final4",
    )
    run_pipeline(cfg)
    new = pd.read_csv(cfg.output_dir / "pytest_final4_scenario_pts_final4.csv")
    old = pd.read_csv(ROOT / "2019" / "scenario_pts_final4_WB.csv")
    assert len(new) == 8 == len(old)
    assert float(new.iloc[0]["bos2"]) == float(old.iloc[0]["bos2"])
