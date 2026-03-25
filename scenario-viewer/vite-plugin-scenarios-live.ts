import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import type { Plugin } from "vite";

const LIVE_PATH = "/__ncaa__/scenarios.csv.gz";

/**
 * Dev server only: serve the newest `*_scenario_pts_*.csv` from ../output/2026 as gzip
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
        if (pathname !== LIVE_PATH) {
          next();
          return;
        }

        try {
          if (!fs.existsSync(outputDir)) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(`No output directory: ${outputDir}`);
            return;
          }

          const names = fs
            .readdirSync(outputDir)
            .filter((f) => f.includes("scenario_pts") && f.endsWith(".csv"));

          if (names.length === 0) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(`No *_scenario_pts_*.csv in ${outputDir}`);
            return;
          }

          const scored = names.map((name) => {
            const full = path.join(outputDir, name);
            const st = fs.statSync(full);
            return { full, name, mtime: st.mtimeMs };
          });
          scored.sort((a, b) => b.mtime - a.mtime);
          const chosen = scored[0]!;
          const raw = fs.readFileSync(chosen.full);
          const gz = zlib.gzipSync(raw, { level: 6 });

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("X-Scenarios-Source", chosen.name);
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
