import { useEffect, useMemo } from "react";
import { ScenarioStandingsPanel } from "./ScenarioStandingsPanel";
import { useScenarioStore } from "../store/scenarioStore";

/** Opens when a scenario row is focused and no game drill-in modal is open. */
export function ScenarioStandingsModal() {
  const focusedScenarioId = useScenarioStore((s) => s.focusedScenarioId);
  const gameDetailSlot = useScenarioStore((s) => s.gameDetailSlot);
  const setFocusedScenarioId = useScenarioStore((s) => s.setFocusedScenarioId);
  const dataset = useScenarioStore((s) => s.dataset);
  const entryRankCache = useScenarioStore((s) => s.entryRankCache);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);

  const row = useMemo(() => {
    if (focusedScenarioId === null || !dataset) return null;
    return dataset.rows.find((r) => r.id === focusedScenarioId) ?? null;
  }, [focusedScenarioId, dataset]);

  const open = focusedScenarioId !== null && gameDetailSlot === null && row !== null && dataset !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusedScenarioId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setFocusedScenarioId]);

  if (!open || !row || !dataset) return null;

  return (
    <div
      className="modal-backdrop modal-backdrop-standings"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-standings-title"
      onClick={() => setFocusedScenarioId(null)}
    >
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2 id="scenario-standings-title">Scenario #{row.id + 1}</h2>
          <button
            type="button"
            className="btn icon"
            onClick={() => setFocusedScenarioId(null)}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="modal-body">
          <ScenarioStandingsPanel
            row={row}
            entryIds={dataset.entryIds}
            cache={entryRankCache}
            selectedEntryIds={selectedEntryIds}
          />
        </div>
      </div>
    </div>
  );
}
