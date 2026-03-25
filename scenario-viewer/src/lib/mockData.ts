import type { ScenarioDataset, ScenarioRow } from "./types";
import { GAME_SLOTS } from "./types";

function mockRow(id: number): ScenarioRow {
  const teams = ["Duke", "Kansas", "Houston", "Purdue", "Arizona", "Tennessee"];
  const games = Object.fromEntries(
    GAME_SLOTS.map((s, i) => [s, teams[(id + i) % teams.length]]),
  ) as ScenarioRow["games"];
  const scores: Record<string, number> = {
    Alice: 200 + (id % 50),
    Bob: 210 + (id % 40),
    Carol: 195 + (id % 60),
  };
  return { id, games, scores };
}

/** Tiny dataset for local dev without loading the real CSV */
export function buildMockDataset(n = 120): ScenarioDataset {
  const rows = Array.from({ length: n }, (_, i) => mockRow(i));
  return {
    gameSlots: [...GAME_SLOTS],
    entryIds: ["Alice", "Bob", "Carol"],
    rows,
  };
}
