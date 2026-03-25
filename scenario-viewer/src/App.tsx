import { useEffect } from "react";
import { EntryPicker } from "./components/EntryPicker";
import { GameDetailModal } from "./components/GameDetailModal";
import { ScenarioStandingsModal } from "./components/ScenarioStandingsModal";
import { EntryPlaceSummary } from "./components/EntryPlaceSummary";
import { GameFilterBar } from "./components/GameFilterBar";
import { ScenarioTable } from "./components/ScenarioTable";
import { loadScenarioDataset } from "./lib/loadData";
import { useScenarioStore } from "./store/scenarioStore";
import "./styles.css";

export default function App() {
  const setDataset = useScenarioStore((s) => s.setDataset);
  const setLoadStatus = useScenarioStore((s) => s.setLoadStatus);
  const loadStatus = useScenarioStore((s) => s.loadStatus);
  const loadError = useScenarioStore((s) => s.loadError);
  const dataset = useScenarioStore((s) => s.dataset);

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    loadScenarioDataset(window.location.search)
      .then((d) => {
        if (!cancelled) setDataset(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadStatus("error", e instanceof Error ? e.message : String(e));
        }
      });
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
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <EntryPicker />
        </aside>
        <div className="main-col">
          <GameFilterBar />
          <EntryPlaceSummary />
          <ScenarioTable />
        </div>
      </main>

      <ScenarioStandingsModal />
      <GameDetailModal />
    </div>
  );
}
