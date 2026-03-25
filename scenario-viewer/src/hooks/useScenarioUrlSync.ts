import { useEffect } from "react";
import { applyScenarioUrlQuery, syncLocationSearchFromStore } from "../lib/scenarioUrlQuery";
import { useScenarioStore } from "../store/scenarioStore";

/** Keeps the address bar in sync with store state; reapplies query on browser back/forward. */
export function useScenarioUrlSync() {
  useEffect(() => {
    return useScenarioStore.subscribe(() => {
      syncLocationSearchFromStore();
    });
  }, []);

  useEffect(() => {
    const onPop = () => {
      const ds = useScenarioStore.getState().dataset;
      if (!ds) return;
      applyScenarioUrlQuery(new URLSearchParams(window.location.search), ds);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
}
