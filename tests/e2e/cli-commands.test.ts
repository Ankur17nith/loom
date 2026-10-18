import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";
import { makeRepo, removeRepo, updateRepo } from "../support/repo.js";

const roots: string[] = [];
const baseContract = `export interface User {\n  id: string;\n  name: string;\n}\n`;
const baseConsumer = `import type { User } from "./contract";\nexport const get = (u: User) => u.name;\n`;

function repo(files: Record<string, string>): string {
  const root = makeRepo(files);
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) removeRepo(roots.pop() as string);
});

describe("Complete CLI command verification (Phase 3)", () => {
  it("init: creates safe config, rejects duplicate without force, allows --force", async () => {
    const root = repo({ "src/index.ts": "export const x = 1;\n" });
    let stdout = "";
    let stderr = "";
    const io = { stdout: (t: string) => { stdout += t; }, stderr: (t: string) => { stderr += t; } };

    // Initial creation
    expect(await runCli(["init", "--root", root], io)).toBe(0);
    expect(stdout).toContain("Created .loom/config.json");
    expect(fs.existsSync(path.join(root, ".loom/config.json"))).toBe(true);

    // Duplicate without --force fails with exit code 2
    stdout = "";
    stderr = "";
    expect(await runCli(["init", "--root", root], io)).toBe(2);
    expect(stderr).toContain("already exists; use --force");

    // Overwrite with --force succeeds
    stdout = "";
    stderr = "";
    expect(await runCli(["init", "--root", root, "--force"], io)).toBe(0);
    expect(stdout).toContain("Created .loom/config.json");
  });

  it("init: fails with code 2 outside a git repository", async () => {
    const nonGit = fs.mkdtempSync(path.join(rootTemp(), "non-git-"));
    roots.push(nonGit);
    let stderr = "";
    const io = { stderr: (t: string) => { stderr += t; } };
    expect(await runCli(["init", "--root", nonGit], io)).toBe(2);
    expect(stderr).toContain("is not inside a Git repository");
  });

  it("scan & report: produces valid report JSON with and without embedded graph", async () => {
    const root = repo({ "src/contract.ts": baseContract, "src/consumer.ts": baseConsumer });
    updateRepo(root, { "src/contract.ts": "export interface User { id: string; }\n" });

    // scan JSON
    let stdout = "";
    const io = { stdout: (t: string) => { stdout += t; } };
    expect(await runCli(["scan", "--root", root, "--base", "HEAD", "--format", "json"], io)).toBe(0);
    const scanReport = JSON.parse(stdout) as { schemaVersion: number; version: string; findings: unknown[]; graph?: unknown };
    expect(scanReport.schemaVersion).toBe(1);
    expect(scanReport.version).toBe("loom.report/v1");
    expect(scanReport.findings).toHaveLength(1);
    expect(scanReport.graph).toBeUndefined();

    // report JSON (must embed graph)
    stdout = "";
    expect(await runCli(["report", "--root", root, "--base", "HEAD", "--format", "json"], io)).toBe(0);
    const fullReport = JSON.parse(stdout) as { graph?: { nodes: unknown[]; edges: unknown[] } };
    expect(fullReport.graph?.nodes.length).toBeGreaterThan(0);
  });

  it("scan: handles clean working tree with 0 findings", async () => {
    const root = repo({ "src/contract.ts": baseContract, "src/consumer.ts": baseConsumer });
    let stdout = "";
    const io = { stdout: (t: string) => { stdout += t; } };
    expect(await runCli(["scan", "--root", root, "--base", "HEAD", "--format", "json"], io)).toBe(0);
    const report = JSON.parse(stdout) as { changedFiles: string[]; findings: unknown[] };
    expect(report.changedFiles).toHaveLength(0);
    expect(report.findings).toHaveLength(0);
  });

  it("impact: handles missing, existing, and ambiguous identifiers", async () => {
    const root = repo({
      "src/contract.ts": baseContract,
      "src/consumer.ts": baseConsumer,
      "src/other.ts": "export const other = 1;\n",
    });
    updateRepo(root, { "src/contract.ts": "export interface User { id: string; }\n" });

    let stdout = "";
    let stderr = "";
    const io = { stdout: (t: string) => { stdout += t; }, stderr: (t: string) => { stderr += t; } };

    // No identifier: uses changed files
    expect(await runCli(["impact", "--root", root, "--base", "HEAD", "--format", "json"], io)).toBe(0);
    const impactResult = JSON.parse(stdout) as { impactedFiles: string[] };
    expect(impactResult.impactedFiles).toContain("src/consumer.ts");
    expect(impactResult.impactedFiles).toContain("src/contract.ts");

    // With valid contract identifier
    stdout = "";
    expect(await runCli(["impact", "User", "--root", root, "--base", "HEAD", "--format", "json"], io)).toBe(0);
    const userImpact = JSON.parse(stdout) as { impactedFiles: string[] };
    expect(userImpact.impactedFiles).toContain("src/consumer.ts");

    // With invalid identifier (exit code 2)
    stdout = "";
    stderr = "";
    expect(await runCli(["impact", "NonexistentSymbol", "--root", root, "--base", "HEAD"], io)).toBe(2);
    expect(stderr).toContain("was not found");
  });

  it("graph: produces deterministic node/edge graph in text and JSON", async () => {
    const root = repo({ "src/contract.ts": baseContract, "src/consumer.ts": baseConsumer });
    let stdout = "";
    const io = { stdout: (t: string) => { stdout += t; } };

    expect(await runCli(["graph", "--root", root, "--format", "text"], io)).toBe(0);
    expect(stdout).toContain("Loom graph");
    expect(stdout).toContain("module:src/consumer.ts");

    stdout = "";
    expect(await runCli(["graph", "--root", root, "--format", "json"], io)).toBe(0);
    const parsed = JSON.parse(stdout) as { graph: { nodes: unknown[]; edges: unknown[] } };
    expect(parsed.graph.nodes.length).toBeGreaterThan(0);
  });

  it("explain: prints finding details or returns code 2 for unknown finding", async () => {
    const root = repo({ "src/contract.ts": baseContract, "src/consumer.ts": baseConsumer });
    updateRepo(root, { "src/contract.ts": "export interface User { id: string; }\n" });

    let stdout = "";
    const io = { stdout: (t: string) => { stdout += t; } };
    await runCli(["scan", "--root", root, "--base", "HEAD", "--format", "json"], io);
    const report = JSON.parse(stdout) as { findings: Array<{ id: string }> };
    const findingId = report.findings[0]!.id;

    stdout = "";
    expect(await runCli(["explain", findingId, "--root", root, "--base", "HEAD"], io)).toBe(0);
    expect(stdout).toContain(findingId);
    expect(stdout).toContain("consumer: src/consumer.ts");

    let stderr = "";
    expect(await runCli(["explain", "finding-invalid-id", "--root", root, "--base", "HEAD"], { stderr: (t: string) => { stderr += t; } })).toBe(2);
    expect(stderr).toContain("was not found");
  });

  it("doctor: passes for valid repo, reports prerequisites in JSON", async () => {
    const root = repo({ "src/index.ts": "export const a = 1;\n" });
    let stdout = "";
    const io = { stdout: (t: string) => { stdout += t; } };
    expect(await runCli(["doctor", "--root", root, "--format", "json"], io)).toBe(0);
    const doc = JSON.parse(stdout) as { ok: boolean; checks: { gitRepository: boolean; config: boolean } };
    expect(doc.ok).toBe(true);
    expect(doc.checks.gitRepository).toBe(true);
  });

  it("test and test --run: enforces authorization gate for verification commands", async () => {
    const root = repo({ "src/index.ts": "export const a = 1;\n" });
    // Write a config with a passing command and a failing command
    fs.mkdirSync(path.join(root, ".loom"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".loom/config.json"),
      JSON.stringify({
        verification: {
          commands: [[process.execPath, "-e", "process.stdout.write('test-pass')"]],
          timeoutMs: 5000,
          maxOutputBytes: 10000,
        },
      }),
      "utf8",
    );

    let stdout = "";
    let stderr = "";
    const io = { stdout: (t: string) => { stdout += t; }, stderr: (t: string) => { stderr += t; } };

    // Without --run: outputs not-run, does not execute commands
    expect(await runCli(["test", "--root", root, "--format", "json"], io)).toBe(0);
    const notRun = JSON.parse(stdout) as { status: string; commands: string[][] };
    expect(notRun.status).toBe("not-run");
    expect(notRun.commands).toHaveLength(1);

    // With --run: executes approved commands
    stdout = "";
    expect(await runCli(["test", "--run", "--root", root, "--format", "json"], io)).toBe(0);
    const ran = JSON.parse(stdout) as { results: Array<{ status: string; output: string }> };
    expect(ran.results[0]?.status).toBe("passed");
    expect(ran.results[0]?.output).toBe("test-pass");

    // With a failing command: exit code 1
    fs.writeFileSync(
      path.join(root, ".loom/config.json"),
      JSON.stringify({
        verification: {
          commands: [[process.execPath, "-e", "process.exit(1)"]],
          timeoutMs: 5000,
          maxOutputBytes: 10000,
        },
      }),
      "utf8",
    );
    stdout = "";
    stderr = "";
    expect(await runCli(["test", "--run", "--root", root], io)).toBe(1);
    expect(stderr).toContain("Verification did not pass");
  });

  it("ci: enforces --fail-on thresholds with correct exit codes", async () => {
    const root = repo({ "src/contract.ts": baseContract, "src/consumer.ts": baseConsumer });
    updateRepo(root, { "src/contract.ts": "export interface User { id: string; }\n" });

    let stderr = "";
    const io = { stderr: (t: string) => { stderr += t; } };

    // High severity finding with default --fail-on high -> fails with 1
    expect(await runCli(["ci", "--root", root, "--base", "HEAD"], io)).toBe(1);
    expect(stderr).toContain("CI found findings");

    // Unsupported severity -> fails with 2
    stderr = "";
    expect(await runCli(["ci", "--root", root, "--base", "HEAD", "--fail-on", "invalid-severity"], io)).toBe(2);
    expect(stderr).toContain("Unsupported --fail-on");
  });

  it("security: rejects path traversal in --output and --config", async () => {
    const root = repo({ "src/contract.ts": baseContract });
    let stderr = "";
    const io = { stderr: (t: string) => { stderr += t; } };

    // Absolute output path
    expect(await runCli(["scan", "--root", root, "--output", "/tmp/escape.json"], io)).toBe(2);
    expect(stderr).toContain("repository-relative");

    // Escaping relative output path
    stderr = "";
    expect(await runCli(["scan", "--root", root, "--output", "../../outside.json"], io)).toBe(2);
    expect(stderr).toContain("stay inside the repository");

    // Absolute config path
    stderr = "";
    expect(await runCli(["scan", "--root", root, "--config", "/etc/passwd"], io)).toBe(2);
    expect(stderr).toContain("repository-relative");

    // Escaping relative config path
    stderr = "";
    expect(await runCli(["scan", "--root", root, "--config", "../outside.json"], io)).toBe(2);
    expect(stderr).toContain("stay inside the repository");

    // Nonexistent requested config file
    stderr = "";
    expect(await runCli(["scan", "--root", root, "--config", "missing-config.json"], io)).toBe(2);
    expect(stderr).toContain("Config file not found");
  });
});

function rootTemp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "loom-non-git-"));
}
