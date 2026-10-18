# Final MVP audit

Audit basis: Loom `a4c2d18` plus the hardening and dashboard work in the current
working tree. The audit preserves the deterministic engine and treats the
dashboard as a validated report consumer.

## Verified strengths

- Git reads use argument arrays and repository-relative path checks.
- TypeScript parsing uses the Compiler API; local property relationships can be
  resolved through a bounded `Program` and `TypeChecker`.
- Graph IDs, finding IDs, evidence ordering, and paths are deterministic.
- Contract findings distinguish removed fields, rename hypotheses, required
  additions, and optional additions.
- Reports preserve repository-relative evidence and confidence/uncertainty.
- Verification is opt-in, shell-disabled, timeout-bounded, output-bounded, and
  redacts token-shaped output.
- The dashboard validates both its own display shape and real `loom.report/v1`
  engine reports.
- Synthetic dashboard data is labeled and isolated from imported reports.

## Confirmed defects fixed in this pass

1. A CLI scan report without an embedded graph could fail dashboard adaptation
   because affected node IDs were required. The adapter now accepts graph-less
   scan reports and displays the missing graph honestly.
2. Engine graph `renders` edges were not accepted by the dashboard schema.
   The report adapter now accepts the full current relation set.
3. Engine finding uncertainty was dropped by the dashboard adapter. It is now
   preserved and displayed separately from confidence.
4. JSON-shaped token and secret output was not redacted by verification. The
   redactor now covers quoted JSON keys as well as shell-style assignments.
5. Git hardening coverage now includes untracked files, paths with spaces,
   staged plus unstaged edits, rename paths, and deleted paths.
6. The dashboard workspace test script previously ran Vitest from the workspace
   without the root jsdom configuration. It now has a portable workspace-local
   Vitest config and passes independently.

## Remaining risks and limitations

- Docker remains unverified because Docker is unavailable in the environment.
- Playwright Chromium was downloaded for QA, but launch was blocked by missing
  host libraries; no screenshot or pixel-level browser result is claimed.
- The dashboard's real report URL is a host integration boundary; the browser
  cannot read arbitrary local files without a server or static mount.
- Express, Mongoose, OpenAPI, migration planning, incremental cache, AI
  investigation, and GitHub annotations remain roadmap items.
- The dashboard uses a custom CSS token layer rather than shadcn/Tailwind
  runtime components; this avoids adding redundant dependencies to a working
  Vite app while preserving the requested token and interaction semantics.

## Submission recommendation

Submit the deterministic CLI plus the dashboard as the primary demo. Lead with
the backend field-removal scenario, show the evidence path, then show the same
validated report in Findings and Impact Graph. Do not present static confidence
as runtime proof.
