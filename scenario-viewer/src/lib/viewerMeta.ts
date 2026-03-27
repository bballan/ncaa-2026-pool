import type { GameSlot } from "./types";
import { isGameSlot } from "./types";

export type ViewerMeta = {
  source_csv?: string;
  bytes_csv?: number;
  bytes_gzip?: number;
  critical_path_csv?: string;
  critical_path_bytes_gzip?: number;
  /**
   * On first load (no per-slot URL override), pre-select these winners to match
   * games already decided. Keys must be `GameSlot` values; values must match
   * team strings in the scenario CSV for that slot.
   */
  defaultGameOutcomes?: Record<string, string>;
};

function normalizeDefaultOutcomes(
  raw: Record<string, string> | undefined,
): Partial<Record<GameSlot, string>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<GameSlot, string>> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isGameSlot(k)) continue;
    const team = typeof v === "string" ? v.trim() : "";
    if (team) out[k] = team;
  }
  return out;
}

export function defaultGameOutcomesFromMeta(meta: ViewerMeta | null): Partial<Record<GameSlot, string>> {
  return normalizeDefaultOutcomes(meta?.defaultGameOutcomes);
}

/**
 * Load viewer metadata (optional). Skipped for `?mock=1` so mock team names never mismatch defaults.
 */
export async function loadViewerMeta(search: string): Promise<ViewerMeta | null> {
  const params = new URLSearchParams(search);
  if (params.get("mock") === "1") return null;

  const paths = ["./data/meta.json", "/data/meta.json"];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (!res.ok) continue;
      const data = (await res.json()) as ViewerMeta;
      return data && typeof data === "object" ? data : null;
    } catch {
      continue;
    }
  }
  return null;
}
