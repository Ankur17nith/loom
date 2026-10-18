import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { LoomConfig } from "./types.js";
import { normalizeRepoPath, pathIsInside, uniqueSorted } from "./utils.js";

export class GitError extends Error {
  public readonly code = "GIT_ERROR";
}

function git(cwd: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", timeout: 5_000, maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new GitError(`git ${args.join(" ")} failed: ${message}`);
  }
}

export function repositoryRoot(cwd: string): string {
  try {
    return path.resolve(git(cwd, ["rev-parse", "--show-toplevel"]).trim());
  } catch {
    throw new GitError(`Directory '${cwd}' is not inside a Git repository. Run 'git init' or pass '--root <path>' to point to your repository.`);
  }
}

export function resolveBase(root: string, requested?: string): string {
  const base = requested ?? "HEAD";
  if (!base || base.length > 200 || base.startsWith("-") || base.includes("\0")) throw new GitError("Base must be a bounded Git revision name");
  try {
    return git(root, ["rev-parse", "--verify", `${base}^{commit}`]).trim();
  } catch {
    throw new GitError(`Base ${base} does not resolve to a commit. Check that the branch or commit exists in your Git history.`);
  }
}

function validRepoPath(root: string, value: string): boolean {
  const absolute = path.resolve(root, value);
  if (!pathIsInside(root, absolute) || value.startsWith(".git/") || value.includes("node_modules/")) return false;
  try {
    if (fs.existsSync(absolute)) {
      const real = fs.realpathSync(absolute);
      if (!pathIsInside(root, real)) return false;
    }
  } catch {
    return false;
  }
  return true;
}

function sourcePath(value: string, config: LoomConfig): boolean {
  return config.extensions.some((extension) => value.endsWith(extension));
}

function excluded(value: string, config: LoomConfig): boolean {
  return config.exclude.some((entry) => value === entry || value.startsWith(`${entry.replace(/\/$/, "")}/`));
}

export function listCurrentSourceFiles(root: string, config: LoomConfig): string[] {
  const tracked = git(root, ["ls-files", "-z"]).split("\0").filter(Boolean);
  let others: string[] = [];
  try {
    others = git(root, ["ls-files", "-z", "--others", "--exclude-standard"]).split("\0").filter(Boolean);
  } catch {
    others = [];
  }
  return uniqueSorted([...tracked, ...others].filter((value) => validRepoPath(root, value) && fs.existsSync(path.resolve(root, value)) && sourcePath(value, config) && !excluded(value, config)));
}

export function listBaseSourceFiles(root: string, base: string, config: LoomConfig): string[] {
  const files = git(root, ["ls-tree", "-r", "-z", "--name-only", base]).split("\0").filter(Boolean);
  return uniqueSorted(files.filter((value) => validRepoPath(root, value) && sourcePath(value, config) && !excluded(value, config)));
}

export function readBaseFile(root: string, base: string, filePath: string): string {
  return git(root, ["show", `${base}:${filePath}`]);
}

export function readCurrentFile(root: string, filePath: string, maxBytes: number): string {
  const absolute = path.resolve(root, filePath);
  if (!pathIsInside(root, absolute)) throw new GitError(`Source path leaves repository: ${filePath}`);
  let real: string;
  try {
    real = fs.realpathSync(absolute);
  } catch {
    throw new GitError(`Source path cannot be resolved: ${filePath}`);
  }
  if (!pathIsInside(root, real)) throw new GitError(`Source path leaves repository through symlink: ${filePath}`);
  const stat = fs.statSync(real);
  if (!stat.isFile()) throw new GitError(`Source path is not a file: ${filePath}`);
  if (stat.size > maxBytes) throw new GitError(`Source file exceeds configured limit: ${filePath}`);
  return fs.readFileSync(real, "utf8");
}

export function changedFiles(root: string, base: string, config: LoomConfig): string[] {
  const diff = git(root, ["diff", "-z", "--name-only", base, "--"]).split("\0").filter(Boolean);
  const current = listCurrentSourceFiles(root, config);
  const baseFiles = listBaseSourceFiles(root, base, config);
  return uniqueSorted([...diff, ...current.filter((file) => !baseFiles.includes(file))].filter((file) => sourcePath(file, config) && !excluded(file, config)));
}

export function gitAvailable(root: string): boolean {
  try {
    repositoryRoot(root);
    return true;
  } catch {
    return false;
  }
}

export function currentCommit(root: string): string {
  return git(root, ["rev-parse", "HEAD"]).trim();
}

export function currentBranch(root: string): string {
  const branch = git(root, ["branch", "--show-current"]).trim();
  return branch || "HEAD";
}
