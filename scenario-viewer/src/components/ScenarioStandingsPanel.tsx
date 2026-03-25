import { useMemo } from "react";
import { competitionRanksForRow } from "../lib/placeChances";
import { formatPts } from "../lib/formatPts";
import { rankFromCache } from "../lib/rankMatrix";
import type { EntryRankCache } from "../lib/rankMatrix";
import type { ScenarioRow } from "../lib/types";

const PLACE_LABELS = ["1st place", "2nd place", "3rd place", "4th place"];

type Line = { id: string; rank: number; points: number };

function buildLines(
  row: ScenarioRow,
  entryIds: string[],
  cache: EntryRankCache | null,
): Line[] {
  const list: Line[] = entryIds.map((id) => {
    let rank: number;
    if (cache) {
      const r = rankFromCache(cache, row.id, id);
      rank = r ?? 99999;
    } else {
      const m = competitionRanksForRow(row, entryIds);
      rank = m.get(id) ?? 99999;
    }
    return { id, rank, points: row.scores[id] ?? 0 };
  });
  list.sort((a, b) => a.rank - b.rank || b.points - a.points || a.id.localeCompare(b.id));
  return list;
}

export function ScenarioStandingsPanel({
  row,
  entryIds,
  cache,
  selectedEntryIds,
}: {
  row: ScenarioRow;
  entryIds: string[];
  cache: EntryRankCache | null;
  selectedEntryIds: string[];
}) {
  const lines = useMemo(() => buildLines(row, entryIds, cache), [row, entryIds, cache]);

  const rankGroups = useMemo(() => {
    return [1, 2, 3, 4].map((r) => lines.filter((x) => x.rank === r));
  }, [lines]);

  const top4Ids = useMemo(() => new Set(rankGroups.flat().map((x) => x.id)), [rankGroups]);

  const selectedOther = useMemo(() => {
    const byId = new Map(lines.map((l) => [l.id, l] as const));
    return selectedEntryIds
      .filter((id) => !top4Ids.has(id))
      .map((id) => byId.get(id) ?? { id, rank: 99999, points: row.scores[id] ?? 0 })
      .sort((a, b) => a.rank - b.rank || b.points - a.points || a.id.localeCompare(b.id));
  }, [lines, selectedEntryIds, top4Ids, row.scores]);

  const showComparisonExtras =
    selectedEntryIds.length > 0 && selectedEntryIds.length < entryIds.length;

  return (
    <div className="standings-panel">
      <h3 className="standings-title">Pool standings</h3>
      <p className="muted small-gap">
        Top four finishing positions in the full pool
        {selectedEntryIds.length > 0 && selectedEntryIds.length < entryIds.length
          ? "; other selected brackets (not already above) are listed next."
          : "."}{" "}
        Competition rank; ties share a rank.
      </p>
      {PLACE_LABELS.map((label, i) => {
        const g = rankGroups[i]!;
        if (g.length === 0) return null;
        return (
          <section key={label} className="standings-rank-block">
            <h4>{label}</h4>
            <ul className="standings-list">
              {g.map((x) => (
                <li key={x.id}>
                  <span className="standings-name">{x.id}</span>
                  <span className="standings-meta">Pts {formatPts(x.points)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {showComparisonExtras && selectedOther.length > 0 && (
        <section className="standings-rank-block">
          <h4>Other brackets in your comparison</h4>
          <table className="freq-table standings-extra-table">
            <thead>
              <tr>
                <th>Entry</th>
                <th>Rank</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {selectedOther.map((x) => (
                <tr key={x.id}>
                  <td>{x.id}</td>
                  <td>{x.rank >= 99999 ? "—" : x.rank}</td>
                  <td>{formatPts(x.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
