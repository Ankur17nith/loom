# Loom design system

> Source of truth for the Loom review cockpit. Page-specific decisions live in
> `pages/` and override this file only when they describe a real interaction.

**Project:** Loom
**Product:** Developer change-impact investigation tool
**Direction:** Review cockpit / evidence workbench
**Density:** Compact enough for code review, never smaller than readable
**Motion:** Quiet, responsive, cause-and-effect only

## Product point of view

Loom is not an analytics dashboard. It is a review surface for answering:

1. What changed?
2. What is most likely to break?
3. What evidence supports that claim?
4. Which checks confirm or limit it?

The visual hierarchy follows that order. Findings and evidence outrank aggregate
metrics. The graph is a workspace, not a decorative chart.

## Visual language

### Palette

| Role | Value | Use |
|---|---|---|
| Canvas | `#0B0E12` | Application background |
| Surface | `#11161D` | Work areas and artifact sections |
| Raised surface | `#161C24` | Selected rows, controls, inspector blocks |
| Strong surface | `#1B232D` | Focused review hero and graph nodes |
| Selected surface | `#182433` | Active review item indicator |
| Text | `#EDF2F7` | Primary reading content |
| Secondary text | `#B8C2CE` | Supporting copy and evidence values |
| Muted text | `#9CB0C6` | Labels, metadata, helper copy (WCAG AA compliant) |
| Low contrast helper | `#8295AB` | Tertiary metadata, pips, line marks (WCAG AA compliant) |
| Interaction blue | `#87B4FF` | Selection, links, primary action, graph path |
| Breaking red | `#FF7F83` | Critical/high risk and failed checks |
| Uncertainty amber | `#F2BA62` | Incomplete evidence, skipped, inconclusive |
| Verified green | `#76D7A1` | Explicitly passed checks only |

Use semantic tokens rather than raw values in components. Never use green for a
generic success mood, and never use color without a text label or icon.

### Typography

- IBM Plex Sans: page titles, body copy, finding titles, controls.
- JetBrains Mono: file paths, symbols, commits, commands, graph relationships,
  captured output, tabular counts.
- Body copy starts at 14px desktop and 14px mobile. Supporting text does not
  drop below 11px. Code stays at 10–12px with generous line height.
- Use sentence case. Small mono labels are for navigation and evidence context,
  not for every heading.

### Spacing and shape

- Use a 4/8px rhythm: 4, 8, 12, 16, 20, 24, 32.
- Main content uses 36px desktop gutters and 13–18px narrow gutters.
- Use 5–8px radii for work surfaces and controls. Avoid pill-shaped decoration.
- Prefer dividers, grouped rows, and split panes over a grid of identical cards.
- Shadows are reserved for the review hero, command palette, and elevated shell
  layers. Borders are quiet but always visible against the canvas.

## Layout system

### Shell

- Desktop shell: 208px navigation rail, one 52px review context bar, scrollable
  content canvas.
- The rail contains product identity, repository context, review navigation, and
  source/check state. Do not duplicate the same context in multiple chrome bars.
- Mobile collapses the rail into a drawer and keeps the context bar compact.

### Review cockpit

Overview is a narrative, not a metric wall:

```text
review context
priority finding + verification gate
change facts
review queue       change surface
impact preview
attached verification
```

### Findings workspace

```text
finding queue + search/filter/sort  |  persistent evidence inspector
```

The inspector preserves the selected finding while the reviewer scans the queue.
Deep links use `/findings/:findingId` and retain the same master-detail layout.

### Graph workspace

```text
toolbar + graph canvas (primary)   |  selected node inspector
accessible relationship list
```

The graph has the largest usable area on its dedicated route. Unrelated context
is dimmed, never removed without explanation.

## Interaction rules

- `Ctrl/Cmd + K` opens the command palette; arrows and Enter work without a
  pointer.
- Selected findings, nodes, and graph paths have a visible blue state plus text
  context.
- Click targets are at least 34px desktop and 44px on narrow screens.
- Search and filters preserve the selected finding when possible.
- Evidence cards keep `code`, `file`, `line`, `column`, `relation`, and `path`
  as separate concepts. Do not concatenate them into one display string.
- The browser only reads validated reports. It never runs repository commands.
- Empty, error, skipped, and inconclusive states explain what happened and what
  the reviewer can do next.
- Reduced motion removes non-essential transitions and graph animation.

## Anti-patterns

- Generic metric-card grids as the primary page composition.
- Decorative gradients, glassmorphism, neon, fake trend charts, or unlabelled
  demo content.
- All-caps eyebrows above every heading.
- Body text below 12px or low-contrast gray-on-gray evidence.
- Green indicators for partial, skipped, or not-run checks.
- Hiding the graph in a tiny overview card when the reviewer is investigating it.
