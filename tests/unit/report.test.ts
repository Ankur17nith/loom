import { describe, expect, it } from "vitest";
import { demoReport } from "../../apps/dashboard/src/data/demo-report.js";
import { filterFindings, getGraphHighlight, parseReportJson, reportFromJson, safeParseReportJson } from "../../apps/dashboard/src/lib/report.js";

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
      findings: [{ id: "finding-1", kind: "removed-field", severity: "high", contractPath: "src/api.ts", contract: "User", field: "name", consumer: "src/consumer.ts", message: "User.name was removed", confidence: "high", uncertainty: [], evidence: [{ file: "src/consumer.ts", line: 4, column: 12, code: "user.name", relation: "typed-property", path: ["src/consumer.ts", "src/api.ts"] }] }],
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
