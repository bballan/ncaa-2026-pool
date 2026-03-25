import type { CriticalPathRow } from "./criticalPathTypes";
import { GAME_SLOTS } from "./types";

/** Sample must-win rows for ?mock=1 when no critical path file is bundled. */
export function buildMockCriticalPath(): CriticalPathRow[] {
  const rows: CriticalPathRow[] = [];
  let id = 0;
  const samples: { entry: string; place: number; picks: Partial<Record<(typeof GAME_SLOTS)[number], string>> }[] = [
    {
      entry: "Alice",
      place: 1,
      picks: { EE1: "1 Duke", Champ: "1 Duke" },
    },
    {
      entry: "Bob",
      place: 1,
      picks: { EE2: "2 UConn", FinalFour1: "2 UConn" },
    },
    {
      entry: "Alice",
      place: 2,
      picks: { EE1: "1 Duke" },
    },
  ];
  for (const s of samples) {
    const picks = Object.fromEntries(GAME_SLOTS.map((slot) => [slot, s.picks[slot] ?? ""])) as CriticalPathRow["picks"];
    rows.push({ id: id++, entry: s.entry, finishingPlace: s.place, picks });
  }
  return rows;
}
