import type { EntryRankCache } from "./rankMatrix";
import type { ScenarioDataset, ScenarioRow } from "./types";
import { GAME_SLOTS } from "./types";
import type { GameFilters } from "../store/scenarioStore";
import { competitionRanksForRow } from "./placeChances";

export function gameFiltersActive(gameFilters: GameFilters): boolean {
  for (const slot of GAME_SLOTS) {
    const allowed = gameFilters[slot];
    if (allowed && allowed.size > 0) return true;
  }
  return false;
}

/**
 * Brackets that appear as rows in the place-chances panel (matches EntryPlaceSummary).
 * Empty selection → treat as all pool entries.
 */
export function placeTableBracketIds(allEntryIds: string[], selectedEntryIds: string[]): string[] {
  if (selectedEntryIds.length === 0) return [...allEntryIds];
  return [...selectedEntryIds];
}

/** True if at least one bracket in `bracketIds` has competition rank 1–4 in this scenario. */
export function rowHasAnyTopFourRank(
  row: ScenarioRow,
  bracketIds: string[],
  allEntryIds: string[],
  cache: EntryRankCache | null,
): boolean {
  if (bracketIds.length === 0 || allEntryIds.length === 0) return false;
  if (bracketIds.length === allEntryIds.length) return true;

  if (cache) {
    const { matrix, nEntries, idToIndex } = cache;
    const base = row.id * nEntries;
    for (const id of bracketIds) {
      const j = idToIndex.get(id);
      if (j !== undefined && matrix[base + j]! <= 4) return true;
    }
    return false;
  }

  const ranks = competitionRanksForRow(row, allEntryIds);
  for (const id of bracketIds) {
    const r = ranks.get(id);
    if (r !== undefined && r <= 4) return true;
  }
  return false;
}

/**
 * Rows used for outcomes table, place chances, and game detail counts.
 * - With game filters: same as game-filtered rows.
 * - With no game filters: drop scenarios where no visible place-table bracket finishes 1st–4th.
 */
export function applyAnalysisRowFilter(
  gameFiltered: ScenarioRow[],
  dataset: ScenarioDataset,
  gameFilters: GameFilters,
  selectedEntryIds: string[],
  entryRankCache: EntryRankCache | null,
): ScenarioRow[] {
  if (gameFiltersActive(gameFilters)) return gameFiltered;

  const allIds = dataset.entryIds;
  const bracketIds = placeTableBracketIds(allIds, selectedEntryIds);
  if (bracketIds.length === allIds.length) return gameFiltered;

  return gameFiltered.filter((row) => rowHasAnyTopFourRank(row, bracketIds, allIds, entryRankCache));
}
