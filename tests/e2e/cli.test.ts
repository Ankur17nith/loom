import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";
import { makeRepo, removeRepo, updateRepo } from "../support/repo.js";

const roots: string[] = [];
const base = `export interface User {\n  id: string;\n  name: string;\n}\n`;
const consumer = `import type { User } from "./api";\nexport const read = (user: User) => user.name;\n`;


afterEach(() => {
  while (roots.length) removeRepo(roots.pop() as string);
});

describe("CLI vertical slice", () => {
  it("runs scan, explain, graph, doctor, init, and CI with stable exit codes", async () => {
    const root = makeRepo({ "src/api.ts": base, "src/consumer.ts": consumer });
    roots.push(root);
    updateRepo(root, { "src/api.ts": `export interface User { id: string; }\n` });
    let stdout = "";
    let stderr = "";
    const io = { stdout: (text: string) => { stdout += text; }, stderr: (text: string) => { stderr += text; } };
    expect(await runCli(["scan", "--root", root, "--base", "HEAD", "--format", "json"], io)).toBe(0);
    const report = JSON.parse(stdout) as { findings: Array<{ id: string }> };
    expect(report.findings).toHaveLength(1);
    const findingId = report.findings[0]?.id;
    expect(findingId).toMatch(/^finding-/);
    stdout = "";
    expect(await runCli(["explain", findingId as string, "--root", root, "--base", "HEAD"], io)).toBe(0);
    expect(stdout).toContain(findingId as string);
    stdout = "";
    expect(await runCli(["graph", "--root", root, "--base", "HEAD", "--format", "json"], io)).toBe(0);
    expect(stdout).toContain('"graph"');
    stdout = "";
    expect(await runCli(["doctor", "--root", root, "--format", "json"], io)).toBe(0);
    expect(stdout).toContain('"ok": true');
    stdout = "";
    expect(await runCli(["init", "--root", root], io)).toBe(0);
    expect(stdout).toContain("Created loom.config.json");
    stdout = "";
    expect(await runCli(["ci", "--root", root, "--base", "HEAD"], io)).toBe(1);
    expect(stderr).toContain("CI found findings");
  });

  it("returns the documented input error for a missing base", async () => {
    const root = makeRepo({ "src/api.ts": base });
    roots.push(root);
    const errors: string[] = [];
    expect(await runCli(["scan", "--root", root, "--base", "does-not-exist"], { stderr: (text: string) => errors.push(text) })).toBe(2);
    expect(errors.join("")).toContain("does-not-exist");
  });
});
