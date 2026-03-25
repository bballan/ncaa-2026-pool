import type { GameSlot } from "./types";

/** Human-readable labels for scenario CSV columns */
export const GAME_SLOT_LABELS: Record<GameSlot, string> = {
  EE1: "Elite 8 — game 1",
  EE2: "Elite 8 — game 2",
  EE3: "Elite 8 — game 3",
  EE4: "Elite 8 — game 4",
  EE5: "Elite 8 — game 5",
  EE6: "Elite 8 — game 6",
  EE7: "Elite 8 — game 7",
  EE8: "Elite 8 — game 8",
  FinalFour1: "Final Four — game 1",
  FinalFour2: "Final Four — game 2",
  FinalFour3: "Final Four — game 3",
  FinalFour4: "Final Four — game 4",
  Finalist1: "Championship — finalist 1",
  Finalist2: "Championship — finalist 2",
  Champ: "National champion",
};
