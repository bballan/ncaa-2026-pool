import { competitionRanksForRow } from "./placeChances";
import type { ScenarioRow } from "./types";

/** Row-major: `matrix[rowId * nEntries + j]` = competition rank for `entryIds[j]` in that scenario. */
export type EntryRankCache = {
  matrix: Uint16Array;
  nEntries: number;
  nRows: number;
  idToIndex: Map<string, number>;
};

export function buildEntryRankCache(rows: ScenarioRow[], entryIds: string[]): EntryRankCache | null {
  if (rows.length === 0 || entryIds.length === 0) return null;

  const nEntries = entryIds.length;
  const nRows = rows.length;
  const matrix = new Uint16Array(nRows * nEntries);
  const idToIndex = new Map<string, number>();
  entryIds.forEach((id, j) => idToIndex.set(id, j));

  for (let i = 0; i < nRows; i++) {
    const row = rows[i]!;
    const ranks = competitionRanksForRow(row, entryIds);
    const base = row.id * nEntries;
    for (let j = 0; j < nEntries; j++) {
      matrix[base + j] = ranks.get(entryIds[j]!) ?? 65535;
    }
  }

  return { matrix, nEntries, nRows, idToIndex };
}

export function rankFromCache(cache: EntryRankCache, rowId: number, entryId: string): number | undefined {
  const j = cache.idToIndex.get(entryId);
  if (j === undefined) return undefined;
  const r = cache.matrix[rowId * cache.nEntries + j]!;
  return r >= 65535 ? undefined : r;
}
