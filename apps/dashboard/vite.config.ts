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
            if (pathname === "/reports/report.json" || pathname === "/.loom/reports/report.json" || pathname === "/report.json") {
              const root = path.resolve(__dirname, "../..");
              const candidates = [
                path.resolve(root, ".loom/reports/report.json"),
                path.resolve(root, "reports/report.json"),
                path.resolve(__dirname, "public/report.json"),
              ];
              for (const candidate of candidates) {
                if (fs.existsSync(candidate)) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(fs.readFileSync(candidate, "utf8"));
                  return;
                }
              }
            }
          }
          next();
        });
      },
    },
  ],
});

