import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { countMustWins, picksLineLower } from "../lib/parseCriticalPath";
import type { CriticalPathRow } from "../lib/criticalPathTypes";
import { GAME_SLOTS, type GameSlot } from "../lib/types";
import { GAME_SLOT_LABELS } from "../lib/slotLabels";
import { useCriticalPathStore, type MustWinSortKey } from "../store/criticalPathStore";

const ROW_H = 32;
const W_ENTRY = 200;
const W_PLACE = 64;
const W_COUNT = 52;
const W_SLOT = 92;

function finishingPlaceLabel(n: number): string {
  const r = Math.round(n);
  if (r < 1) return String(n);
  const v = r % 100;
  if (v >= 11 && v <= 13) return `${r}th`;
  switch (r % 10) {
    case 1:
      return `${r}st`;
    case 2:
      return `${r}nd`;
    case 3:
      return `${r}rd`;
    default:
      return `${r}th`;
  }
}

function useFilteredSortedRows(): CriticalPathRow[] {
  const rows = useCriticalPathStore((s) => s.rows);
  const entrySearch = useCriticalPathStore((s) => s.entrySearch);
  const pickSearch = useCriticalPathStore((s) => s.pickSearch);
  const showPlace1 = useCriticalPathStore((s) => s.showPlace1);
  const showPlace2 = useCriticalPathStore((s) => s.showPlace2);
  const showPlace3 = useCriticalPathStore((s) => s.showPlace3);
  const showPlace4 = useCriticalPathStore((s) => s.showPlace4);
  const additionalPlaces = useCriticalPathStore((s) => s.additionalPlaces);
  const requirePickInSlot = useCriticalPathStore((s) => s.requirePickInSlot);
  const sortKey = useCriticalPathStore((s) => s.sortKey);
  const sortDir = useCriticalPathStore((s) => s.sortDir);

  return useMemo(() => {
    const qEntry = entrySearch.trim().toLowerCase();
    const qPick = pickSearch.trim().toLowerCase();
    const extraSet = new Set(additionalPlaces);
    const anyPlace =
      showPlace1 || showPlace2 || showPlace3 || showPlace4 || additionalPlaces.length > 0;

    const placeAllowed = (fp: number) =>
      (fp === 1 && showPlace1) ||
      (fp === 2 && showPlace2) ||
      (fp === 3 && showPlace3) ||
      (fp === 4 && showPlace4) ||
      extraSet.has(fp);

    let out = rows.filter((row) => {
      if (qEntry && !row.entry.toLowerCase().includes(qEntry)) return false;
      if (qPick && !picksLineLower(row.picks).includes(qPick)) return false;
      if (!anyPlace) return false;

      const fp = Math.round(row.finishingPlace);
      if (!Number.isFinite(row.finishingPlace) || fp < 1) return false;
      if (!placeAllowed(fp)) return false;

      if (requirePickInSlot && !row.picks[requirePickInSlot]?.trim()) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      if (sortKey === "entry") {
        const c = a.entry.localeCompare(b.entry, undefined, { sensitivity: "base" });
        if (c !== 0) return dir * c;
        return a.finishingPlace - b.finishingPlace;
      }
      if (sortKey === "place") {
        const d = a.finishingPlace - b.finishingPlace;
        if (d !== 0) return dir * d;
        return a.entry.localeCompare(b.entry, undefined, { sensitivity: "base" });
      }
      const ca = countMustWins(a.picks);
      const cb = countMustWins(b.picks);
      if (ca !== cb) return dir * (ca - cb);
      return a.entry.localeCompare(b.entry, undefined, { sensitivity: "base" });
    });

    return out;
  }, [
    rows,
    entrySearch,
    pickSearch,
    showPlace1,
    showPlace2,
    showPlace3,
    showPlace4,
    additionalPlaces,
    requirePickInSlot,
    sortKey,
    sortDir,
  ]);
}

function SortTh({
  label,
  sortKey,
  currentKey,
  sortDir,
  onSort,
  width,
  className = "",
}: {
  label: string;
  sortKey: MustWinSortKey;
  currentKey: MustWinSortKey;
  sortDir: "asc" | "desc";
  onSort: (k: MustWinSortKey) => void;
  width: number;
  className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <button
      type="button"
      className={`th mustwin-th sortable${active ? " active" : ""}${className ? ` ${className}` : ""}`}
      style={{ width }}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      {active && <span className="sort-indicator">{sortDir === "asc" ? " ▲" : " ▼"}</span>}
    </button>
  );
}

export function MustWinPanel() {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadStatus = useCriticalPathStore((s) => s.loadStatus);
  const rows = useCriticalPathStore((s) => s.rows);
  const entrySearch = useCriticalPathStore((s) => s.entrySearch);
  const pickSearch = useCriticalPathStore((s) => s.pickSearch);
  const showPlace1 = useCriticalPathStore((s) => s.showPlace1);
  const showPlace2 = useCriticalPathStore((s) => s.showPlace2);
  const showPlace3 = useCriticalPathStore((s) => s.showPlace3);
  const showPlace4 = useCriticalPathStore((s) => s.showPlace4);
  const requirePickInSlot = useCriticalPathStore((s) => s.requirePickInSlot);
  const sortKey = useCriticalPathStore((s) => s.sortKey);
  const sortDir = useCriticalPathStore((s) => s.sortDir);
  const setEntrySearch = useCriticalPathStore((s) => s.setEntrySearch);
  const setPickSearch = useCriticalPathStore((s) => s.setPickSearch);
  const setShowPlace = useCriticalPathStore((s) => s.setShowPlace);
  const additionalPlaces = useCriticalPathStore((s) => s.additionalPlaces);
  const addAdditionalPlace = useCriticalPathStore((s) => s.addAdditionalPlace);
  const removeAdditionalPlace = useCriticalPathStore((s) => s.removeAdditionalPlace);
  const setRequirePickInSlot = useCriticalPathStore((s) => s.setRequirePickInSlot);
  const setSortKey = useCriticalPathStore((s) => s.setSort);
  const toggleSortDir = useCriticalPathStore((s) => s.toggleSortDir);
  const resetFilters = useCriticalPathStore((s) => s.resetFilters);

  const [placeDraft, setPlaceDraft] = useState("");

  const filtered = useFilteredSortedRows();

  const commitAdditionalPlace = () => {
    const t = placeDraft.trim();
    if (!t) return;
    const n = Number(t);
    if (!Number.isFinite(n)) return;
    const r = Math.round(n);
    if (r < 1) return;
    addAdditionalPlace(r);
    setPlaceDraft("");
  };

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 15,
  });

  const totalWidth = W_ENTRY + W_PLACE + W_COUNT + GAME_SLOTS.length * W_SLOT;

  const onSortClick = (key: MustWinSortKey) => {
    if (sortKey === key) toggleSortDir();
    else setSortKey(key, "asc");
  };

  if (loadStatus !== "ready") {
    return <p className="status loading">Loading must-win paths…</p>;
  }

  if (rows.length === 0) {
    return (
      <section className="panel mustwin-panel" aria-label="Must-win games">
        <div className="panel-head">
          <h2>Must-win games</h2>
          <p className="muted">
            No critical-path file is available. For local dev, add{" "}
            <code>*_critical_path_*.csv</code> under <code>output/2026</code> or place{" "}
            <code>critical_path.csv.gz</code> in <code>public/data</code>. Use{" "}
            <code>python3 scripts/prepare_viewer_data.py … --critical-path …</code> before deploy.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel mustwin-panel" aria-label="Must-win games">
      <div className="panel-head">
        <h2>Must-win games</h2>
        <p className="muted">
          Each row is one way a bracket can finish in a given place. Filled cells are games that bracket{" "}
          <strong>must</strong> pick correctly for that outcome. Filter and sort below; scroll horizontally for
          all rounds.
        </p>

        <div className="mustwin-toolbar">
          <label className="mustwin-field">
            <span className="mustwin-field-label">Search bracket</span>
            <input
              type="search"
              className="search-input mustwin-input"
              placeholder="Entry name…"
              value={entrySearch}
              onChange={(e) => setEntrySearch(e.target.value)}
              aria-label="Filter by bracket name"
            />
          </label>
          <label className="mustwin-field">
            <span className="mustwin-field-label">Pick contains</span>
            <input
              type="search"
              className="search-input mustwin-input"
              placeholder="Team text in any must-win cell…"
              value={pickSearch}
              onChange={(e) => setPickSearch(e.target.value)}
              aria-label="Filter by text in must-win picks"
            />
          </label>
          <fieldset className="mustwin-field mustwin-places">
            <legend className="mustwin-field-label">Finish place</legend>
            <label className="checkbox-line compact">
              <input type="checkbox" checked={showPlace1} onChange={(e) => setShowPlace(1, e.target.checked)} />
              <span>1st</span>
            </label>
            <label className="checkbox-line compact">
              <input type="checkbox" checked={showPlace2} onChange={(e) => setShowPlace(2, e.target.checked)} />
              <span>2nd</span>
            </label>
            <label className="checkbox-line compact">
              <input type="checkbox" checked={showPlace3} onChange={(e) => setShowPlace(3, e.target.checked)} />
              <span>3rd</span>
            </label>
            <label className="checkbox-line compact">
              <input type="checkbox" checked={showPlace4} onChange={(e) => setShowPlace(4, e.target.checked)} />
              <span>4th</span>
            </label>
          </fieldset>
          <div className="mustwin-field mustwin-add-place">
            <span className="mustwin-field-label">Other finish places</span>
            <p className="muted mustwin-add-place-hint">
              Enter any rank (5 for 5th, 12 for 12th, …) and add it to the table filter. You can add several.
            </p>
            <div className="mustwin-add-place-row">
              <input
                type="number"
                className="search-input mustwin-input mustwin-place-input"
                min={1}
                step={1}
                inputMode="numeric"
                placeholder="e.g. 5"
                value={placeDraft}
                onChange={(e) => setPlaceDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitAdditionalPlace();
                  }
                }}
                aria-label="Finish place rank to add"
              />
              <button type="button" className="btn secondary" onClick={commitAdditionalPlace}>
                Add place
              </button>
            </div>
            {additionalPlaces.length > 0 && (
              <ul className="mustwin-place-chips" aria-label="Extra finish places included">
                {additionalPlaces.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      className="mustwin-place-chip"
                      onClick={() => removeAdditionalPlace(p)}
                      title={`Remove ${finishingPlaceLabel(p)}`}
                      aria-label={`Remove ${finishingPlaceLabel(p)} from filter`}
                    >
                      <span>{finishingPlaceLabel(p)}</span>
                      <span className="mustwin-place-chip-x" aria-hidden>
                        ×
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label className="mustwin-field">
            <span className="mustwin-field-label">Must have pick in</span>
            <select
              className="mustwin-select"
              value={requirePickInSlot ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setRequirePickInSlot(v === "" ? null : (v as GameSlot));
              }}
              aria-label="Require a non-empty must-win in this round"
            >
              <option value="">Any slot</option>
              {GAME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
          <div className="mustwin-toolbar-actions">
            <button type="button" className="btn secondary" onClick={() => resetFilters()}>
              Reset filters
            </button>
          </div>
        </div>

        <p className="muted mustwin-count">
          Showing <strong>{filtered.length.toLocaleString()}</strong> of {rows.length.toLocaleString()} paths
        </p>
      </div>

      <div className="table-scroll mustwin-scroll" ref={parentRef}>
        <div className="table-inner" style={{ width: totalWidth, height: rowVirtualizer.getTotalSize() + 40 }}>
          <div className="table-header-row mustwin-header-row" style={{ width: totalWidth }}>
            <SortTh
              label="Bracket"
              sortKey="entry"
              currentKey={sortKey}
              sortDir={sortDir}
              onSort={onSortClick}
              width={W_ENTRY}
              className="th-entry-col"
            />
            <SortTh
              label="Place"
              sortKey="place"
              currentKey={sortKey}
              sortDir={sortDir}
              onSort={onSortClick}
              width={W_PLACE}
            />
            <SortTh
              label="#"
              sortKey="mustWins"
              currentKey={sortKey}
              sortDir={sortDir}
              onSort={onSortClick}
              width={W_COUNT}
            />
            {GAME_SLOTS.map((slot) => (
              <div
                key={slot}
                className="th th-game mustwin-slot-th"
                style={{ width: W_SLOT }}
                title={GAME_SLOT_LABELS[slot]}
              >
                <span className="th-slot">{slot}</span>
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
              const row = filtered[vRow.index]!;
              const nWin = countMustWins(row.picks);
              return (
                <div
                  key={row.id}
                  className={`table-data-row mustwin-row${vRow.index % 2 ? " alt" : ""}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: totalWidth,
                    height: ROW_H,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <div className="td td-entry" style={{ width: W_ENTRY }} title={row.entry}>
                    {row.entry}
                  </div>
                  <div className="td td-place" style={{ width: W_PLACE }}>
                    {finishingPlaceLabel(row.finishingPlace)}
                  </div>
                  <div className="td td-count" style={{ width: W_COUNT }}>
                    {nWin}
                  </div>
                  {GAME_SLOTS.map((slot) => {
                    const v = row.picks[slot];
                    return (
                      <div
                        key={slot}
                        className={`td td-game mustwin-pick${v ? " has-pick" : ""}`}
                        style={{ width: W_SLOT }}
                        title={v ? `${GAME_SLOT_LABELS[slot]}: ${v}` : GAME_SLOT_LABELS[slot]}
                      >
                        {v || "—"}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
