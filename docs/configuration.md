# Configuration

`loom init` creates `.loom/config.json`. Loom also reads the legacy
`loom.config.json` when the new file does not exist, so existing integrations
can migrate without a surprise.

```json
{
  "base": "HEAD",
  "extensions": [".ts", ".tsx", ".js", ".jsx"],
  "exclude": ["node_modules", "dist", "build", "coverage", ".git"],
  "maxFiles": 10000,
  "maxFileBytes": 1000000,
  "verification": {
    "commands": [],
    "timeoutMs": 30000,
    "maxOutputBytes": 100000
  }
}
```

Unknown keys and invalid values fail with exit code `2`. `base` is only a
default; `--base` is explicit and takes precedence. Limits prevent accidental
resource exhaustion. Config and output paths must remain inside the repository.

Verification commands are arrays, for example `["npm", "run", "typecheck"]`.
They are never executed by analysis commands. `loom test --run` is the explicit
approval gate; execution uses `shell: false`, a timeout, an output limit, a
filtered environment, and repository-root working directory. Failed, timed-out,
or unavailable commands are reported instead of being treated as clean.
