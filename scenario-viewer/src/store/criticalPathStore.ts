import { create } from "zustand";
import type { GameSlot } from "../lib/types";

export type MustWinSortKey = "entry" | "place" | "mustWins";

type State = {
  rows: import("../lib/criticalPathTypes").CriticalPathRow[];
  loadStatus: "idle" | "loading" | "ready";
  entrySearch: string;
  pickSearch: string;
  showPlace1: boolean;
  showPlace2: boolean;
  showPlace3: boolean;
  showPlace4: boolean;
  /** Extra finishing ranks to include (e.g. 5 for 5th place), sorted ascending. */
  additionalPlaces: number[];
  /** If set, row must have a non-empty must-win in this slot. */
  requirePickInSlot: GameSlot | null;
  sortKey: MustWinSortKey;
  sortDir: "asc" | "desc";

  setRows: (rows: State["rows"]) => void;
  setLoadStatus: (s: State["loadStatus"]) => void;
  setEntrySearch: (q: string) => void;
  setPickSearch: (q: string) => void;
  setShowPlace: (place: 1 | 2 | 3 | 4, on: boolean) => void;
  addAdditionalPlace: (n: number) => void;
  removeAdditionalPlace: (n: number) => void;
  setRequirePickInSlot: (slot: GameSlot | null) => void;
  setSort: (key: MustWinSortKey, dir?: "asc" | "desc") => void;
  toggleSortDir: () => void;
  resetFilters: () => void;
};

const defaultFilters = {
  entrySearch: "",
  pickSearch: "",
  showPlace1: true,
  showPlace2: true,
  showPlace3: true,
  showPlace4: true,
  additionalPlaces: [] as number[],
  requirePickInSlot: null as GameSlot | null,
  sortKey: "entry" as MustWinSortKey,
  sortDir: "asc" as const,
};

export const useCriticalPathStore = create<State>((set) => ({
  rows: [],
  loadStatus: "idle",
  ...defaultFilters,

  setRows: (rows) => set({ rows, loadStatus: "ready" }),
  setLoadStatus: (loadStatus) => set({ loadStatus }),

  setEntrySearch: (entrySearch) => set({ entrySearch }),
  setPickSearch: (pickSearch) => set({ pickSearch }),
  setShowPlace: (place, on) => {
    if (place === 1) set({ showPlace1: on });
    else if (place === 2) set({ showPlace2: on });
    else if (place === 3) set({ showPlace3: on });
    else set({ showPlace4: on });
  },
  addAdditionalPlace: (n) =>
    set((s) => {
      const r = Math.round(Number(n));
      if (!Number.isFinite(r) || r < 1) return s;
      if (s.additionalPlaces.includes(r)) return s;
      return { additionalPlaces: [...s.additionalPlaces, r].sort((a, b) => a - b) };
    }),
  removeAdditionalPlace: (n) =>
    set((s) => ({
      additionalPlaces: s.additionalPlaces.filter((x) => x !== n),
    })),
  setRequirePickInSlot: (requirePickInSlot) => set({ requirePickInSlot }),
  setSort: (sortKey, dir) =>
    set((s) => ({
      sortKey,
      sortDir: dir ?? (s.sortKey === sortKey ? s.sortDir : "asc"),
    })),
  toggleSortDir: () => set((s) => ({ sortDir: s.sortDir === "asc" ? "desc" : "asc" })),
  resetFilters: () => set({ ...defaultFilters }),
}));
