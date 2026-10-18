# Loom

**See what your changes touch.**

Loom is an open-source, local-first developer tool for change-impact
intelligence. It analyzes TypeScript repositories, builds an evidence-backed
dependency graph, detects potentially breaking contract changes, and reports
which consumers and checks are affected.

The deterministic analysis engine is the source of truth. The optional
dashboard is a presentation layer over real Loom reports; it does not invent
findings.

## Status

The project is under active development. The CLI foundation is in place while
the Git, TypeScript analysis, graph, report, and dashboard capabilities are
being implemented incrementally.

## Development

Requirements:

- Node.js `22.23.3`
- npm `10.9.9` or newer
- Git

```bash
npm ci
make test
npm run build
node dist/cli.js --help
```

## Design principles

- Deterministic analysis before AI assistance.
- Evidence and uncertainty are visible in every finding.
- Repository contents and test commands are handled conservatively.
- No database server is required for core analysis.

## License

MIT. See [LICENSE](LICENSE).
