import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "loom-report-server",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === "GET" && req.url) {
            const parsedUrl = new URL(req.url, "http://localhost");
            const pathname = parsedUrl.pathname;

            const root = process.env.LOOM_WORKSPACE_ROOT
              ? path.resolve(process.env.LOOM_WORKSPACE_ROOT)
              : path.resolve(__dirname, "../..");
            const workspaceName = path.basename(root);

            if (pathname === "/api/workspace") {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ workspaceName, workspaceRoot: root }));
              return;
            }

            if (
              pathname === "/reports/report.json" ||
              pathname === "/.loom/reports/report.json" ||
              pathname === "/report.json"
            ) {
              const candidates: string[] = [];
              if (process.env.LOOM_REPORT_FILE) {
                const custom = path.isAbsolute(process.env.LOOM_REPORT_FILE)
                  ? process.env.LOOM_REPORT_FILE
                  : path.resolve(root, process.env.LOOM_REPORT_FILE);
                candidates.push(custom);
              }
              candidates.push(
                path.resolve(root, ".loom/reports/report.json"),
                path.resolve(root, "reports/report.json"),
                path.resolve(__dirname, "public/report.json"),
              );

              for (const candidate of candidates) {
                if (fs.existsSync(candidate)) {
                  res.setHeader("Content-Type", "application/json");
                  res.setHeader("X-Loom-Workspace", workspaceName);
                  res.end(fs.readFileSync(candidate, "utf8"));
                  return;
                }
              }

              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Report not found", searchedCandidates: candidates }));
              return;
            }
          }
          next();
        });
      },
    },
  ],
});

