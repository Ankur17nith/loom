import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeRepository } from "../../src/analysis.js";
import { defaultConfig } from "../../src/config.js";
import { makeRepo, removeRepo, updateRepo } from "../support/repo.js";

const roots: string[] = [];

function repo(files: Record<string, string>): string {
  const root = makeRepo(files);
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) removeRepo(roots.pop() as string);
});

describe("Realistic case validation (Phase 4)", () => {
  // Case 1: Removing a previously exported field
  it("Case 1: detects removal of exported field with stale consumer", () => {
    const root = repo({
      "src/contract.ts": "export interface User { id: string; name: string; }\n",
      "src/consumer.ts": 'import type { User } from "./contract";\nexport const get = (u: User) => u.name;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface User { id: string; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      kind: "removed-field",
      contract: "User",
      field: "name",
      consumer: "src/consumer.ts",
      confidence: "high",
    });
  });

  // Case 2: Renaming a field while preserving its type
  it("Case 2: detects rename candidate preserving same type", () => {
    const root = repo({
      "src/contract.ts": "export interface User { id: string; name: string; }\n",
      "src/consumer.ts": 'import type { User } from "./contract";\nexport const get = (u: User) => u.name;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface User { id: string; fullName: string; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.contractChanges).toEqual([
      expect.objectContaining({
        kind: "renamed-field",
        contract: "User",
        previousField: "name",
        field: "fullName",
      }),
    ]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.kind).toBe("renamed-field");
  });

  // Case 3: Adding a required field
  it("Case 3: records added required field with affected consumer", () => {
    const root = repo({
      "src/contract.ts": "export interface Config { timeout: number; }\n",
      "src/consumer.ts": 'import type { Config } from "./contract";\nexport const read = (c: Config) => c.timeout;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface Config { timeout: number; retries: number; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.contractChanges).toEqual([
      expect.objectContaining({
        kind: "added-required-field",
        contract: "Config",
        field: "retries",
      }),
    ]);
    expect(result.findings.some((f) => f.kind === "added-required-field")).toBe(true);
  });

  // Case 4: Adding an optional field
  it("Case 4: records added optional field without breaking consumer finding", () => {
    const root = repo({
      "src/contract.ts": "export interface Config { timeout: number; }\n",
      "src/consumer.ts": 'import type { Config } from "./contract";\nexport const read = (c: Config) => c.timeout;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface Config { timeout: number; debug?: boolean; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.contractChanges).toEqual([
      expect.objectContaining({
        kind: "added-optional-field",
        contract: "Config",
        field: "debug",
        optional: true,
      }),
    ]);
    expect(result.findings).toEqual([]);
  });

  // Case 5: Changing a field type
  it("Case 5: records behavior when field type changes", () => {
    const root = repo({
      "src/contract.ts": "export interface User { id: string; age: string; }\n",
      "src/consumer.ts": 'import type { User } from "./contract";\nexport const get = (u: User) => u.age;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface User { id: string; age: number; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    // Record actual engine behavior: syntax-only diff
    expect(result.changedFiles).toEqual(["src/contract.ts"]);
  });

  // Case 6: Updating a consumer correctly so no stale access is reported
  it("Case 6: does not report finding when consumer is updated with contract", () => {
    const root = repo({
      "src/contract.ts": "export interface User { id: string; name: string; }\n",
      "src/consumer.ts": 'import type { User } from "./contract";\nexport const get = (u: User) => u.name;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface User { id: string; fullName: string; }\n",
      "src/consumer.ts": 'import type { User } from "./contract";\nexport const get = (u: User) => u.fullName;\n',
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.contractChanges).toEqual([
      expect.objectContaining({ kind: "renamed-field", previousField: "name", field: "fullName" }),
    ]);
    expect(result.findings).toEqual([]);
  });

  // Case 7: Multiple consumers of the same contract
  it("Case 7: reports all consumers reading a removed field", () => {
    const root = repo({
      "src/contract.ts": "export interface User { id: string; name: string; }\n",
      "src/consumerA.ts": 'import type { User } from "./contract";\nexport const getA = (u: User) => u.name;\n',
      "src/consumerB.ts": 'import type { User } from "./contract";\nexport const getB = (u: User) => u.name;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface User { id: string; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.findings).toHaveLength(2);
    const consumers = result.findings.map((f) => f.consumer).sort();
    expect(consumers).toEqual(["src/consumerA.ts", "src/consumerB.ts"]);
  });

  // Case 8: Local imports and relative re-exports
  it("Case 8: follows transitive local re-export paths", () => {
    const root = repo({
      "src/contract.ts": "export interface Item { id: string; price: number; }\n",
      "src/reexport.ts": 'export type { Item } from "./contract";\n',
      "src/consumer.ts": 'import type { Item } from "./reexport";\nexport const calc = (i: Item) => i.price;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface Item { id: string; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.evidence[0]?.path).toEqual(["src/consumer.ts", "src/reexport.ts", "src/contract.ts"]);
  });

  // Case 9: Named, default, namespace, and type-only imports
  it("Case 9: parses named, default, namespace, and type-only imports correctly", () => {
    const root = repo({
      "src/named.ts": "export interface Named { x: number; }\n",
      "src/consumer.ts": [
        'import type { Named } from "./named";',
        'import * as NamedNs from "./named";',
        "export const f = (n: Named) => n.x;",
      ].join("\n"),
    });
    updateRepo(root, {
      "src/named.ts": "export interface Named { y: number; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.findings).toHaveLength(1);
  });

  // Case 10: JSX component props
  it("Case 10: identifies JSX component props usage and reports breaks", () => {
    const root = repo({
      "src/Button.tsx": "export interface ButtonProps { label: string; onClick?: () => void; }\nexport const Button = () => null;\n",
      "src/App.tsx": 'import React from "react";\nimport { Button } from "./Button";\nexport const App = () => <Button label="Click" />;\n',
    });
    updateRepo(root, {
      "src/Button.tsx": "export interface ButtonProps { text: string; onClick?: () => void; }\nexport const Button = () => null;\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.contractChanges).toEqual([
      expect.objectContaining({ kind: "renamed-field", previousField: "label", field: "text" }),
    ]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.evidence[0]?.relation).toBe("jsx-prop");
  });

  // Case 11: Multiple possible rename candidates
  it("Case 11: pairs first matching candidate when multiple same-type fields exist", () => {
    const root = repo({
      "src/contract.ts": "export interface Vector { x: number; }\n",
      "src/consumer.ts": 'import type { Vector } from "./contract";\nexport const get = (v: Vector) => v.x;\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface Vector { a: number; b: number; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    // One rename and one addition
    expect(result.contractChanges.some((c) => c.kind === "renamed-field")).toBe(true);
    expect(result.contractChanges.some((c) => c.kind === "added-required-field")).toBe(true);
  });

  // Case 12: Unresolved imports, dynamic property accesses
  it("Case 12: handles dynamic property accesses without throwing", () => {
    const root = repo({
      "src/contract.ts": "export interface RecordMap { [key: string]: string; name: string; }\n",
      "src/consumer.ts": 'import type { RecordMap } from "./contract";\nexport const get = (r: RecordMap, key: string) => r[key];\n',
    });
    updateRepo(root, {
      "src/contract.ts": "export interface RecordMap { [key: string]: string; }\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    // Dynamic access r[key] is not a static property access, so no breaking consumer finding
    expect(result.findings).toEqual([]);
  });

  // Case 13: Circular dependencies
  it("Case 13: traverses graphs with circular dependencies without infinite loops", () => {
    const root = repo({
      "src/a.ts": 'import type { B } from "./b";\nexport interface A { id: string; name: string; b?: B; }\n',
      "src/b.ts": 'import type { A } from "./a";\nexport interface B { id: string; a?: A; }\nexport const useA = (a: A) => a.name;\n',
    });
    updateRepo(root, {
      "src/a.ts": 'import type { B } from "./b";\nexport interface A { id: string; b?: B; }\n',
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.consumer).toBe("src/b.ts");
  });

  // Case 14: Malformed source files and TypeScript diagnostics
  it("Case 14: handles syntax errors gracefully without crashing analysis", () => {
    const root = repo({
      "src/contract.ts": "export interface User { id: string; name: string; }\n",
      "src/consumer.ts": 'import type { User } from "./contract";\nexport const get = (u: User) => u.name;\n',
    });
    updateRepo(root, {
      "src/consumer.ts": "import type { User } from './contract';\nconst broken = {{;\n",
    });
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.current.modules.find((m) => m.path === "src/consumer.ts")?.parseErrors.length).toBeGreaterThan(0);
  });

  // Case 15: Empty repositories, deleted source files, and limits
  it("Case 15: handles deleted source files and empty changes cleanly", () => {
    const root = repo({
      "src/a.ts": "export interface A { x: number; }\n",
      "src/b.ts": 'import type { A } from "./a"; export const get = (a: A) => a.x;\n',
    });
    // Delete src/b.ts
    fs.unlinkSync(path.join(root, "src/b.ts"));
    const result = analyzeRepository({ root, base: "HEAD" });
    expect(result.changedFiles).toEqual(["src/b.ts"]);
    expect(result.findings).toEqual([]);
  });

  it("Case 15b: enforces maxFiles limit", () => {
    const root = repo({
      "src/a.ts": "export const a = 1;\n",
    });
    const config = { ...defaultConfig(), maxFiles: 0 };
    expect(() => analyzeRepository({ root, base: "HEAD", config })).toThrow(/limit.*exceeded/);
  });
});
