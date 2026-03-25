import Papa from "papaparse";
import type { GameSlot, ScenarioDataset, ScenarioRow } from "./types";
import { GAME_SLOTS, isGameSlot } from "./types";

type RawRow = Record<string, string>;

function parseScore(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Pool CSV appends rank columns as `Name [rank]` — we only show points in the viewer. */
function isRankColumnKey(key: string): boolean {
  return key.includes("[rank]");
}

export function parseScenarioCsvText(text: string): ScenarioDataset {
  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error: ${first.message} (row ${first.row})`);
  }
  const data = parsed.data;
  if (data.length === 0) {
    return { gameSlots: [...GAME_SLOTS], entryIds: [], rows: [] };
  }

  const headerKeys = Object.keys(data[0]!);
  const gameSlots = GAME_SLOTS.filter((s) => headerKeys.includes(s));
  if (gameSlots.length !== GAME_SLOTS.length) {
    const missing = GAME_SLOTS.filter((s) => !headerKeys.includes(s));
    throw new Error(`Missing expected game columns: ${missing.join(", ")}`);
  }

  const entryIds = headerKeys.filter((k) => !isGameSlot(k) && !isRankColumnKey(k));

  const rows: ScenarioRow[] = data.map((raw, id) => {
    const games = Object.fromEntries(gameSlots.map((s) => [s, String(raw[s] ?? "").trim()])) as Record<
      GameSlot,
      string
    >;
    const scores: Record<string, number> = {};
    for (const e of entryIds) {
      scores[e] = parseScore(String(raw[e] ?? ""));
    }
    return { id, games, scores };
  });

  return { gameSlots, entryIds, rows };
}
