import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli, type CliIo } from "../../src/cli.js";
import { makeRepo, removeRepo, updateRepo } from "../support/repo.js";
import { reportFromJson, safeParseReportJson, type LoomReport } from "../../apps/dashboard/src/lib/report.js";

const roots: string[] = [];

function repo(files: Record<string, string>): string {
  const root = makeRepo(files);
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) removeRepo(roots.pop() as string);
});

describe("CLI-to-Dashboard End-to-End Integration (Phase 3)", () => {
  it("executes the complete real workflow from temporary git repo to dashboard data adapter", async () => {
    // 1. A temporary Git repository can be created for testing
    // 2. A real baseline can be established
    const baseContract = [
      "export interface UserProfile {",
      "  id: string;",
      "  displayName: string;",
      "  email: string;",
      "}",
    ].join("\n");

    const consumerCode = [
      'import type { UserProfile } from "./contract";',
      "export function formatUser(profile: UserProfile): string {",
      "  return profile.displayName;",
      "}",
    ].join("\n");

    const root = repo({
      "src/contract.ts": baseContract,
      "src/consumer.ts": consumerCode,
    });

    // 3. A contract can be modified in the working tree
    const modifiedContract = [
      "export interface UserProfile {",
      "  id: string;",
      "  fullName: string;", // displayName renamed to fullName
      "  email: string;",
      "}",
    ].join("\n");

    updateRepo(root, {
      "src/contract.ts": modifiedContract,
    });

    // 4. The real Loom CLI analyzes the change
    // 5. A valid report is generated at the requested location
    let stdout = "";
    let stderr = "";
    const io: CliIo = {
      stdout: (t) => { stdout += t; },
      stderr: (t) => { stderr += t; },
    };

    const reportRelPath = ".loom/reports/impact-report.json";
    const exitCode = await runCli(["report", "--root", root, "--base", "HEAD", "--format", "json", "--output", reportRelPath], io);
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");

    const reportFullPath = path.resolve(root, reportRelPath);
    expect(fs.existsSync(reportFullPath)).toBe(true);

    const rawJson = fs.readFileSync(reportFullPath, "utf8");
    const rawReport = JSON.parse(rawJson);

    // 6. The report passes schema validation
    expect(rawReport.version).toBe("loom.report/v1");
    expect(rawReport.summary.findings).toBe(1);
    expect(rawReport.contractChanges).toHaveLength(1);
    expect(rawReport.contractChanges[0].kind).toBe("renamed-field");
    expect(rawReport.contractChanges[0].previousField).toBe("displayName");
    expect(rawReport.contractChanges[0].field).toBe("fullName");

    // 7. The dashboard loads that exact report
    const loadResult = reportFromJson(rawReport);
    expect(loadResult.source).toBe("report-json");
    expect(loadResult.label).toBe("Loom engine report");

    const dashboardReport: LoomReport = loadResult.report;

    // 8. Findings, evidence, counts, dependency information, and graph data match the report
    expect(dashboardReport.summary.filesChanged).toBe(1);
    expect(dashboardReport.summary.findings).toBe(1);
    expect(dashboardReport.findings).toHaveLength(1);

    const finding = dashboardReport.findings[0];
    expect(finding).toBeDefined();
    if (!finding) throw new Error("Expected finding to be present");

    expect(finding.id).toBe(rawReport.findings[0].id);
    expect(finding.title).toContain("UserProfile renamed displayName to fullName");
    expect(finding.category).toBe("renamed-field");
    expect(finding.severity).toBe("high");
    expect(finding.confidence).toBe(0.95); // High confidence maps to 0.95
    expect(finding.location.file).toBe("src/consumer.ts");
    expect(finding.evidence[0]?.code).toContain("profile.displayName");
    expect(finding.evidence[0]?.path).toEqual(["src/consumer.ts", "src/contract.ts"]);
    expect(finding.affectedNodeIds).toContain("contract:src/contract.ts#UserProfile");
    expect(finding.affectedNodeIds).toContain("module:src/consumer.ts");

    // Graph nodes and edges match the engine snapshot
    expect(dashboardReport.nodes.length).toBeGreaterThanOrEqual(2);
    expect(dashboardReport.edges.length).toBeGreaterThanOrEqual(1);
    const contractNode = dashboardReport.nodes.find((n) => n.id === "contract:src/contract.ts#UserProfile");
    expect(contractNode).toBeDefined();
    expect(contractNode?.kind).toBe("type");
    expect(contractNode?.label).toBe("UserProfile");

    // 9. Changing the source and rescanning updates the displayed results
    // Fix consumer to read fullName instead of displayName
    const fixedConsumerCode = [
      'import type { UserProfile } from "./contract";',
      "export function formatUser(profile: UserProfile): string {",
      "  return profile.fullName;",
      "}",
    ].join("\n");

    updateRepo(root, {
      "src/consumer.ts": fixedConsumerCode,
    });

    const exitCode2 = await runCli(["report", "--root", root, "--base", "HEAD", "--format", "json", "--output", reportRelPath], io);
    expect(exitCode2).toBe(0);

    const updatedJson = fs.readFileSync(reportFullPath, "utf8");
    const updatedLoad = reportFromJson(JSON.parse(updatedJson));

    expect(updatedLoad.report.findings).toHaveLength(0);
    expect(updatedLoad.report.summary.findings).toBe(0);
    // Contract change is still detected in contract.ts, but consumer is updated so 0 findings
    expect(updatedLoad.report.contractChanges).toHaveLength(1);

    // 10. Invalid reports and CLI failures are shown as errors rather than successful results
    const malformedJson = { version: "loom.report/v999", broken: true };
    expect(() => reportFromJson(malformedJson)).toThrow();

    stderr = "";
    const invalidExitCode = await runCli(["scan", "--root", root, "--base", "non-existent-commit"], io);
    expect(invalidExitCode).toBe(2);
    expect(stderr).toContain("does not resolve to a commit");

    // 11. An empty repository or a repository with no findings does not display fabricated findings
    const cleanRepoRoot = repo({
      "src/app.ts": "export const PI = 3.14159;\n",
    });

    const cleanReportPath = ".loom/reports/clean.json";
    const cleanExit = await runCli(["report", "--root", cleanRepoRoot, "--base", "HEAD", "--format", "json", "--output", cleanReportPath], io);
    expect(cleanExit).toBe(0);

    const cleanJson = fs.readFileSync(path.resolve(cleanRepoRoot, cleanReportPath), "utf8");
    const cleanLoad = reportFromJson(JSON.parse(cleanJson));

    expect(cleanLoad.report.summary.findings).toBe(0);
    expect(cleanLoad.report.findings).toHaveLength(0);
    expect(cleanLoad.report.contractChanges).toHaveLength(0);
    expect(cleanLoad.report.summary.filesChanged).toBe(0);
  });
});
