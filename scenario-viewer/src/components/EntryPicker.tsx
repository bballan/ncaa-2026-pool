import { useEffect, useMemo, useRef } from "react";
import { useScenarioStore } from "../store/scenarioStore";

export function EntryPicker() {
  const dataset = useScenarioStore((s) => s.dataset);
  const searchBracket = useScenarioStore((s) => s.searchBracket);
  const setSearchBracket = useScenarioStore((s) => s.setSearchBracket);
  const selectedEntryIds = useScenarioStore((s) => s.selectedEntryIds);
  const toggleEntryId = useScenarioStore((s) => s.toggleEntryId);
  const setSelectedEntryIds = useScenarioStore((s) => s.setSelectedEntryIds);

  const masterRef = useRef<HTMLInputElement>(null);

  const filteredIds = useMemo(() => {
    if (!dataset) return [];
    const q = searchBracket.trim().toLowerCase();
    if (!q) return dataset.entryIds;
    return dataset.entryIds.filter((e) => e.toLowerCase().includes(q));
  }, [dataset, searchBracket]);

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedEntryIds.includes(id));
  const someFilteredSelected = filteredIds.some((id) => selectedEntryIds.includes(id));

  useEffect(() => {
    const el = masterRef.current;
    if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
  }, [someFilteredSelected, allFilteredSelected]);

  if (!dataset) return null;

  return (
    <section className="panel entry-picker" aria-label="Bracket columns">
      <div className="panel-head">
        <h2>Brackets to compare</h2>
        <p className="muted">
          Choose which pool entries appear as columns. Search narrows the list.
        </p>
        <input
          type="search"
          className="search-input"
          placeholder="Search bracket names…"
          value={searchBracket}
          onChange={(e) => setSearchBracket(e.target.value)}
          aria-label="Search brackets"
        />
        <div className="entry-picker-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={() => setSelectedEntryIds([...new Set([...selectedEntryIds, ...filteredIds])])}
          >
            Add all in list
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              const drop = new Set(filteredIds);
              setSelectedEntryIds(selectedEntryIds.filter((id) => !drop.has(id)));
            }}
          >
            Remove all in list
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setSelectedEntryIds([...dataset.entryIds])}
          >
            Select all
          </button>
          <button type="button" className="btn secondary" onClick={() => setSelectedEntryIds([])}>
            Clear
          </button>
        </div>
      </div>
      <label className="checkbox-line">
        <input
          ref={masterRef}
          type="checkbox"
          checked={allFilteredSelected}
          onChange={() => {
            if (allFilteredSelected) {
              const drop = new Set(filteredIds);
              setSelectedEntryIds(selectedEntryIds.filter((id) => !drop.has(id)));
            } else {
              setSelectedEntryIds([...new Set([...selectedEntryIds, ...filteredIds])]);
            }
          }}
        />
        <span>Toggle visible list</span>
      </label>
      <div className="entry-list" role="list">
        {filteredIds.map((id) => (
          <label key={id} className="checkbox-line" role="listitem">
            <input
              type="checkbox"
              checked={selectedEntryIds.includes(id)}
              onChange={() => toggleEntryId(id)}
            />
            <span className="entry-name">{id}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
