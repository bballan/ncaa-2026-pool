import { inflate } from "pako";
import { buildMockCriticalPath } from "./mockCriticalPath";
import { parseCriticalPathCsvText } from "./parseCriticalPath";
import type { CriticalPathRow } from "./criticalPathTypes";

const LIVE_GZ_PATH = "/__ncaa__/critical_path.csv.gz";

async function fetchArrayBuffer(path: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function parseGzipCsv(ab: ArrayBuffer): CriticalPathRow[] {
  const text = new TextDecoder("utf-8").decode(inflate(new Uint8Array(ab)));
  return parseCriticalPathCsvText(text);
}

/**
 * Load must-win / critical-path CSV (gzip or plain). In mock mode returns a tiny sample.
 * Missing file in production yields [] (scenarios tab still works).
 */
export async function loadCriticalPathRows(search: string): Promise<CriticalPathRow[]> {
  const params = new URLSearchParams(search);
  if (params.get("mock") === "1") {
    return buildMockCriticalPath();
  }

  const tryGzip = (ab: ArrayBuffer | null): CriticalPathRow[] | null => {
    if (!ab) return null;
    try {
      return parseGzipCsv(ab);
    } catch {
      return null;
    }
  };

  const tryCsv = (ab: ArrayBuffer | null): CriticalPathRow[] | null => {
    if (!ab) return null;
    try {
      const text = new TextDecoder("utf-8").decode(new Uint8Array(ab));
      return parseCriticalPathCsvText(text);
    } catch {
      return null;
    }
  };

  if (import.meta.env.DEV) {
    const liveAb = await fetchArrayBuffer(LIVE_GZ_PATH);
    const fromLive = tryGzip(liveAb);
    if (fromLive) return fromLive;

    for (const path of ["/data/critical_path.csv.gz", "./data/critical_path.csv.gz"]) {
      const parsed = tryGzip(await fetchArrayBuffer(path));
      if (parsed) return parsed;
    }
    for (const path of ["/data/critical_path.csv", "./data/critical_path.csv"]) {
      const parsed = tryCsv(await fetchArrayBuffer(path));
      if (parsed) return parsed;
    }

    console.warn(
      "No critical path data in dev (place run_critical_path_*.csv in output/2026 or public/data/critical_path.csv.gz). Must-win tab will be empty.",
    );
    return [];
  }

  for (const p of ["./data/critical_path.csv.gz", "/data/critical_path.csv.gz"]) {
    const parsed = tryGzip(await fetchArrayBuffer(p));
    if (parsed) return parsed;
  }
  for (const p of ["./data/critical_path.csv", "/data/critical_path.csv"]) {
    const parsed = tryCsv(await fetchArrayBuffer(p));
    if (parsed) return parsed;
  }

  return [];
}
