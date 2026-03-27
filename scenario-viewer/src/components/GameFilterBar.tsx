import { useMemo } from "react";
import type { GameSlot } from "../lib/types";
import { GAME_SLOTS } from "../lib/types";
import { GAME_SLOT_LABELS } from "../lib/slotLabels";
import { gameFiltersActive } from "../lib/analysisRows";
import { useAnalysisRows } from "../hooks/useAnalysisRows";
import { useScenarioStore } from "../store/scenarioStore";

function useTeamOptionsBySlot() {
  const dataset = useScenarioStore((s) => s.dataset);
  return useMemo(() => {
    const map = new Map<GameSlot, Set<string>>();
    for (const s of GAME_SLOTS) map.set(s, new Set());
    if (!dataset) return map;
    for (const row of dataset.rows) {
      for (const s of GAME_SLOTS) {
        map.get(s)!.add(row.games[s]);
      }
    }
    return map;
  }, [dataset]);
}

function GameSlotFilter({
  slot,
  teams,
}: {
  slot: GameSlot;
  teams: string[];
}) {
  const gameFilters = useScenarioStore((s) => s.gameFilters);
  const setGameFilter = useScenarioStore((s) => s.setGameFilter);
  const active = gameFilters[slot];

  return (
    <label className="game-filter-field">
      <span className="game-filter-label">{slot}</span>
      <select
        className="game-filter-select"
        multiple
        size={Math.min(6, Math.max(3, teams.length))}
        value={active ? [...active] : []}
        onChange={(e) => {
          const selected = [...e.target.selectedOptions].map((o) => o.value);
          setGameFilter(slot, selected);
        }}
        aria-label={`Filter scenarios by ${GAME_SLOT_LABELS[slot]}`}
      >
        {teams.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function placeOrdinal(p: 1 | 2 | 3 | 4) {
  return (["1st", "2nd", "3rd", "4th"] as const)[p - 1];
}

export function GameFilterBar() {
  const clearGameFilters = useScenarioStore((s) => s.clearGameFilters);
  const completedGameDefaults = useScenarioStore((s) => s.completedGameDefaults);
  const placeOutcomeFilter = useScenarioStore((s) => s.placeOutcomeFilter);
  const setPlaceOutcomeFilter = useScenarioStore((s) => s.setPlaceOutcomeFilter);
  const dataset = useScenarioStore((s) => s.dataset);
  const gameFilters = useScenarioStore((s) => s.gameFilters);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);
  const analysisRows = useAnalysisRows();
  const teamMap = useTeamOptionsBySlot();

  if (!dataset) return null;

  const gamesActive = gameFiltersActive(gameFilters);
  const hasCompletedDefaults = Object.keys(completedGameDefaults).length > 0;
  const narrowedBrackets =
    selectedEntryIds.length > 0 && selectedEntryIds.length < dataset.entryIds.length;
  const topFourNote =
    !gamesActive && narrowedBrackets
      ? "With no game filters, the outcomes table and place chances only include scenarios where at least one bracket in the place table can finish 1st–4th."
      : null;

  return (
    <section className="panel game-filters" aria-label="Filter by game winners">
      <div className="panel-head">
        <h2>Scenario filters</h2>
        <p className="muted">
          Hold <kbd>⌘</kbd>/<kbd>Ctrl</kbd> to pick multiple winners per game. Empty = no filter.
          {hasCompletedDefaults && (
            <>
              {" "}
              Known finished games load with winners pre-selected (from pool metadata); clear or change as
              needed.
            </>
          )}
        </p>
        <div className="filter-meta">
          <span>
            Showing <strong>{analysisRows.length}</strong> of {dataset.rows.length} scenarios
          </span>
          {placeOutcomeFilter && (
            <span className="place-filter-chip" title="From place-chances table">
              Place: <strong>{placeOutcomeFilter.entryId}</strong> {placeOrdinal(placeOutcomeFilter.place)}
            </span>
          )}
          <button type="button" className="btn secondary" onClick={() => clearGameFilters()}>
            Clear game filters
          </button>
          {placeOutcomeFilter && (
            <button type="button" className="btn secondary" onClick={() => setPlaceOutcomeFilter(null)}>
              Clear place filter
            </button>
          )}
        </div>
        {topFourNote && <p className="muted filter-note">{topFourNote}</p>}
      </div>
      <div className="game-filter-grid">
        {GAME_SLOTS.map((slot) => (
          <GameSlotFilter
            key={slot}
            slot={slot}
            teams={[...(teamMap.get(slot) ?? [])].sort((a, b) => a.localeCompare(b))}
          />
        ))}
      </div>
    </section>
  );
}
