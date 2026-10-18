# Loom dashboard

The dashboard is a React + TypeScript + Vite presentation layer for versioned Loom report artifacts. It follows the approved compact dark shell, GitHub-style evidence detail, and React Flow graph-first investigation direction.

## Run locally

From the repository root:

```bash
npm ci
npm run dev --workspace apps/dashboard
```

Then open the Vite URL printed in the terminal. The production bundle is built with:

```bash
npm run build:dashboard
```

## Integration behavior

`src/lib/report.ts` is the typed report adapter. It validates input with Zod against `loom.report/v1` and exposes helpers for finding filtering, graph highlighting, dates, and confidence formatting. A host integration can pass validated report JSON through `reportFromJson(input)` and render the same route components with the returned report.

The current app entry point deliberately loads `src/data/demo-report.ts` through the adapter. The shell labels this source as **Demo fixture · labeled**, and overview/report/settings surfaces repeat that it is illustrative. Production findings are not created by the UI.

## Routes

- `/` — overview and change-surface summary
- `/graph` — React Flow impact graph with node selection, path highlighting, and inspector
- `/findings` — searchable severity/status filters and empty state
- `/findings/:findingId` — evidence detail and finding-to-graph navigation
- `/verification` — report-attached check results
- `/reports` — current report artifact and historical-report empty state
- `/settings` — source, adapter, presentation, and limitation details

The command palette is available with `Ctrl+K` or `Cmd+K`. Navigation is responsive, keyboard-focusable, and respects `prefers-reduced-motion`. Copy buttons use the browser clipboard API where available.

## Current limitations

- No live report endpoint, report upload, persistence, authentication, or historical report store is connected yet.
- Verification results are read-only report data; the UI does not execute repository commands.
- Download/export controls are present as presentation affordances but are not wired to a backend.
- The demo fixture is intentionally synthetic and must not be treated as production analysis.
