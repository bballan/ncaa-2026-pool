import { inflate } from "pako";
import { buildMockDataset } from "./mockData";
import { parseScenarioCsvText } from "./parseScenarios";
import type { ScenarioDataset } from "./types";

/** Dev server middleware path (see vite-plugin-scenarios-live.ts) */
const LIVE_GZ_PATH = "/__ncaa__/scenarios.csv.gz";

async function fetchArrayBuffer(path: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function parseGzipBody(ab: ArrayBuffer): ScenarioDataset {
  const text = new TextDecoder("utf-8").decode(inflate(new Uint8Array(ab)));
  return parseScenarioCsvText(text);
}

/**
 * `?mock=1` — mock data only.
 * Dev — tries live pool CSV (via Vite plugin), then public/data files; no silent mock fallback.
 * Production — public/data files, then mock if missing.
 */
export async function loadScenarioDataset(search: string): Promise<ScenarioDataset> {
  const params = new URLSearchParams(search);
  if (params.get("mock") === "1") {
    return buildMockDataset(200);
  }

  const tryGzip = (ab: ArrayBuffer | null): ScenarioDataset | null => {
    if (!ab) return null;
    try {
      return parseGzipBody(ab);
    } catch {
      return null;
    }
  };

  const tryCsvText = (ab: ArrayBuffer | null): ScenarioDataset | null => {
    if (!ab) return null;
    try {
      const text = new TextDecoder("utf-8").decode(new Uint8Array(ab));
      return parseScenarioCsvText(text);
    } catch {
      return null;
    }
  };

  if (import.meta.env.DEV) {
    const liveAb = await fetchArrayBuffer(LIVE_GZ_PATH);
    const fromLive = tryGzip(liveAb);
    if (fromLive) {
      return fromLive;
    }

    for (const path of ["/data/scenarios.csv.gz", "./data/scenarios.csv.gz"]) {
      const parsed = tryGzip(await fetchArrayBuffer(path));
      if (parsed) return parsed;
    }
    for (const path of ["/data/scenarios.csv", "./data/scenarios.csv"]) {
      const parsed = tryCsvText(await fetchArrayBuffer(path));
      if (parsed) return parsed;
    }

    throw new Error(
      `Could not load live scenarios. Ensure output/2026 contains a *_scenario_pts_*.csv (pool run output), ` +
        `or place scenarios.csv.gz under scenario-viewer/public/data/. Use ?mock=1 for sample data.`,
    );
  }

  const gzPaths = ["./data/scenarios.csv.gz", "/data/scenarios.csv.gz"];
  for (const p of gzPaths) {
    const parsed = tryGzip(await fetchArrayBuffer(p));
    if (parsed) return parsed;
  }

  const csvPaths = ["./data/scenarios.csv", "/data/scenarios.csv"];
  for (const p of csvPaths) {
    const parsed = tryCsvText(await fetchArrayBuffer(p));
    if (parsed) return parsed;
  }

  console.warn("No scenarios.csv.gz or scenarios.csv in public/data — using mock data.");
  return buildMockDataset(200);
}
