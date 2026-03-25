#!/usr/bin/env python3
"""Write scenario-viewer/public/data/scenarios.csv.gz from a pool scenario-points CSV."""

from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path

_REPO = Path(__file__).resolve().parents[1]
_DEFAULT_OUT = _REPO / "scenario-viewer" / "public" / "data"


def main() -> None:
    p = argparse.ArgumentParser(description="Prepare scenario-viewer data bundle")
    p.add_argument("csv", type=Path, help="Scenario points CSV (*_scenario_pts_*.csv)")
    p.add_argument(
        "-o",
        "--out-dir",
        type=Path,
        default=_DEFAULT_OUT,
        help="Output directory",
    )
    ns = p.parse_args()
    csv_path: Path = ns.csv
    out_dir: Path = ns.out_dir

    if not csv_path.is_file():
        raise SystemExit(f"CSV not found: {csv_path}")

    out_dir.mkdir(parents=True, exist_ok=True)
    dst_gz = out_dir / "scenarios.csv.gz"

    with csv_path.open("rb") as f_in:
        raw = f_in.read()
    dst_gz.write_bytes(gzip.compress(raw, compresslevel=9))

    meta = {
        "source_csv": csv_path.name,
        "bytes_csv": len(raw),
        "bytes_gzip": dst_gz.stat().st_size,
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {dst_gz} ({meta['bytes_gzip']:,} bytes gzip from {meta['bytes_csv']:,} bytes CSV)")
    print(f"Meta: {out_dir / 'meta.json'}")


if __name__ == "__main__":
    main()
