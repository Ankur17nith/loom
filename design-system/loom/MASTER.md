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

### Palette (Faultline-inspired Obsidian & Zinc Scale)

| Role | Value | Token | Use |
|---|---|---|---|
| Base Canvas | `#09090B` | `--canvas` | Deep obsidian/zinc-950 application background |
| Surface | `#111215` | `--surface` | Main workspace cards and container sections |
| Raised surface | `#18191E` | `--surface-raised` | Elevated cards, inspectors, active tab pills |
| Strong surface | `#202227` | `--surface-strong` | Input backgrounds and code tags |
| Selected row | `#131D27` | `--surface-selected` | Active queue and finding selection |
| Structural border | `#27272A` | `--line` | Clean 1px precision hairline borders |
| Soft border | `#1E1F24` | `--line-soft` | Subtle section dividers and row separators |
| Primary text | `#F4F4F5` | `--text` | Crisp high-contrast reading content (zinc-100) |
| Secondary text | `#A1A1AA` | `--text-2` | Supporting copy and evidence descriptions (zinc-400) |
| Tertiary text | `#828A95` | `--text-3` | Technical metadata, timestamps, and coordinates |
| Micro text / icons | `#5E6673` | `--text-4` | Line markers, inactive icons, and pips |
| Diagnostic ember | `#F97316` | `--fl-ember` | Causal break line, high risk findings, brand mark crack |
| Technical iris | `#38BDF8` | `--fl-iris` | Graph active paths, primary focus, interaction links |
| Verified proof | `#34D399` | `--fl-proof` | Verified passing gate and passing checks |
| Breaking red | `#F87171` | `--red` | Critical severity and failed verification checks |
| Uncertainty amber | `#FBBF24` | `--amber` | Partial gates, inconclusive checks, limits noted |

All status chips follow Faultline's `TONE_CLASS` principle: WCAG AA compliant 300-level text
on a 10–15% tinted surface with a 35% tinted border. Status is never communicated by color alone.

### Typography

- Inter: headings, page copy, finding titles, controls (`letter-spacing: -0.015em` on headings).
- JetBrains Mono: file paths, symbols, commits, commands, graph relationships,
  captured output, tabular counts (`font-variant-numeric: tabular-nums`).
- Body copy starts at 13.5px desktop and 14px mobile. Supporting text does not
  drop below 10.5px. Code stays at 10–12px with generous line height.
- All numbers, latencies, confidence metrics, and line counts use tabular figures.

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
