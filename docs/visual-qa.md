# Dashboard visual QA log

## Pass 1 audit

The source-level audit of the existing dashboard identified five largest visual
problems:

1. Normal descriptions, evidence copy, graph labels, and findings metadata were
   frequently 9–11px, making important content read like footnotes.
2. Overview gave the graph and triage queue equal card treatment but did not
   give the investigation area enough vertical room.
3. Dedicated graph nodes, relationship labels, and graph controls were too
   small for a change-impact investigation workspace.
4. Finding detail evidence had the right information but insufficient type
   scale and source emphasis to make evidence the primary object.
5. Findings rows compressed the summary, file location, confidence, and
   verification state into a visually weak metadata band.

## Correction pass

- Increased normal descriptions, evidence text, row summaries, settings copy,
  check output, and graph labels while retaining tiny type only for genuine
  metadata, identifiers, and status badges.
- Expanded the Overview graph/triage composition and removed the repeated card
  treatment from the evidence summary strip.
- Made the dedicated graph use viewport-aware height, larger nodes, stronger
  selected paths, larger controls, and more legible relationship labels.
- Increased evidence panel padding and source-expression emphasis on Finding
  Details; retained separate static, uncertainty, and runtime-proof semantics.
- Improved finding row hierarchy and responsive wrapping without changing
  filtering, navigation, exports, or report integration.

## Runtime review

- Vite served the dashboard successfully at `http://localhost:4175`.
- HTML smoke checks confirmed the Loom document and root mount were served.
- Playwright Chromium launch was attempted for Overview/Findings/Graph
  screenshots but was blocked by missing host libraries. No screenshot result is
  claimed. Existing React Testing Library interaction tests remain the verified
  interaction evidence.
