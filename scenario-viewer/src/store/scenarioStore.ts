import { create } from "zustand";
import type { GameSlot, ScenarioDataset, ScenarioRow } from "../lib/types";
import { GAME_SLOTS } from "../lib/types";

export type GameFilters = Partial<Record<GameSlot, Set<string>>>;

type State = {
  dataset: ScenarioDataset | null;
  loadStatus: "idle" | "loading" | "ready" | "error";
  loadError: string | null;
  /** Entry (bracket) columns to show in the grid */
  selectedEntryIds: string[];
  /** Subset of teams per slot; row passes if each active filter includes that cell's team */
  gameFilters: GameFilters;
  searchBracket: string;
  /** Highlighted row for detail panels */
  focusedScenarioId: number | null;
  /** Game column opened in the detail modal */
  gameDetailSlot: GameSlot | null;

  setDataset: (d: ScenarioDataset) => void;
  setLoadStatus: (s: State["loadStatus"], err?: string | null) => void;
  setSelectedEntryIds: (ids: string[]) => void;
  toggleEntryId: (id: string) => void;
  setGameFilter: (slot: GameSlot, teams: string[] | null) => void;
  clearGameFilters: () => void;
  setSearchBracket: (q: string) => void;
  setFocusedScenarioId: (id: number | null) => void;
  setGameDetailSlot: (slot: GameSlot | null) => void;
};

function defaultSelectedEntries(entryIds: string[]): string[] {
  const max = 12;
  return entryIds.slice(0, Math.min(max, entryIds.length));
}

export const useScenarioStore = create<State>((set, get) => ({
  dataset: null,
  loadStatus: "idle",
  loadError: null,
  selectedEntryIds: [],
  gameFilters: {},
  searchBracket: "",
  focusedScenarioId: null,
  gameDetailSlot: null,

  setDataset: (d) =>
    set({
      dataset: d,
      selectedEntryIds: defaultSelectedEntries(d.entryIds),
      gameFilters: {},
      loadStatus: "ready",
      loadError: null,
    }),

  setLoadStatus: (s, err = null) => set({ loadStatus: s, loadError: err }),

  setSelectedEntryIds: (ids) => set({ selectedEntryIds: ids }),

  toggleEntryId: (id) => {
    const cur = get().selectedEntryIds;
    if (cur.includes(id)) {
      set({ selectedEntryIds: cur.filter((x) => x !== id) });
    } else {
      set({ selectedEntryIds: [...cur, id] });
    }
  },

  setGameFilter: (slot, teams) => {
    const next = { ...get().gameFilters };
    if (teams === null || teams.length === 0) {
      delete next[slot];
    } else {
      next[slot] = new Set(teams);
    }
    set({ gameFilters: next });
  },

  clearGameFilters: () => set({ gameFilters: {} }),

  setSearchBracket: (q) => set({ searchBracket: q }),

  setFocusedScenarioId: (id) => set({ focusedScenarioId: id }),

  setGameDetailSlot: (slot) => set({ gameDetailSlot: slot }),
}));

export function filterRowsByGames(
  dataset: ScenarioDataset | null,
  gameFilters: GameFilters,
): ScenarioRow[] {
  if (!dataset) return [];
  return dataset.rows.filter((row) => {
    for (const slot of GAME_SLOTS) {
      const allowed = gameFilters[slot];
      if (allowed && allowed.size > 0) {
        const team = row.games[slot];
        if (!allowed.has(team)) return false;
      }
    }
    return true;
  });
}
