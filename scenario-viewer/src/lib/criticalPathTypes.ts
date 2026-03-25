import type { GameSlot } from "./types";

/** One row from run_critical_path_*.csv: path to finish in a given place. */
export type CriticalPathRow = {
  /** Stable index in source file order */
  id: number;
  entry: string;
  /** Competition finishing place (usually 1–4). */
  finishingPlace: number;
  /** Non-empty cells are must-win picks for that game slot. */
  picks: Record<GameSlot, string>;
};

export type CriticalPathDataset = {
  rows: CriticalPathRow[];
};
