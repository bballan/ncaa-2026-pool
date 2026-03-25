import { useEffect, useMemo } from "react";
import { GAME_SLOTS } from "../lib/types";
import { GAME_SLOT_LABELS } from "../lib/slotLabels";
import { useAnalysisRows } from "../hooks/useAnalysisRows";
import { ScenarioStandingsPanel } from "./ScenarioStandingsPanel";
import { useScenarioStore } from "../store/scenarioStore";

export function GameDetailModal() {
  const gameDetailSlot = useScenarioStore((s) => s.gameDetailSlot);
  const setGameDetailSlot = useScenarioStore((s) => s.setGameDetailSlot);
  const focusedScenarioId = useScenarioStore((s) => s.focusedScenarioId);
  const dataset = useScenarioStore((s) => s.dataset);
  const entryRankCache = useScenarioStore((s) => s.entryRankCache);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);

  const filteredRows = useAnalysisRows();

  const frequencies = useMemo(() => {
    if (!gameDetailSlot) return [];
    const m = new Map<string, number>();
    for (const row of filteredRows) {
      const t = row.games[gameDetailSlot];
      m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [filteredRows, gameDetailSlot]);

  const focusedRow = useMemo(() => {
    if (focusedScenarioId === null || !dataset) return null;
    return dataset.rows.find((r) => r.id === focusedScenarioId) ?? null;
  }, [dataset, focusedScenarioId]);

  useEffect(() => {
    if (!gameDetailSlot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGameDetailSlot(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameDetailSlot, setGameDetailSlot]);

  if (!gameDetailSlot) return null;

  return (
    <div
      className="modal-backdrop modal-backdrop-game"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-detail-title"
      onClick={() => setGameDetailSlot(null)}
    >
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2 id="game-detail-title">
            {gameDetailSlot} — {GAME_SLOT_LABELS[gameDetailSlot]}
          </h2>
          <button type="button" className="btn icon" onClick={() => setGameDetailSlot(null)} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal-body">
          {focusedRow && dataset && (
            <section className="detail-section">
              <ScenarioStandingsPanel
                row={focusedRow}
                entryIds={dataset.entryIds}
                cache={entryRankCache}
                selectedEntryIds={selectedEntryIds}
              />
            </section>
          )}

          <section className="detail-section">
            <h3>Winners in filtered scenarios</h3>
            <p className="muted">
              Counts reflect the current table filters ({filteredRows.length} scenarios).
            </p>
            <table className="freq-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Scenarios</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {frequencies.map(([team, count]) => (
                  <tr key={team}>
                    <td>{team}</td>
                    <td>{count}</td>
                    <td>
                      {filteredRows.length
                        ? `${((100 * count) / filteredRows.length).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {focusedRow && (
            <section className="detail-section">
              <h3>Focused scenario #{focusedRow.id + 1}</h3>
              <p className="muted">
                Winner for this game: <strong>{focusedRow.games[gameDetailSlot]}</strong>
              </p>
              <h4>Full path (all scenario games)</h4>
              <ul className="path-list">
                {GAME_SLOTS.map((slot) => (
                  <li key={slot}>
                    <span className="path-slot">{slot}</span>
                    <span className="path-team">{focusedRow.games[slot]}</span>
                    {slot === gameDetailSlot && <span className="badge">current</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!focusedRow && (
            <p className="muted">
              Click a row number or a game cell to focus a scenario and see standings and path here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
