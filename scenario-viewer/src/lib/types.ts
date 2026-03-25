/** One enumerated tournament finish: last 15 games (Elite 8 → champion) + pool scores. */
export type ScenarioRow = {
  /** Row index in the source file (0-based), stable under filters */
  id: number;
  games: Record<GameSlot, string>;
  scores: Record<string, number>;
};

export const GAME_SLOTS = [
  "EE1",
  "EE2",
  "EE3",
  "EE4",
  "EE5",
  "EE6",
  "EE7",
  "EE8",
  "FinalFour1",
  "FinalFour2",
  "FinalFour3",
  "FinalFour4",
  "Finalist1",
  "Finalist2",
  "Champ",
] as const;

export type GameSlot = (typeof GAME_SLOTS)[number];

export function isGameSlot(s: string): s is GameSlot {
  return (GAME_SLOTS as readonly string[]).includes(s);
}

export type ScenarioDataset = {
  gameSlots: GameSlot[];
  entryIds: string[];
  rows: ScenarioRow[];
};
