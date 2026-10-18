# Loom dashboard override
 
The dashboard is a review cockpit for developer change impact, styled with a
premium, technical dark interface inspired by Faultline. It uses the
master tokens but gives priority to findings, evidence, and directional graph
context over reporting widgets.

## Page composition

- Shell features the Loom diagnostic mark: an obsidian plate split by an ember fault line.
- Overview opens with one priority finding and its verification gate.
- Findings is a persistent queue/inspector workspace; selection stays visible
  while filters and sorting change.
- Finding evidence is structured into source, code, relation, and path. A path
  is rendered as a readable sequence, not a concatenated metadata string.
- Impact Graph owns most of the viewport on its dedicated route. Its toolbar,
  canvas, node inspector, and accessible relationship list are one workbench.
- Verification is a gate with explicit passed, failed, inconclusive, skipped,
  and running states. Output is progressively disclosed.
- Reports shows the current validated artifact and an honest empty state when
  no host history provider exists.

## Component rules

- Use dividers and grouped rows before adding a panel border.
- Use the deep zinc/obsidian surfaces (`#09090b` canvas, `#111215` cards, `#18191e` elevated).
- Every finding row exposes severity, title, location, confidence, status, and
  uncertainty where present.
- Every evidence card exposes its source reference and renders a code snippet
  only when the report supplies code.
- Graph nodes show kind, label, path, and changed state. Edges are directional.
- Source badges must make synthetic fixtures unmistakable.

## Responsive behavior

- Desktop: 216px rail, 2-column Findings workspace, graph canvas plus inspector.
  Mobile navigation buttons (hamburger and close) are strictly hidden on desktop (min-width: 861px).
- Tablet (768px - 1024px): collapse the rail into a slide-over drawer and stack queue and inspector.
- Narrow (390px): stack review hero status, facts, queue, graph, and inspector; zero
  horizontal scrolling, and all touch controls are at least 42-44px high.
- The Overview graph remains a useful preview with real nodes centered via auto-fit;
  the compact canvas uses a 2-row layout without the MiniMap overlay to maximize node visibility.

## Accessibility and behavior

- Keep `Ctrl/Cmd + K`, deep links, keyboard focus, and the relationship-list
  alternative.
- Color is always paired with words or icons.
- Report checks are read-only and never rerun from the browser.
- Respect `prefers-reduced-motion`; graph animation and transitions are optional.
