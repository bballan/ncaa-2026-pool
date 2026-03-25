import { useMemo, useState } from "react";
import type { EntryPlaceChances } from "../lib/placeChances";
import { computeEntryPlaceChances } from "../lib/placeChances";
import { useAnalysisRows } from "../hooks/useAnalysisRows";
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

export function EntryPlaceSummary() {
  const dataset = useScenarioStore((s) => s.dataset);
  const entryRankCache = useScenarioStore((s) => s.entryRankCache);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);
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

  return (
    <section className="panel entry-place-summary" aria-label="Finish place chances by entry">
      <div className="panel-head">
        <h2>Place chances (1st–4th)</h2>
        <p className="muted">
          {narrowed ? (
            <>
              Showing only brackets selected in <strong>Brackets to compare</strong>. Ranks still use the
              full pool; each cell is <strong>scenario count (percent)</strong> over the same scenarios as the
              outcomes table ({n.toLocaleString()} total). Click a column header to sort.
            </>
          ) : (
            <>
              Each cell is <strong>scenario count (percent)</strong> over the same scenarios as the outcomes
              table ({n.toLocaleString()} total). Click a column header to sort. With no game filters, that
              set excludes scenarios where no visible bracket can finish 1st–4th; narrow brackets in the
              sidebar to apply that rule to a subset.
            </>
          )}
        </p>
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
                <td>{countWithPct(r.nFirst, r.pFirst)}</td>
                <td>{countWithPct(r.nSecond, r.pSecond)}</td>
                <td>{countWithPct(r.nThird, r.pThird)}</td>
                <td>{countWithPct(r.nFourth, r.pFourth)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
