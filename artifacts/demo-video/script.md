# Loom Product Demonstration Script

**Title**: Loom — Local-First TypeScript Change-Impact Intelligence  
**Target Duration**: 2 minutes 45 seconds (165 seconds)  
**Format**: 16:9 1080p (1920x1080), 30 fps, AAC audio  
**Voice Profile**: Professional, articulate, calm developer tool walkthrough  

---

## Scene Breakdown & Narration

### Scene 1: Introduction and Repository Baseline (0:00 – 0:15)
- **Visual**: Terminal terminal view of the realistic repository `payment-platform`. Git status is clean on commit `6a4f912`. Directory tree showing `packages/contracts/src/payment.ts`, `services/order-service/src/checkout.ts`, and `apps/web/src/billing.tsx`.
- **Narration**:
  > "Welcome to Loom, an open-source, local-first developer tool for change-impact intelligence. Loom analyzes TypeScript abstract syntax trees and Git history to determine precisely what breaks before you ship."
- **Timecode**: `00:00:00,000 --> 00:00:15,000`

### Scene 2: Real Breaking Contract Change (0:15 – 0:30)
- **Visual**: Terminal displaying `git diff` on `packages/contracts/src/payment.ts`. The exported interface `PaymentRequest` removes the required field `currency`, while `checkout.ts` and `billing.tsx` still read that property.
- **Narration**:
  > "In our payment platform repository, an engineer updates the core PaymentRequest contract, removing the required currency field. Downstream services and frontend billing components still depend on this field."
- **Timecode**: `00:00:15,000 --> 00:00:30,000`

### Scene 3: Real CLI Execution (0:30 – 0:45)
- **Visual**: Executing `node dist/cli.js report --format json --output .loom/reports/report.json`. Loom prints live analysis: 1 changed file, 4 modules analyzed, 1 contract change detected, and 2 high-confidence breaking findings with exact impact paths.
- **Narration**:
  > "We run Loom's CLI using loom report. Loom's deterministic engine inspects Git diffs, parses TypeScript contracts via the compiler API, and traces consumers across imports without executing untrusted code."
- **Timecode**: `00:00:30,000 --> 00:00:45,000`

### Scene 4: Validated JSON Report Inspection (0:45 – 1:00)
- **Visual**: Formatted JSON inspection of `.loom/reports/report.json` via jq, highlighting `"version": "loom.report/v1"`, `"repository": { "name": "payment-platform" }`, findings metadata, and the embedded dependency graph.
- **Narration**:
  > "The generated report adheres strictly to the versioned loom.report/v1 schema, embedding stable finding IDs, syntax evidence, confidence scores, and dependency edges. No synthetic data, no placeholders."
- **Timecode**: `00:00:45,000 --> 00:01:00,000`

### Scene 5: Dashboard Overview & Provenance (1:00 – 1:16)
- **Visual**: Browser launches Loom Dashboard at `http://127.0.0.1:5175/`. Overview page renders the authentic report. Faultline dark technical aesthetic. Repository `payment-platform`, commit `6a4f912`, 2 breaking findings, 0 uncertainty, 1 changed file, and active provenance.
- **Narration**:
  > "We launch the Loom dashboard. It connects directly to our local report artifact. The Overview displays verified metrics: two breaking findings, high confidence, and full provenance linking back to the active repository."
- **Timecode**: `00:01:00,000 --> 00:01:16,000`

### Scene 6: Findings Queue & Triaging (1:16 – 1:30)
- **Visual**: Navigating to the Findings Queue (`/findings`). High-severity filters applied. Displaying both breaking consumers: `checkout.ts` and `billing.tsx`. Search query filtering in action.
- **Narration**:
  > "Navigating to the Findings Queue, engineers can triage breaking changes. Each finding clearly communicates its root cause, severity, and consumer modules, eliminating noise from unimpacted files."
- **Timecode**: `00:01:16,000 --> 00:01:30,000`

### Scene 7: Finding Inspector & AST Evidence (1:30 – 1:45)
- **Visual**: Selecting the `checkout.ts` finding to open the Finding Inspector sidebar. Highlighting line 14, syntax-highlighted code snippet reading `request.currency`, AST node `typed-property`, and direct traversal path.
- **Narration**:
  > "Opening the finding detail reveals deep AST evidence. Loom highlights the exact source location in checkout.ts where currency is accessed, along with the precise import path back to payment.ts."
- **Timecode**: `00:01:30,000 --> 00:01:45,000`

### Scene 8: Scoped Impact Graph (1:45 – 2:00)
- **Visual**: Navigating to Impact Graph (`/graph`). React Flow visualization scoped to the finding. Interactive pan and zoom showing nodes for `payment.ts`, `checkout.ts`, and `billing.tsx`. Switching between graph and accessible relationship list.
- **Narration**:
  > "The Impact Graph renders a visual dependency map scoped specifically to the affected contract. We can inspect upstream origins, downstream consumers, and verify transitive relationships at a glance."
- **Timecode**: `00:01:45,000 --> 00:02:00,000`

### Scene 9: Unknown Finding Guardrail Notice (2:00 – 2:12)
- **Visual**: Navigating to `/graph?finding=finding-unknown-999`. The dashboard presents an inline warning banner: "Finding not found: finding-unknown-999. The requested finding ID is not in this report. Showing the full workspace graph." No crash, full graph displays safely.
- **Narration**:
  > "Loom handles direct links and stale URLs gracefully. If a finding ID does not exist in the report, an honest warning informs the user while safely presenting the workspace graph without crashing."
- **Timecode**: `00:02:00,000 --> 00:02:12,000`

### Scene 10: Honest Verification Status (2:12 – 2:25)
- **Visual**: Navigating to `/verification`. Displaying the honest verification state: "Verification checks: 0 configured / Not run". No fabricated pass marks or synthetic CI ticks.
- **Narration**:
  > "The Verification view enforces transparency. Because no automated verification scripts were configured in loom config, it honestly reports Not run, never fabricating artificial pass marks or mock test results."
- **Timecode**: `00:02:12,000 --> 00:02:25,000`

### Scene 11: Reports Inventory & Artifact Provenance (2:25 – 2:45)
- **Visual**: Navigating to `/reports`. Inspecting report artifact metadata: repository `payment-platform`, active workspace, dev server source, uncommitted working tree tag, schema version `loom.report/v1`, Download JSON button, and inventory summary.
- **Narration**:
  > "Finally, the Reports page inspects artifact provenance and schema compliance. Loom is deterministic, fast, and entirely local-first, empowering teams to refactor TypeScript codebases with absolute confidence."
- **Timecode**: `00:02:25,000 --> 00:02:45,000`
