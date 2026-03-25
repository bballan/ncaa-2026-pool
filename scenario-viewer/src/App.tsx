import { useEffect, useState } from "react";
import { EntryPicker } from "./components/EntryPicker";
import { GameDetailModal } from "./components/GameDetailModal";
import { ScenarioStandingsModal } from "./components/ScenarioStandingsModal";
import { EntryPlaceSummary } from "./components/EntryPlaceSummary";
import { GameFilterBar } from "./components/GameFilterBar";
import { ScenarioTable } from "./components/ScenarioTable";
import { MustWinPanel } from "./components/MustWinPanel";
import { useScenarioUrlSync } from "./hooks/useScenarioUrlSync";
import { loadCriticalPathRows } from "./lib/loadCriticalPath";
import { loadScenarioDataset } from "./lib/loadData";
import {
  applyScenarioUrlQuery,
  beginScenarioUrlHydration,
  endScenarioUrlHydration,
} from "./lib/scenarioUrlQuery";
import { useCriticalPathStore } from "./store/criticalPathStore";
import { useScenarioStore } from "./store/scenarioStore";
import "./styles.css";

type MainTab = "scenarios" | "mustwin";

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>("scenarios");
  const setDataset = useScenarioStore((s) => s.setDataset);
  const setLoadStatus = useScenarioStore((s) => s.setLoadStatus);
  const loadStatus = useScenarioStore((s) => s.loadStatus);
  const loadError = useScenarioStore((s) => s.loadError);
  const dataset = useScenarioStore((s) => s.dataset);

  useScenarioUrlSync();

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    useCriticalPathStore.getState().setLoadStatus("loading");

    const criticalPromise = loadCriticalPathRows(window.location.search).catch((e) => {
      console.warn("Critical path load failed:", e);
      return [];
    });

    (async () => {
      try {
        const [scenarios, criticalRows] = await Promise.all([
          loadScenarioDataset(window.location.search),
          criticalPromise,
        ]);
        if (cancelled) return;
        useCriticalPathStore.getState().setRows(criticalRows);
        beginScenarioUrlHydration();
        try {
          setDataset(scenarios);
          applyScenarioUrlQuery(new URLSearchParams(window.location.search), scenarios);
        } finally {
          endScenarioUrlHydration();
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setLoadStatus("error", e instanceof Error ? e.message : String(e));
        try {
          const rows = await criticalPromise;
          useCriticalPathStore.getState().setRows(rows);
        } catch {
          useCriticalPathStore.getState().setRows([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setDataset, setLoadStatus]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>NCAA pool — scenario outcomes</h1>
        <p className="lede">
          Explore every enumerated finish from the Elite&nbsp;8 through the champion, compare
          bracket scores side by side, and drill into any game.
        </p>
        {loadStatus === "loading" && <p className="status loading">Loading scenarios…</p>}
        {loadStatus === "error" && (
          <p className="status error" role="alert">
            {loadError ?? "Failed to load data"}
          </p>
        )}
        {dataset && (
          <p className="status ready">
            {dataset.rows.length.toLocaleString()} scenarios · {dataset.entryIds.length} brackets
          </p>
        )}

        <nav className="app-tabs" role="tablist" aria-label="Main views">
          <button
            type="button"
            role="tab"
            id="tab-scenarios"
            aria-selected={mainTab === "scenarios"}
            className={`app-tab${mainTab === "scenarios" ? " active" : ""}`}
            onClick={() => setMainTab("scenarios")}
          >
            Scenario outcomes
          </button>
          <button
            type="button"
            role="tab"
            id="tab-mustwin"
            aria-selected={mainTab === "mustwin"}
            className={`app-tab${mainTab === "mustwin" ? " active" : ""}`}
            onClick={() => setMainTab("mustwin")}
          >
            Must-win games
          </button>
        </nav>
      </header>

      <main className={`app-main${mainTab === "mustwin" ? " app-main-mustwin" : ""}`}>
        {mainTab === "scenarios" ? (
          <>
            <aside className="sidebar">
              <EntryPicker />
            </aside>
            <div className="main-col">
              <GameFilterBar />
              <EntryPlaceSummary />
              <ScenarioTable />
            </div>
          </>
        ) : (
          <div className="main-col main-col-mustwin">
            <MustWinPanel />
          </div>
        )}
      </main>

      <ScenarioStandingsModal />
      <GameDetailModal />
    </div>
  );
}
