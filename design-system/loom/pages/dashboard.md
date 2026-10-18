# Loom dashboard override

The generated dark-mode system is adapted for Loom's evidence workbench rather
than copied as a generic OLED theme.

## Product-specific decisions

- Canvas: `#0D0F12`; sidebar: `#111318`; surfaces: `#171A20` and `#1C2028`.
- IBM Plex Sans carries interface copy; JetBrains Mono carries paths, symbols,
  revisions, graph relationships, and captured command output.
- The graph is the signature visual surface. It uses real report nodes and
  edges, a compact legend, bounded search/filtering, and a relationship-list
  alternative.
- Red communicates breaking severity, amber communicates potential risk or
  uncertainty, green communicates explicit check success, and blue communicates
  interaction or selection. Every state has text in addition to color.
- Use dividers, split panes, and dense evidence rows before adding cards.
- No gradients, neon, decorative charts, synthetic production findings, or
  unlabelled demo content.

## Interaction rules

- `Ctrl/Cmd + K` opens the command palette; arrows and Enter work without a
  pointer.
- Finding rows are native buttons with visible focus and copyable locations.
- Graph selection is mirrored in the inspector and has an accessible
  relationship-list alternative.
- The dashboard never runs repository commands; verification comes from the
  validated report artifact.
- Reduced-motion preferences remove non-essential transitions.
