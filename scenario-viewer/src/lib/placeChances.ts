import type { ScenarioRow } from "./types";

/** Competition ranking (1,1,3,4…): ties share rank; next rank skips. */
export function competitionRanksForRow(row: ScenarioRow, entryIds: string[]): Map<string, number> {
  const sorted = [...entryIds].sort(
    (a, b) => (row.scores[b] ?? 0) - (row.scores[a] ?? 0),
  );
  const rankById = new Map<string, number>();
  let r = 1;
  for (let i = 0; i < sorted.length; i++) {
    const id = sorted[i]!;
    if (i > 0) {
      const prev = sorted[i - 1]!;
      const cs = row.scores[id] ?? 0;
      const ps = row.scores[prev] ?? 0;
      if (cs < ps) r = i + 1;
    }
    rankById.set(id, r);
  }
  return rankById;
}

export type EntryPlaceChances = {
  entryId: string;
  pFirst: number;
  pSecond: number;
  pThird: number;
  pFourth: number;
};

/** Fraction of scenarios (0–1) where each entry finishes 1st–4th by competition rank. */
export function computeEntryPlaceChances(
  rows: ScenarioRow[],
  entryIds: string[],
): EntryPlaceChances[] {
  if (entryIds.length === 0) return [];

  const c1 = new Map<string, number>();
  const c2 = new Map<string, number>();
  const c3 = new Map<string, number>();
  const c4 = new Map<string, number>();
  for (const id of entryIds) {
    c1.set(id, 0);
    c2.set(id, 0);
    c3.set(id, 0);
    c4.set(id, 0);
  }

  for (const row of rows) {
    const ranks = competitionRanksForRow(row, entryIds);
    for (const id of entryIds) {
      const r = ranks.get(id)!;
      if (r === 1) c1.set(id, c1.get(id)! + 1);
      else if (r === 2) c2.set(id, c2.get(id)! + 1);
      else if (r === 3) c3.set(id, c3.get(id)! + 1);
      else if (r === 4) c4.set(id, c4.get(id)! + 1);
    }
  }

  const n = rows.length || 1;
  const out: EntryPlaceChances[] = entryIds.map((entryId) => ({
    entryId,
    pFirst: (c1.get(entryId) ?? 0) / n,
    pSecond: (c2.get(entryId) ?? 0) / n,
    pThird: (c3.get(entryId) ?? 0) / n,
    pFourth: (c4.get(entryId) ?? 0) / n,
  }));

  out.sort(
    (a, b) =>
      b.pFirst - a.pFirst ||
      b.pSecond - a.pSecond ||
      b.pThird - a.pThird ||
      a.entryId.localeCompare(b.entryId),
  );

  return out;
}
