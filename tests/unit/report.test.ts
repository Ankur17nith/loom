import { describe, expect, it } from "vitest";
import { demoReport } from "../../apps/dashboard/src/data/demo-report.js";
import { filterFindings, getFinding, getFindingGraphScope, getGraphHighlight, parseReportJson, reportFromJson, reportStats, safeParseReportJson, verificationSummary } from "../../apps/dashboard/src/lib/report.js";

describe("versioned report adapter", () => {
  it("accepts the demo fixture and preserves its version", () => {
    const parsed = parseReportJson(demoReport);
    expect(parsed.version).toBe("loom.report/v1");
    expect(parsed.findings).toHaveLength(4);
  });

  it("rejects unlabeled or malformed report input", () => {
    const result = safeParseReportJson({ ...demoReport, version: "unversioned" });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported report versions with a descriptive error", () => {
    expect(() => reportFromJson({ version: "loom.report/v99" })).toThrow(/Unsupported report version "loom.report\/v99"/);
  });

  it("rejects non-object or null input with a descriptive error", () => {
    expect(() => reportFromJson("not an object")).toThrow(/Report data must be a valid JSON object/);
    expect(() => reportFromJson(null)).toThrow(/Report data must be a valid JSON object/);
  });

  it("adapts a real Loom engine report without inventing relationships", () => {
    const adapted = reportFromJson({
      schemaVersion: 1,
      version: "loom.report/v1",
      reportId: "report-1",
      generatedAt: "2026-10-18T09:42:00.000Z",
      repository: { name: "loom", branch: "main", commit: "123456789", baseCommit: "abcdefghi" },
      base: "abcdefghi",
      changedFiles: ["src/api.ts"],
      summary: { modules: 2, changedFiles: 1, contractChanges: 1, findings: 1, high: 1, medium: 0, low: 0 },
      contractChanges: [{ kind: "removed-field", contractPath: "src/api.ts", contract: "User", field: "name", type: "string", optional: false, evidence: { line: 3, column: 3 } }],
      findings: [{ id: "finding-1", kind: "removed-field", severity: "high", contractPath: "src/api.ts", contract: "User", field: "name", consumer: "src/consumer.ts", message: "User.name was removed", confidence: "high", uncertainty: ["Runtime coverage is not available."], evidence: [{ file: "src/consumer.ts", line: 4, column: 12, code: "user.name", relation: "typed-property", path: ["src/consumer.ts", "src/api.ts"] }] }],
      verification: [{ id: "check-1", command: ["npm", "test", "--", "--runInBand"], status: "inconclusive", durationMs: 840, output: "Timed out", reason: "The command exceeded the configured timeout." }],
      graph: {
        nodes: [{ id: "module:src/api.ts", kind: "module", label: "src/api.ts", path: "src/api.ts" }, { id: "contract:src/api.ts#User", kind: "contract", label: "User", path: "src/api.ts" }, { id: "module:src/consumer.ts", kind: "module", label: "src/consumer.ts", path: "src/consumer.ts" }],
        edges: [{ id: "edge-1", from: "module:src/consumer.ts", to: "contract:src/api.ts#User", relation: "reads-property", label: "name", evidence: "user.name" }],
        modules: [],
        usages: [],
      },
    });
    expect(adapted.label).toBe("Loom engine report");
    expect(adapted.report.findings[0]?.affectedNodeIds).toEqual(["contract:src/api.ts#User", "module:src/consumer.ts", "module:src/api.ts"]);
    expect(adapted.report.edges[0]?.source).toBe("module:src/consumer.ts");
    expect(adapted.report.contractChanges[0]?.type).toBe("string");
    expect(adapted.report.checks[0]).toMatchObject({ status: "inconclusive", reason: "The command exceeded the configured timeout." });
    expect(adapted.report.verification?.[0]?.output).toBe("Timed out");
    expect(adapted.report.summary.verification).toBe("partial");
    expect(getFinding(adapted.report, "finding-1")?.summary).toBe("User.name was removed");
    expect(getFinding(adapted.report, "finding-1")?.evidence[0]?.path).toEqual(["src/consumer.ts", "src/api.ts"]);
    expect(getFindingGraphScope(adapted.report, adapted.report.findings[0]!)).toMatchObject({ nodeIds: new Set(["contract:src/api.ts#User", "module:src/consumer.ts", "module:src/api.ts"]), edgeIds: new Set(["edge-1"]) });
    expect(reportStats(adapted.report)).toMatchObject({ checksPassed: 0, checksTotal: 1, verification: "partial" });
  });

  it("accepts a scan report without an embedded graph", () => {
    const input = {
      schemaVersion: 1,
      version: "loom.report/v1",
      reportId: "report-without-graph",
      generatedAt: "2026-10-18T09:42:00.000Z",
      repository: { name: "loom", branch: "main", commit: "123456789", baseCommit: "abcdefghi" },
      base: "abcdefghi",
      changedFiles: ["src/api.ts"],
      summary: { modules: 1, changedFiles: 1, contractChanges: 0, findings: 0, high: 0, medium: 0, low: 0 },
      contractChanges: [],
      findings: [],
    };
    const adapted = reportFromJson(input);
    expect(adapted.report.nodes).toEqual([]);
    expect(adapted.report.edges).toEqual([]);
    expect(adapted.report.findings).toEqual([]);
  });
});

describe("finding filters", () => {
  it("combines search, severity, and status filters", () => {
    expect(filterFindings(demoReport.findings, { query: "retry", severity: "critical", status: "open" }).map((finding) => finding.id)).toEqual(["finding-retry-boundary"]);
    expect(filterFindings(demoReport.findings, { severity: "low", status: "resolved" })).toHaveLength(1);
  });

  it("returns no results for an unmatched query", () => {
    expect(filterFindings(demoReport.findings, { query: "does-not-exist" })).toEqual([]);
  });
});

describe("graph highlighting", () => {
  it("includes every connected evidence path from the selected node", () => {
    const highlight = getGraphHighlight(demoReport, "payment-contract");
    expect(highlight.nodeIds).toEqual(new Set(["payment-contract", "checkout-api", "checkout-page", "payment-client", "order-service", "checkout-tests", "payments-package"]));
    expect(highlight.edgeIds).toHaveLength(7);
  });

  it("starts empty when no node is selected", () => {
    expect(getGraphHighlight(demoReport).nodeIds.size).toBe(0);
  });
});

describe("verification summaries", () => {
  it("distinguishes not-run, partial, failed, and passing checks", () => {
    expect(verificationSummary([])).toBe("not-run");
    expect(verificationSummary([{ id: "a", name: "a", command: "a", status: "passed" }])).toBe("passing");
    expect(verificationSummary([{ id: "a", name: "a", command: "a", status: "skipped" }])).toBe("partial");
    expect(verificationSummary([{ id: "a", name: "a", command: "a", status: "failed" }])).toBe("failed");
  });
});
