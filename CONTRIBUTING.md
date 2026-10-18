# Contributing to Loom

Loom is an evidence-first, local-first developer tool. Contributions should
keep deterministic analysis independent from optional presentation and AI
features.

## Development

Use Node.js `22.23.3`, then run:

```bash
npm ci
make test
npm run build
```

Keep changes focused, add a meaningful test for changed behavior, and do not
commit `.env`, generated reports, or machine-specific paths.
