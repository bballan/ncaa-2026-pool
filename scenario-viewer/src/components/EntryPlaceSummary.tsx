import { useMemo, useState } from "react";
import type { EntryPlaceChances } from "../lib/placeChances";
import { computeEntryPlaceChances } from "../lib/placeChances";
import { useAnalysisRows } from "../hooks/useAnalysisRows";
import type { PlaceOutcomeFilter } from "../store/scenarioStore";
import { useScenarioStore } from "../store/scenarioStore";

type SortCol = "entry" | "first" | "second" | "third" | "fourth";
type SortDir = "asc" | "desc";

function pct(x: number) {
  if (x === 0) return "0%";
  if (x < 0.0005) return "<0.1%";
  return `${(100 * x).toFixed(1)}%`;
}

function countWithPct(count: number, p: number) {
  return `${count.toLocaleString()} (${pct(p)})`;
}

function sortRows(rows: EntryPlaceChances[], col: SortCol, dir: SortDir): EntryPlaceChances[] {
  const out = [...rows];
  out.sort((a, b) => {
    let c = 0;
    switch (col) {
      case "entry":
        c = a.entryId.localeCompare(b.entryId);
        break;
      case "first":
        c = a.nFirst - b.nFirst;
        break;
      case "second":
        c = a.nSecond - b.nSecond;
        break;
      case "third":
        c = a.nThird - b.nThird;
        break;
      case "fourth":
        c = a.nFourth - b.nFourth;
        break;
      default:
        break;
    }
    return dir === "asc" ? c : -c;
  });
  return out;
}

function defaultDirForColumn(col: SortCol): SortDir {
  return col === "entry" ? "asc" : "desc";
}

const PLACE_BY_COL: Record<Exclude<SortCol, "entry">, PlaceOutcomeFilter["place"]> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
};

function placeColLabel(place: PlaceOutcomeFilter["place"]) {
  return (["1st", "2nd", "3rd", "4th"] as const)[place - 1];
}

export function EntryPlaceSummary() {
  const dataset = useScenarioStore((s) => s.dataset);
  const entryRankCache = useScenarioStore((s) => s.entryRankCache);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);
  const placeOutcomeFilter = useScenarioStore((s) => s.placeOutcomeFilter);
  const setPlaceOutcomeFilter = useScenarioStore((s) => s.setPlaceOutcomeFilter);
  const analysisRows = useAnalysisRows();
  const [sortCol, setSortCol] = useState<SortCol>("first");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    if (!dataset) return [];
    return computeEntryPlaceChances(analysisRows, dataset.entryIds, entryRankCache);
  }, [dataset, analysisRows, entryRankCache]);

  const visibleRows = useMemo(() => {
    if (selectedEntryIds.length === 0) return rows;
    const sel = new Set(selectedEntryIds);
    return rows.filter((r) => sel.has(r.entryId));
  }, [rows, selectedEntryIds]);

  const sortedRows = useMemo(
    () => sortRows(visibleRows, sortCol, sortDir),
    [visibleRows, sortCol, sortDir],
  );

  const onHeaderClick = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(defaultDirForColumn(col));
    }
  };

  const ariaSort = (col: SortCol): "ascending" | "descending" | "none" => {
    if (sortCol !== col) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  if (!dataset) return null;

  const n = analysisRows.length;
  const narrowed =
    selectedEntryIds.length > 0 && selectedEntryIds.length < dataset.entryIds.length;

  const onPlaceCellClick = (entryId: string, col: Exclude<SortCol, "entry">) => {
    const place = PLACE_BY_COL[col];
    if (placeOutcomeFilter?.entryId === entryId && placeOutcomeFilter.place === place) {
      setPlaceOutcomeFilter(null);
    } else {
      setPlaceOutcomeFilter({ entryId, place });
    }
  };

  return (
    <section className="panel entry-place-summary" aria-label="Finish place chances by entry">
      <div className="panel-head">
        <h2>Place chances (1st–4th)</h2>
        <p className="muted">
          {narrowed ? (
            <>
              Showing only brackets selected in <strong>Brackets to compare</strong>. Ranks still use the
              full pool; each cell is <strong>scenario count (percent)</strong> over the same scenarios as the
              outcomes table ({n.toLocaleString()} total). Click a column header to sort; click a count cell
              to filter the outcomes table to that finish for that entry (click again to clear).
            </>
          ) : (
            <>
              Each cell is <strong>scenario count (percent)</strong> over the same scenarios as the outcomes
              table ({n.toLocaleString()} total). Click a column header to sort; click a count cell to filter
              outcomes to scenarios where that entry finishes in that place. With no game filters, the base
              set excludes scenarios where no visible bracket can finish 1st–4th.
            </>
          )}
        </p>
        {placeOutcomeFilter && (
          <p className="place-filter-active">
            <span>
              Outcomes filtered: <strong>{placeOutcomeFilter.entryId}</strong> finishes{" "}
              <strong>{placeColLabel(placeOutcomeFilter.place)}</strong> ({n.toLocaleString()} scenarios).
            </span>
            <button type="button" className="btn secondary" onClick={() => setPlaceOutcomeFilter(null)}>
              Clear place filter
            </button>
          </p>
        )}
      </div>
      <div className="entry-place-scroll">
        <table className="entry-place-table">
          <thead>
            <tr>
              <SortTh
                label="Entry"
                sortKey="entry"
                active={sortCol}
                ariaSort={ariaSort("entry")}
                onClick={() => onHeaderClick("entry")}
              />
              <SortTh
                label="1st"
                sortKey="first"
                active={sortCol}
                ariaSort={ariaSort("first")}
                onClick={() => onHeaderClick("first")}
              />
              <SortTh
                label="2nd"
                sortKey="second"
                active={sortCol}
                ariaSort={ariaSort("second")}
                onClick={() => onHeaderClick("second")}
              />
              <SortTh
                label="3rd"
                sortKey="third"
                active={sortCol}
                ariaSort={ariaSort("third")}
                onClick={() => onHeaderClick("third")}
              />
              <SortTh
                label="4th"
                sortKey="fourth"
                active={sortCol}
                ariaSort={ariaSort("fourth")}
                onClick={() => onHeaderClick("fourth")}
              />
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => (
              <tr key={r.entryId}>
                <th scope="row" className="entry-place-name">
                  {r.entryId}
                </th>
                <PlaceFilterTd
                  entryId={r.entryId}
                  place={1}
                  label={countWithPct(r.nFirst, r.pFirst)}
                  active={placeOutcomeFilter?.entryId === r.entryId && placeOutcomeFilter.place === 1}
                  onClick={() => onPlaceCellClick(r.entryId, "first")}
                />
                <PlaceFilterTd
                  entryId={r.entryId}
                  place={2}
                  label={countWithPct(r.nSecond, r.pSecond)}
                  active={placeOutcomeFilter?.entryId === r.entryId && placeOutcomeFilter.place === 2}
                  onClick={() => onPlaceCellClick(r.entryId, "second")}
                />
                <PlaceFilterTd
                  entryId={r.entryId}
                  place={3}
                  label={countWithPct(r.nThird, r.pThird)}
                  active={placeOutcomeFilter?.entryId === r.entryId && placeOutcomeFilter.place === 3}
                  onClick={() => onPlaceCellClick(r.entryId, "third")}
                />
                <PlaceFilterTd
                  entryId={r.entryId}
                  place={4}
                  label={countWithPct(r.nFourth, r.pFourth)}
                  active={placeOutcomeFilter?.entryId === r.entryId && placeOutcomeFilter.place === 4}
                  onClick={() => onPlaceCellClick(r.entryId, "fourth")}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlaceFilterTd({
  entryId,
  place,
  label,
  active,
  onClick,
}: {
  entryId: string;
  place: 1 | 2 | 3 | 4;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <td className="place-filter-td">
      <button
        type="button"
        className={`entry-place-filter-btn${active ? " active" : ""}`}
        onClick={onClick}
        aria-pressed={active}
        aria-label={`Filter outcomes to scenarios where ${entryId} finishes ${placeColLabel(place)}: ${label}`}
      >
        {label}
      </button>
    </td>
  );
}

function SortTh({
  label,
  sortKey,
  active,
  ariaSort: asrt,
  onClick,
}: {
  label: string;
  sortKey: SortCol;
  active: SortCol;
  ariaSort: "ascending" | "descending" | "none";
  onClick: () => void;
}) {
  const isActive = active === sortKey;
  return (
    <th scope="col" aria-sort={asrt}>
      <button type="button" className={`entry-place-sort-btn${isActive ? " active" : ""}`} onClick={onClick}>
        <span>{label}</span>
        {isActive ? (
          <span className="entry-place-sort-ind" aria-hidden>
            {asrt === "ascending" ? "▲" : "▼"}
          </span>
        ) : null}
      </button>
    </th>
  );
}
