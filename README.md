# Loom

**See what your changes touch.**

Loom is an open-source, local-first developer tool for change-impact
intelligence. Its deterministic core compares a Git base snapshot with the
working tree, parses TypeScript/JavaScript source with the TypeScript Compiler
API, builds an evidence-backed graph, and reports consumers of changed
contracts.

The optional dashboard is a presentation layer over real Loom reports; it does
not invent findings.

## Core engine status

The core engine and CLI are usable as a vertical slice. It currently supports:

- Git base/working-tree snapshots and repository-relative changed-file discovery
- exported TypeScript interfaces and object-literal type aliases
- named/default/namespace imports and type-only imports, including local
  relative re-exports
- typed property accesses, JSX element/prop evidence, and deterministic graph
  traversal through imports and re-exports
- removed fields, same-type field renames, required additions, and optional
  additions (optional additions are recorded but are not breaking findings)
- stable finding IDs, confidence, uncertainty, source positions, and impact
  paths
- JSON and text reports
- JSON-only configuration; Loom never evaluates configuration code or runs
  repository package scripts

See [docs/core-engine.md](docs/core-engine.md) for the data model and known
limitations.

## Requirements and setup

- Node.js `22.23.3` (pinned in `.nvmrc`)
- npm `10.9.9` or newer
- Git

```bash
npm ci
npm test
npm run build
node dist/cli.js --help
```

`npm test` runs TypeScript checks for the CLI and dashboard plus the unit,
integration, and end-to-end tests. The tests create temporary Git repositories
and do not execute scripts from those repositories.

## CLI

All analysis commands use the current directory by default. `--root` selects a
repository and `--base` selects a Git commit; the default base is `HEAD` (or the
`base` value in `loom.config.json`). Output paths and all report paths must be
repository-relative.

```bash
node dist/cli.js init
node dist/cli.js scan --base HEAD
node dist/cli.js impact --format json --output .loom/reports/impact.json
node dist/cli.js graph --format json
node dist/cli.js report --format json --output .loom/reports/report.json
node dist/cli.js explain finding-0123456789abcdef
node dist/cli.js doctor
node dist/cli.js ci --fail-on high
```

The package also exposes `loom` as its npm bin name when invoked through an npm
bin-aware environment.

`scan` reports contract changes and stale consumers. `impact` adds files that
transitively import changed modules. `graph` prints the current deterministic
graph. `report` includes that graph in the report document. `explain` resolves
one finding ID. `doctor` checks Git/configuration without invoking project
scripts. `ci` prints a report and exits non-zero when its threshold is met.

### Exit codes

The codes are stable across commands:

| Code | Meaning |
| ---: | --- |
| `0` | Command completed; `ci` found no finding at or above its threshold |
| `1` | `ci` found a finding at or above `--fail-on` |
| `2` | Usage, configuration, repository, or Git base error |
| `3` | Analysis or unexpected execution error |

`scan`, `impact`, `graph`, `report`, and `explain` return `0` when their
requested operation succeeds, even when findings are present.

## Configuration

`loom init` creates `loom.config.json`:

```json
{
  "base": "HEAD",
  "extensions": [".ts", ".tsx", ".js", ".jsx"],
  "exclude": ["node_modules", "dist", "build", "coverage", ".git"],
  "maxFiles": 10000,
  "maxFileBytes": 1000000
}
```

Only this strict JSON schema is accepted. Config paths, output paths, and
source paths are constrained to the repository. File count and file size
limits bound analysis work. There is no config hook, shell command, test
runner, or package-script execution in the core CLI.

## Framework signals and limitations

React is marked when the parser sees React imports or JSX. Express is marked
when it sees an Express import or common route/middleware property calls. These
are graph signals only; the engine does not claim framework-specific routing,
component lifecycle, or runtime behavior analysis.

The analyzer is intentionally conservative and syntax-oriented. It does not
run TypeScript, resolve npm packages, infer arbitrary JavaScript types, model
reflection/dynamic property names, or execute tests/builds. Strong findings
come from explicit imported contract types and property accesses. A reachable
but unresolved transitive property access is reported with medium confidence
and an uncertainty explanation. JSX prop evidence is associated when the
imported component's module exposes an exported `*Props` contract. Declaration
merging, complex conditional/mapped types, generated files, and non-relative
package graphs are outside this slice.

## Design principles

- Deterministic analysis before AI assistance.
- Evidence and uncertainty are visible in every finding.
- Repository contents and commands are handled conservatively.
- No database server is required for core analysis.

## License

MIT. See [LICENSE](LICENSE).
