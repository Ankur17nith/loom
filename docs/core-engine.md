# Core engine design

Loom's CLI is a bounded pipeline:

1. **Load inputs.** Resolve the repository with `git rev-parse`, validate the
   JSON config, resolve the base commit, enumerate tracked and untracked source
   files, and read the base contents with `git show`.
2. **Parse.** Create a TypeScript `SourceFile` for each supported file. The
   parser records public interfaces/type aliases, imports/re-exports, typed
   property accesses, JSX tags/props, parse diagnostics, and framework signals.
3. **Build graphs.** Each snapshot has module, exported-contract, and framework
   nodes. Import, export, type-use, property-read, render, and framework edges
   are sorted and assigned stable IDs. Relative imports resolve across the
   supported TypeScript/JavaScript extensions and index files.
4. **Compare contracts.** Matching exported contracts are compared by
   repository-relative module path and name. Removed fields are breaking;
   same-type fields with matching optionality are paired as renames; optional
   additions are informational; required additions are medium-severity risks.
5. **Traverse consumers.** Baseline property evidence is matched against the
   current snapshot. Reverse import traversal supplies direct and transitive
   impact paths. A consumer that removed or updated its access is not reported
   as stale.
6. **Report.** Findings are sorted by stable ID. IDs hash the semantic change,
   consumer, and evidence position, so the same repository state produces the
   same JSON and IDs without embedding absolute paths.

## Report shape

The JSON report has `schemaVersion: 1`, the resolved base commit, changed
repository-relative files, a summary, contract changes, and findings. `report`
adds the current graph; `impact` adds `impactedFiles`. A finding contains:

- `id`, `kind`, `severity`, and a repository-relative consumer
- contract path/name and old/new field names when applicable
- `confidence` and an explicit `uncertainty` array
- evidence file, line, column, source expression, relation, and traversal path

## Safety boundaries

Config and output paths are checked against the repository root. Git and file
operations use fixed argument arrays and bounded output/file sizes. The CLI
does not call `npm run`, shell commands from configuration, test runners, or
application code. `doctor` only checks local prerequisites.

## Known boundaries

The graph is syntax-derived rather than a full TypeScript type checker. It is
not a runtime dependency graph and does not resolve package exports, aliases
from arbitrary build tools, declaration merging, conditional/mapped type
semantics, reflection, or dynamic property names. React and Express support is
limited to detection signals. JSX prop matching relies on an imported module
exposing an exported contract whose name ends in `Props`.
