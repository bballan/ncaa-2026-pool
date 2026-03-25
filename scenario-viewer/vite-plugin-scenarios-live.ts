import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import type { Plugin } from "vite";

export const LIVE_SCENARIO_PATH = "/__ncaa__/scenarios.csv.gz";
export const LIVE_CRITICAL_PATH = "/__ncaa__/critical_path.csv.gz";

/** @deprecated use LIVE_SCENARIO_PATH */
const LIVE_PATH = LIVE_SCENARIO_PATH;

function pickNewestCsv(outputDir: string, predicate: (name: string) => boolean): { full: string; name: string } | null {
  if (!fs.existsSync(outputDir)) return null;
  const names = fs.readdirSync(outputDir).filter(predicate);
  if (names.length === 0) return null;
  const scored = names.map((name) => {
    const full = path.join(outputDir, name);
    const st = fs.statSync(full);
    return { full, name, mtime: st.mtimeMs };
  });
  scored.sort((a, b) => b.mtime - a.mtime);
  return scored[0]!;
}

/**
 * Dev server only: serve the newest pool CSVs from ../output/2026 as gzip
 * so `npm run dev` uses pool output without running prepare_viewer_data.py.
 */
export function scenariosLiveFromOutput(viewerRoot: string): Plugin {
  const outputDir = path.resolve(viewerRoot, "..", "output", "2026");

  return {
    name: "scenarios-live-from-output",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";

        if (pathname !== LIVE_SCENARIO_PATH && pathname !== LIVE_CRITICAL_PATH) {
          next();
          return;
        }

        try {
          if (pathname === LIVE_SCENARIO_PATH) {
            const chosen = pickNewestCsv(
              outputDir,
              (f) => f.includes("scenario_pts") && f.endsWith(".csv"),
            );
            if (!chosen) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(`No *_scenario_pts_*.csv in ${outputDir}`);
              return;
            }
            const raw = fs.readFileSync(chosen.full);
            const gz = zlib.gzipSync(raw, { level: 6 });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("X-Scenarios-Source", chosen.name);
            res.end(gz);
            return;
          }

          const chosen = pickNewestCsv(
            outputDir,
            (f) => f.includes("critical_path") && f.endsWith(".csv"),
          );
          if (!chosen) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(`No *_critical_path_*.csv in ${outputDir}`);
            return;
          }
          const raw = fs.readFileSync(chosen.full);
          const gz = zlib.gzipSync(raw, { level: 6 });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("X-Critical-Path-Source", chosen.name);
          res.end(gz);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(e instanceof Error ? e.message : String(e));
        }
      });
    },
  };
}

export { LIVE_PATH };
