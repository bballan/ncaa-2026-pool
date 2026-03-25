import { useMemo } from "react";
import { applyAnalysisRowFilter } from "../lib/analysisRows";
import { filterRowsByGames, useScenarioStore } from "../store/scenarioStore";

/** Game-filtered rows, then outcome-table rule when no game filters are set. */
export function useAnalysisRows() {
  const dataset = useScenarioStore((s) => s.dataset);
  const entryRankCache = useScenarioStore((s) => s.entryRankCache);
  const gameFilters = useScenarioStore((s) => s.gameFilters);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);
  const placeOutcomeFilter = useScenarioStore((s) => s.placeOutcomeFilter);

  const gameFiltered = useMemo(
    () => filterRowsByGames(dataset, gameFilters),
    [dataset, gameFilters],
  );

  return useMemo(() => {
    if (!dataset) return [];
    return applyAnalysisRowFilter(
      gameFiltered,
      dataset,
      gameFilters,
      selectedEntryIds,
      entryRankCache,
      placeOutcomeFilter,
    );
  }, [gameFiltered, dataset, gameFilters, selectedEntryIds, entryRankCache, placeOutcomeFilter]);
}
