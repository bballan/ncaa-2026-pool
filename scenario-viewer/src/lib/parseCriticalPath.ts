import Papa from "papaparse";
import type { CriticalPathRow } from "./criticalPathTypes";
import type { GameSlot } from "./types";
import { GAME_SLOTS } from "./types";

type RawRow = Record<string, string>;

const ENTRY_KEY = "Entry";
const PLACE_KEY = "Finishing Position";

function parseFinishingPlace(raw: string): number {
  const n = Number.parseFloat(String(raw ?? "").trim());
  if (!Number.isFinite(n)) return NaN;
  return n;
}

export function parseCriticalPathCsvText(text: string): CriticalPathRow[] {
  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length) {
    const first = parsed.errors[0];
    throw new Error(`Critical path CSV parse error: ${first.message} (row ${first.row})`);
  }
  const data = parsed.data;
  if (data.length === 0) return [];

  const headerKeys = Object.keys(data[0]!);
  if (!headerKeys.includes(ENTRY_KEY) || !headerKeys.includes(PLACE_KEY)) {
    throw new Error(`Critical path CSV must include "${ENTRY_KEY}" and "${PLACE_KEY}" columns`);
  }

  const gameSlots = GAME_SLOTS.filter((s) => headerKeys.includes(s));
  if (gameSlots.length !== GAME_SLOTS.length) {
    const missing = GAME_SLOTS.filter((s) => !headerKeys.includes(s));
    throw new Error(`Critical path CSV missing game columns: ${missing.join(", ")}`);
  }

  const rows: CriticalPathRow[] = [];
  let id = 0;
  for (const raw of data) {
    const entry = String(raw[ENTRY_KEY] ?? "").trim();
    const finishingPlace = parseFinishingPlace(String(raw[PLACE_KEY] ?? ""));
    if (!entry || !Number.isFinite(finishingPlace)) continue;

    const picks = Object.fromEntries(
      GAME_SLOTS.map((s) => [s, String(raw[s] ?? "").trim()]),
    ) as Record<GameSlot, string>;

    rows.push({ id: id++, entry, finishingPlace, picks });
  }

  return rows;
}

export function countMustWins(picks: Record<GameSlot, string>): number {
  let n = 0;
  for (const s of GAME_SLOTS) {
    if (picks[s]) n++;
  }
  return n;
}

export function picksLineLower(picks: Record<GameSlot, string>): string {
  const parts: string[] = [];
  for (const s of GAME_SLOTS) {
    const v = picks[s];
    if (v) parts.push(v.toLowerCase());
  }
  return parts.join(" ");
}
