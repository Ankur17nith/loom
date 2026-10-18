import { createHash } from "node:crypto";
import path from "node:path";

export function normalizeRepoPath(value: string): string {
  return value.split(path.sep).join("/").replace(/^\.\//, "");
}

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortStrings(values: readonly string[]): string[] {
  return [...values].sort(compareStrings);
}

export function stableId(prefix: string, value: string): string {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 16);
  return `${prefix}-${digest}`;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, nested) => {
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return Object.fromEntries(Object.entries(nested).sort(([a], [b]) => compareStrings(a, b)));
    }
    return nested;
  }, 2);
}

export function pathIsInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

export function lineText(source: string, line: number): string {
  return source.split(/\r?\n/)[line - 1] ?? "";
}

export function uniqueSorted(values: readonly string[]): string[] {
  return sortStrings([...new Set(values)]);
}
