import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GAME_SLOTS } from "../lib/types";
import { GAME_SLOT_LABELS } from "../lib/slotLabels";
import { useFilteredRows } from "../hooks/useFilteredRows";
import { useScenarioStore } from "../store/scenarioStore";

const ROW_H = 34;
const CELL_GAME_W = 128;
const CELL_ID_W = 72;
const CELL_SCORE_W = 88;

export function ScenarioTable() {
  const parentRef = useRef<HTMLDivElement>(null);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);
  const setGameDetailSlot = useScenarioStore((s) => s.setGameDetailSlot);
  const setFocusedScenarioId = useScenarioStore((s) => s.setFocusedScenarioId);
  const focusedScenarioId = useScenarioStore((s) => s.focusedScenarioId);

  const filteredRows = useFilteredRows();

  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
  });

  const totalWidth =
    CELL_ID_W + GAME_SLOTS.length * CELL_GAME_W + selectedEntryIds.length * CELL_SCORE_W;

  return (
    <section className="panel table-panel" aria-label="Scenario outcomes">
      <div className="panel-head">
        <h2>Outcomes table</h2>
        <p className="muted">
          Click a game column header or a cell to open details. Click a row number to focus that
          scenario.
        </p>
      </div>
      <div className="table-scroll" ref={parentRef}>
        <div className="table-inner" style={{ width: totalWidth, height: rowVirtualizer.getTotalSize() + 40 }}>
          <div className="table-header-row" style={{ width: totalWidth }}>
            <div className="th th-id">#</div>
            {GAME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                className="th th-game"
                style={{ width: CELL_GAME_W }}
                title={GAME_SLOT_LABELS[slot]}
                onClick={() => {
                  setFocusedScenarioId(null);
                  setGameDetailSlot(slot);
                }}
              >
                <span className="th-slot">{slot}</span>
              </button>
            ))}
            {selectedEntryIds.map((eid) => (
              <div key={eid} className="th th-score" style={{ width: CELL_SCORE_W }} title={eid}>
                <span className="th-entry">{eid}</span>
              </div>
            ))}
          </div>
          <div
            className="table-body"
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const row = filteredRows[vRow.index]!;
              const focused = focusedScenarioId === row.id;
              return (
                <div
                  key={row.id}
                  className={`table-data-row${focused ? " focused" : ""}${vRow.index % 2 ? " alt" : ""}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: totalWidth,
                    height: ROW_H,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <button
                    type="button"
                    className="td td-id"
                    style={{ width: CELL_ID_W }}
                    onClick={() =>
                      setFocusedScenarioId(focused ? null : row.id)
                    }
                    title="Focus scenario"
                  >
                    {row.id + 1}
                  </button>
                  {GAME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className="td td-game"
                      style={{ width: CELL_GAME_W }}
                      title={`${GAME_SLOT_LABELS[slot]}: ${row.games[slot]}`}
                      onClick={() => {
                        setFocusedScenarioId(row.id);
                        setGameDetailSlot(slot);
                      }}
                    >
                      {row.games[slot]}
                    </button>
                  ))}
                  {selectedEntryIds.map((eid) => (
                    <div key={eid} className="td td-score" style={{ width: CELL_SCORE_W }}>
                      {formatScore(row.scores[eid])}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatScore(n: number | undefined) {
  if (n === undefined || Number.isNaN(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
