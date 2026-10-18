import { z } from "zod";

export const ReportVersion = z.literal("loom.report/v1");

const Severity = z.enum(["critical", "high", "medium", "low"]);
const FindingStatus = z.enum(["open", "reviewed", "resolved"]);
const NodeKind = z.enum(["file", "function", "type", "test", "package"]);
const EdgeKind = z.enum(["imports", "calls", "implements", "tested-by", "exports"]);

export const ReportSchema = z.object({
  version: ReportVersion,
  reportId: z.string().min(1),
  generatedAt: z.string().datetime(),
  repository: z.object({
    name: z.string().min(1),
    branch: z.string().min(1),
    commit: z.string().min(7),
    baseCommit: z.string().min(7),
  }),
  summary: z.object({
    filesChanged: z.number().int().nonnegative(),
    findings: z.number().int().nonnegative(),
    highRisk: z.number().int().nonnegative(),
    verification: z.enum(["passing", "partial", "failed", "not-run"]),
  }),
  nodes: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    path: z.string().min(1),
    kind: NodeKind,
    lines: z.string().optional(),
    changed: z.boolean().default(false),
    position: z.object({ x: z.number(), y: z.number() }),
  })),
  edges: z.array(z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    kind: EdgeKind,
    evidence: z.string().min(1),
  })),
  findings: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    severity: Severity,
    status: FindingStatus,
    confidence: z.number().min(0).max(1),
    category: z.string().min(1),
    location: z.object({ file: z.string().min(1), line: z.number().int().positive() }),
    evidence: z.array(z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      source: z.string().min(1),
    })).min(1),
    affectedNodeIds: z.array(z.string().min(1)).min(1),
    recommendedAction: z.string().min(1),
    introducedIn: z.string().min(1),
  })),
  checks: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    command: z.string().min(1),
    status: z.enum(["passed", "failed", "skipped", "running"]),
    durationMs: z.number().int().nonnegative().optional(),
    output: z.string().optional(),
  })),
});

export type LoomReport = z.infer<typeof ReportSchema>;
export type Finding = LoomReport["findings"][number];
export type GraphNode = LoomReport["nodes"][number];
export type GraphEdge = LoomReport["edges"][number];
export type FindingSeverity = Finding["severity"];
export type FindingStatus = Finding["status"];

export type ReportSource = "demo-fixture" | "report-json";

export type ReportLoadResult = {
  report: LoomReport;
  source: ReportSource;
  label: string;
};

export function parseReportJson(input: unknown): LoomReport {
  return ReportSchema.parse(input);
}

export function safeParseReportJson(input: unknown) {
  return ReportSchema.safeParse(input);
}

export function reportFromJson(input: unknown): ReportLoadResult {
  return {
    report: parseReportJson(input),
    source: "report-json",
    label: "Imported report",
  };
}

export function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function filterFindings(
  findings: LoomReport["findings"],
  filters: { query?: string; severity?: FindingSeverity | "all"; status?: FindingStatus | "all" },
): LoomReport["findings"] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return findings.filter((finding) => {
    const matchesQuery = !query || [finding.title, finding.summary, finding.location.file, finding.category]
      .some((value) => value.toLowerCase().includes(query));
    const matchesSeverity = !filters.severity || filters.severity === "all" || finding.severity === filters.severity;
    const matchesStatus = !filters.status || filters.status === "all" || finding.status === filters.status;
    return matchesQuery && matchesSeverity && matchesStatus;
  });
}

export function getGraphHighlight(report: LoomReport, selectedNodeId?: string) {
  if (!selectedNodeId) return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
  const nodeIds = new Set([selectedNodeId]);
  const edgeIds = new Set<string>();
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const edge of report.edges) {
      if (nodeIds.has(edge.source) || nodeIds.has(edge.target)) {
        edgeIds.add(edge.id);
        if (!nodeIds.has(edge.source)) { nodeIds.add(edge.source); expanded = true; }
        if (!nodeIds.has(edge.target)) { nodeIds.add(edge.target); expanded = true; }
      }
    }
  }
  return { nodeIds, edgeIds };
}

export function getFinding(report: LoomReport, id: string | undefined): Finding | undefined {
  return report.findings.find((finding) => finding.id === id);
}
