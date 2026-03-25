import type { GameFilters, PlaceOutcomeFilter } from "../store/scenarioStore";
import { useScenarioStore } from "../store/scenarioStore";
import type { GameSlot, ScenarioDataset } from "./types";
import { GAME_SLOTS, isGameSlot } from "./types";

let applyingFromUrl = false;
/** While true, do not write the store to the URL (avoids wiping the query between `setDataset` and `applyScenarioUrlQuery`). */
let urlHydrationSuspended = false;

function teamsForSlot(dataset: ScenarioDataset, slot: GameSlot): Set<string> {
  const s = new Set<string>();
  for (const row of dataset.rows) s.add(row.games[slot]);
  return s;
}

function sameEntrySelection(selected: string[], allIds: string[]): boolean {
  if (selected.length !== allIds.length) return false;
  const set = new Set(selected);
  return allIds.every((id) => set.has(id));
}

/** Read viewer state from the query string and apply in one store update (after dataset load). */
export function applyScenarioUrlQuery(params: URLSearchParams, dataset: ScenarioDataset): void {
  applyingFromUrl = true;
  try {
    const q = params.get("q") ?? "";

    let selectedEntryIds: string[];
    if (params.get("noentries") === "1") {
      selectedEntryIds = [];
    } else {
      const fromParams = params.getAll("entry").map((s) => s.trim()).filter(Boolean);
      if (fromParams.length > 0) {
        selectedEntryIds = fromParams.filter((id) => dataset.entryIds.includes(id));
        if (selectedEntryIds.length === 0) selectedEntryIds = [...dataset.entryIds];
      } else {
        selectedEntryIds = [...dataset.entryIds];
      }
    }

    const gameFilters: GameFilters = {};
    for (const slot of GAME_SLOTS) {
      const raw = params.getAll(slot);
      if (raw.length === 0) continue;
      const allowed = teamsForSlot(dataset, slot);
      const teams = raw.map((t) => t.trim()).filter((t) => allowed.has(t));
      if (teams.length > 0) gameFilters[slot] = new Set(teams);
    }

    let focusedScenarioId: number | null = null;
    const focusRaw = params.get("focus");
    if (focusRaw !== null && focusRaw !== "") {
      const id = Number(focusRaw);
      if (Number.isInteger(id) && dataset.rows.some((r) => r.id === id)) focusedScenarioId = id;
    }

    let placeOutcomeFilter: PlaceOutcomeFilter | null = null;
    const placeFor = params.get("placeFor");
    const placeRank = params.get("placeRank");
    if (placeFor && placeFor.trim() && placeRank) {
      const p = Number(placeRank);
      if (p === 1 || p === 2 || p === 3 || p === 4) {
        const entryId = placeFor.trim();
        if (dataset.entryIds.includes(entryId)) placeOutcomeFilter = { entryId, place: p };
      }
    }

    let gameDetailSlot: GameSlot | null = null;
    const slotRaw = params.get("gameSlot");
    if (slotRaw && isGameSlot(slotRaw)) gameDetailSlot = slotRaw;

    useScenarioStore.setState({
      searchBracket: q,
      selectedEntryIds,
      gameFilters,
      focusedScenarioId,
      placeOutcomeFilter,
      gameDetailSlot,
    });
  } finally {
    applyingFromUrl = false;
  }
}

function appendMockPreserve(out: URLSearchParams): void {
  const cur = new URLSearchParams(window.location.search);
  if (cur.get("mock") === "1") out.set("mock", "1");
}

/** Build query string for shareable viewer state (non-default values only). */
export function buildScenarioSearchParams(
  dataset: ScenarioDataset,
  searchBracket: string,
  selectedEntryIds: string[],
  gameFilters: GameFilters,
  focusedScenarioId: number | null,
  placeOutcomeFilter: PlaceOutcomeFilter | null,
  gameDetailSlot: GameSlot | null,
): URLSearchParams {
  const out = new URLSearchParams();
  appendMockPreserve(out);

  if (searchBracket.trim()) out.set("q", searchBracket.trim());

  if (selectedEntryIds.length === 0) {
    out.set("noentries", "1");
  } else if (!sameEntrySelection(selectedEntryIds, dataset.entryIds)) {
    for (const id of selectedEntryIds) out.append("entry", id);
  }

  for (const slot of GAME_SLOTS) {
    const set = gameFilters[slot];
    if (!set || set.size === 0) continue;
    const teams = [...set].sort((a, b) => a.localeCompare(b));
    for (const t of teams) out.append(slot, t);
  }

  if (focusedScenarioId !== null) out.set("focus", String(focusedScenarioId));

  if (placeOutcomeFilter) {
    out.set("placeFor", placeOutcomeFilter.entryId);
    out.set("placeRank", String(placeOutcomeFilter.place));
  }

  if (gameDetailSlot) out.set("gameSlot", gameDetailSlot);

  return out;
}

export function isApplyingScenarioUrl(): boolean {
  return applyingFromUrl;
}

/** Call before `setDataset` + `applyScenarioUrlQuery`; pair with `endScenarioUrlHydration`. */
export function beginScenarioUrlHydration(): void {
  urlHydrationSuspended = true;
}

/** Re-enables URL sync and pushes the current store state to the address bar once. */
export function endScenarioUrlHydration(): void {
  urlHydrationSuspended = false;
  syncLocationSearchFromStore();
}

export function syncLocationSearchFromStore(): void {
  if (applyingFromUrl || urlHydrationSuspended) return;
  const { dataset, searchBracket, selectedEntryIds, gameFilters, focusedScenarioId, placeOutcomeFilter, gameDetailSlot } =
    useScenarioStore.getState();
  if (!dataset) return;

  const qs = buildScenarioSearchParams(
    dataset,
    searchBracket,
    selectedEntryIds,
    gameFilters,
    focusedScenarioId,
    placeOutcomeFilter,
    gameDetailSlot,
  );
  const next = qs.toString() ? `?${qs.toString()}` : "";
  if (next === window.location.search) return;
  const url = `${window.location.pathname}${next}${window.location.hash}`;
  history.replaceState(null, "", url);
}
