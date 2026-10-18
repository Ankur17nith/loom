import { describe, expect, it } from "vitest";
import { demoReport } from "../../apps/dashboard/src/data/demo-report.js";
import { filterFindings, getGraphHighlight, parseReportJson, safeParseReportJson } from "../../apps/dashboard/src/lib/report.js";

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
