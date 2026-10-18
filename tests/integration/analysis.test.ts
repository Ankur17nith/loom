import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeRepository } from "../../src/analysis.js";
import { jsonReport, reportDocument } from "../../src/report.js";
import { makeRepo, removeRepo, updateRepo } from "../support/repo.js";

const roots: string[] = [];
const apiWithName = `export interface User {\n  id: string;\n  name: string;\n}\n`;
const apiWithoutName = `export interface User {\n  id: string;\n}\n`;
const directConsumer = `import type { User } from "./api";\nexport function read(user: User): string {\n  return user.name;\n}\n`;

function repo(files: Record<string, string>): string {
  const root = makeRepo(files);
  roots.push(root);
  return root;
}

function scan(root: string) {
  return analyzeRepository({ root, base: "HEAD" });
}

afterEach(() => {
  while (roots.length) removeRepo(roots.pop() as string);
});

describe("repository contract analysis", () => {
  it("reports a stale consumer with stable evidence and a high-confidence finding", () => {
    const root = repo({ "src/api.ts": apiWithName, "src/consumer.ts": directConsumer });
    updateRepo(root, { "src/api.ts": apiWithoutName });
    const result = scan(root);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ kind: "removed-field", contractPath: "src/api.ts", contract: "User", field: "name", consumer: "src/consumer.ts", confidence: "high", uncertainty: [] });
    expect(result.findings[0]?.evidence[0]?.path).toEqual(["src/consumer.ts", "src/api.ts"]);
    expect(result.findings[0]?.id).toMatch(/^finding-[0-9a-f]{16}$/);
  });

  it("does not report an updated consumer", () => {
    const root = repo({ "src/api.ts": apiWithName, "src/consumer.ts": directConsumer });
    updateRepo(root, { "src/api.ts": apiWithoutName, "src/consumer.ts": directConsumer.replace("user.name", "user.id") });
    expect(scan(root).findings).toEqual([]);
  });

  it("records an optional addition without treating it as breaking", () => {
    const root = repo({ "src/api.ts": `export interface User { id: string; }\n`, "src/consumer.ts": `import type { User } from "./api"; export const read = (user: User) => user.id;\n` });
    updateRepo(root, { "src/api.ts": `export interface User { id: string; label?: string; }\n` });
    const result = scan(root);
    expect(result.contractChanges).toEqual([expect.objectContaining({ kind: "added-optional-field", field: "label", optional: true })]);
    expect(result.findings).toEqual([]);
  });

  it("ignores an unrelated change", () => {
    const root = repo({ "src/api.ts": apiWithName, "src/consumer.ts": directConsumer, "src/other.ts": "export const value = 1;\n" });
    updateRepo(root, { "src/other.ts": "export const value = 2;\n" });
    const result = scan(root);
    expect(result.changedFiles).toEqual(["src/other.ts"]);
    expect(result.contractChanges).toEqual([]);
    expect(result.findings).toEqual([]);
  });

  it("reports a rename and follows a transitive re-export path", () => {
    const root = repo({
      "src/api.ts": apiWithName,
      "src/public.ts": `export type { User } from "./api";\n`,
      "src/consumer.ts": `import type { User } from "./public";\nexport const read = (user: User) => user.name;\n`,
    });
    updateRepo(root, { "src/api.ts": `export interface User {\n  id: string;\n  displayName: string;\n}\n` });
    const result = scan(root);
    expect(result.contractChanges).toEqual([expect.objectContaining({ kind: "renamed-field", previousField: "name", field: "displayName" })]);
    expect(result.findings[0]?.confidence).toBe("high");
    expect(result.findings[0]?.evidence[0]?.path).toEqual(["src/consumer.ts", "src/public.ts", "src/api.ts"]);
  });

  it("fails clearly when the requested base commit is missing", () => {
    const root = repo({ "src/api.ts": apiWithName });
    expect(() => analyzeRepository({ root, base: "missing-base" })).toThrow(/Base missing-base does not resolve/);
  });

  it("serializes the same result byte-for-byte across runs", () => {
    const root = repo({ "src/api.ts": apiWithName, "src/consumer.ts": directConsumer });
    updateRepo(root, { "src/api.ts": apiWithoutName });
    const first = jsonReport(reportDocument(scan(root)));
    const second = jsonReport(reportDocument(scan(root)));
    expect(first).toBe(second);
    expect(first).not.toContain(path.resolve(root));
    expect(fs.existsSync(path.join(root, ".git"))).toBe(true);
  });
});
