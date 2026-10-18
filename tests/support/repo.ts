import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export interface FixtureFiles {
  [relativePath: string]: string;
}

export function makeRepo(files: FixtureFiles): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "loom-test-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const destination = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "loom@example.test"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Loom Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "base"], { cwd: root });
  return root;
}

export function updateRepo(root: string, files: FixtureFiles): void {
  for (const [relativePath, content] of Object.entries(files)) {
    const destination = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }
}

export function removeRepo(root: string): void {
  fs.rmSync(root, { recursive: true, force: true });
}
