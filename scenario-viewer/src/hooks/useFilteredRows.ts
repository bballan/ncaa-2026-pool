import { useMemo } from "react";
import { filterRowsByGames, useScenarioStore } from "../store/scenarioStore";

export function useFilteredRows() {
  const dataset = useScenarioStore((s) => s.dataset);
  const gameFilters = useScenarioStore((s) => s.gameFilters);
  return useMemo(() => filterRowsByGames(dataset, gameFilters), [dataset, gameFilters]);
}
