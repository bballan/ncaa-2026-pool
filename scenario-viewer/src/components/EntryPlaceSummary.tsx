import { useMemo } from "react";
import { computeEntryPlaceChances } from "../lib/placeChances";
import { useFilteredRows } from "../hooks/useFilteredRows";
import { useScenarioStore } from "../store/scenarioStore";

function pct(x: number) {
  if (x === 0) return "0%";
  if (x < 0.0005) return "<0.1%";
  return `${(100 * x).toFixed(1)}%`;
}

export function EntryPlaceSummary() {
  const dataset = useScenarioStore((s) => s.dataset);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);
  const filteredRows = useFilteredRows();

  const rows = useMemo(() => {
    if (!dataset) return [];
    return computeEntryPlaceChances(filteredRows, dataset.entryIds);
  }, [dataset, filteredRows]);

  if (!dataset) return null;

  const n = filteredRows.length;
  const selected = new Set(selectedEntryIds);

  return (
    <section className="panel entry-place-summary" aria-label="Finish place chances by entry">
      <div className="panel-head">
        <h2>Place chances (1st–4th)</h2>
        <p className="muted">
          Among all pool entries, each row’s ranks use competition scoring (ties share rank). Percentages
          are the share of <strong>currently filtered</strong> scenarios ({n.toLocaleString()} total).
        </p>
      </div>
      <div className="entry-place-scroll">
        <table className="entry-place-table">
          <thead>
            <tr>
              <th scope="col">Entry</th>
              <th scope="col">1st</th>
              <th scope="col">2nd</th>
              <th scope="col">3rd</th>
              <th scope="col">4th</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.entryId}
                className={selected.has(r.entryId) ? "entry-place-selected" : undefined}
              >
                <th scope="row" className="entry-place-name">
                  {r.entryId}
                </th>
                <td>{pct(r.pFirst)}</td>
                <td>{pct(r.pSecond)}</td>
                <td>{pct(r.pThird)}</td>
                <td>{pct(r.pFourth)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
