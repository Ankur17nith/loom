import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { defaultConfig } from "../../src/config.js";
import { changedFiles, listCurrentSourceFiles } from "../../src/git.js";
import { makeRepo, removeRepo } from "../support/repo.js";

const roots: string[] = [];

afterEach(() => {
  while (roots.length) removeRepo(roots.pop() as string);
});

describe("Git working-tree hardening", () => {
  it("includes untracked source files and paths containing spaces", () => {
    const root = makeRepo({ "src/api.ts": "export const api = 1;\n" });
    roots.push(root);
    const file = path.join(root, "src", "with space.ts");
    fs.writeFileSync(file, "export const value = 1;\n", "utf8");
    expect(listCurrentSourceFiles(root, defaultConfig())).toContain("src/with space.ts");
  });

  it("includes staged and unstaged changes without changing the worktree", () => {
    const root = makeRepo({ "src/api.ts": "export const api = 1;\n" });
    roots.push(root);
    const file = path.join(root, "src", "api.ts");
    fs.writeFileSync(file, "export const api = 2;\n", "utf8");
    execFileSync("git", ["add", "src/api.ts"], { cwd: root });
    fs.writeFileSync(file, "export const api = 3;\n", "utf8");
    expect(changedFiles(root, "HEAD", defaultConfig())).toEqual(["src/api.ts"]);
    expect(fs.readFileSync(file, "utf8")).toContain("api = 3");
  });

  it("reports renamed and deleted source paths", () => {
    const root = makeRepo({ "src/old.ts": "export const oldValue = 1;\n", "src/remove.ts": "export const remove = 1;\n" });
    roots.push(root);
    fs.renameSync(path.join(root, "src/old.ts"), path.join(root, "src/new name.ts"));
    fs.unlinkSync(path.join(root, "src/remove.ts"));
    const files = changedFiles(root, "HEAD", defaultConfig());
    expect(files).toContain("src/new name.ts");
    expect(files).toContain("src/remove.ts");
  });

  it("blocks and ignores symlinks pointing outside the repository", () => {
    const root = makeRepo({ "src/api.ts": "export const api = 1;\n" });
    roots.push(root);
    // Create external target file
    const external = path.join(path.dirname(root), "external-secret.ts");
    fs.writeFileSync(external, "export const secret = 'hidden';\n", "utf8");
    fs.symlinkSync(external, path.join(root, "src/evil.ts"));

    try {
      // listCurrentSourceFiles must not include evil.ts
      const files = listCurrentSourceFiles(root, defaultConfig());
      expect(files).not.toContain("src/evil.ts");
    } finally {
      fs.rmSync(external, { force: true });
    }
  });
});
