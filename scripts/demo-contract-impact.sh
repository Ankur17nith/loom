#!/usr/bin/env bash
set -euo pipefail

LOOM_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DEMO_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/loom-demo.XXXXXX")"
trap 'rm -rf "$DEMO_ROOT"' EXIT

mkdir -p "$DEMO_ROOT/src"
cat > "$DEMO_ROOT/src/user.ts" <<'EOF'
export interface UserResponse {
  id: string;
  name: string;
}
EOF
cat > "$DEMO_ROOT/src/profile.ts" <<'EOF'
import type { UserResponse } from "./user";

export function title(user: UserResponse): string {
  return user.name;
}
EOF

git -C "$DEMO_ROOT" init -q
git -C "$DEMO_ROOT" config user.name "Loom Demo"
git -C "$DEMO_ROOT" config user.email "loom-demo@example.test"
git -C "$DEMO_ROOT" add .
git -C "$DEMO_ROOT" commit -qm "base contract"

cat > "$DEMO_ROOT/src/user.ts" <<'EOF'
export interface UserResponse {
  id: string;
  fullName: string;
}
EOF

echo "Loom demo: removed UserResponse.name while profile.ts still reads it"
echo
node "$LOOM_ROOT/dist/cli.js" scan --root "$DEMO_ROOT" --base HEAD
echo
echo "Machine-readable report:"
node "$LOOM_ROOT/dist/cli.js" report --root "$DEMO_ROOT" --base HEAD --format json | node -e 'let input=""; process.stdin.on("data", chunk => input += chunk).on("end", () => { const report = JSON.parse(input); console.log(JSON.stringify({ changedFiles: report.changedFiles, contractChanges: report.contractChanges, findings: report.findings }, null, 2)); });'
