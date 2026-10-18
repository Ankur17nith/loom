import { z } from "zod";

export const ReportVersion = z.literal("loom.report/v1");

const Severity = z.enum(["critical", "high", "medium", "low"]);
const FindingStatus = z.enum(["open", "reviewed", "resolved"]);
const NodeKind = z.enum(["file", "module", "function", "type", "property", "route", "contract", "component", "consumer", "database-schema", "test", "package", "framework"]);
const EdgeKind = z.enum(["imports", "exports", "declares", "contains", "uses-type", "reads-property", "returns-contract", "accepts-contract", "serves-route", "consumes-response", "defines-schema", "covered-by", "calls", "implements", "tested-by", "renders", "framework"]);

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
  contractChanges: z.array(z.object({
    kind: z.string(),
    contractPath: z.string(),
    contract: z.string(),
    field: z.string(),
    previousField: z.string().optional(),
    type: z.string().optional(),
    optional: z.boolean().optional(),
    evidence: z.object({ line: z.number().int(), column: z.number().int() }).optional(),
  })).default([]),
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
      file: z.string().min(1).optional(),
      line: z.number().int().positive().optional(),
      column: z.number().int().positive().optional(),
      code: z.string().optional(),
      relation: z.string().optional(),
      path: z.array(z.string().min(1)).optional(),
    })).min(1),
    affectedNodeIds: z.array(z.string().min(1)),
    recommendedAction: z.string().min(1),
    introducedIn: z.string().min(1),
    uncertainty: z.array(z.string()).default([]),
  })),
  checks: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    command: z.string().min(1),
    status: z.enum(["passed", "failed", "skipped", "running", "inconclusive"]),
    durationMs: z.number().int().nonnegative().optional(),
    output: z.string().optional(),
    reason: z.string().optional(),
  })),
  verification: z.array(z.object({
    id: z.string().min(1),
    command: z.array(z.string().min(1)).min(1),
    status: z.enum(["passed", "failed", "inconclusive"]),
    exitCode: z.number().int().optional(),
    durationMs: z.number().int().nonnegative(),
    output: z.string(),
    reason: z.string().optional(),
  })).optional(),
});

export type LoomReport = z.infer<typeof ReportSchema>;
export type Finding = LoomReport["findings"][number];
export type GraphNode = LoomReport["nodes"][number];
export type GraphEdge = LoomReport["edges"][number];
export type FindingSeverity = Finding["severity"];
export type FindingStatus = Finding["status"];
export type VerificationSummary = "passing" | "partial" | "failed" | "not-run";
export type GraphScope = { nodeIds: Set<string>; edgeIds: Set<string> };

export type ReportSource = "demo-fixture" | "report-json";

export type ReportLoadResult = {
  report: LoomReport;
  source: ReportSource;
  label: string;
};

const EngineReportSchema = z.object({
  schemaVersion: z.literal(1),
  version: z.literal("loom.report/v1"),
  reportId: z.string().min(1),
  generatedAt: z.string().datetime(),
  repository: z.object({
    name: z.string().min(1),
    branch: z.string().min(1),
    commit: z.string().min(1),
    baseCommit: z.string().min(1),
  }),
  base: z.string().min(1),
  changedFiles: z.array(z.string()),
  summary: z.object({
    modules: z.number().int().nonnegative(),
    changedFiles: z.number().int().nonnegative(),
    contractChanges: z.number().int().nonnegative(),
    findings: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
  }),
  contractChanges: z.array(z.object({
    kind: z.string(),
    contractPath: z.string(),
    contract: z.string(),
    field: z.string(),
    previousField: z.string().optional(),
    type: z.string().optional(),
    optional: z.boolean().optional(),
    evidence: z.object({ line: z.number().int(), column: z.number().int() }),
  })),
  findings: z.array(z.object({
    id: z.string(),
    kind: z.string(),
    severity: z.enum(["high", "medium", "low"]),
    contractPath: z.string(),
    contract: z.string(),
    field: z.string(),
    previousField: z.string().optional(),
    consumer: z.string(),
    message: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
    uncertainty: z.array(z.string()),
    evidence: z.array(z.object({
      file: z.string(),
      line: z.number().int(),
      column: z.number().int(),
      code: z.string(),
      relation: z.string(),
      path: z.array(z.string()),
    })),
  })),
  verification: z.array(z.object({
    id: z.string(),
    command: z.array(z.string().min(1)).min(1),
    status: z.enum(["passed", "failed", "inconclusive"]),
    exitCode: z.number().int().optional(),
    durationMs: z.number().int().nonnegative(),
    output: z.string(),
    reason: z.string().optional(),
  })).optional(),
  graph: z.object({
    nodes: z.array(z.object({ id: z.string(), kind: z.string(), label: z.string(), path: z.string().optional() })),
    edges: z.array(z.object({ id: z.string(), from: z.string(), to: z.string(), relation: z.string(), label: z.string().optional(), evidence: z.string().optional() })),
  }).optional(),
});

export function parseReportJson(input: unknown): LoomReport {
  return ReportSchema.parse(input);
}

export function safeParseReportJson(input: unknown) {
  return ReportSchema.safeParse(input);
}

export function reportFromJson(input: unknown): ReportLoadResult {
  const parsed = ReportSchema.safeParse(input);
  if (parsed.success) return { report: parsed.data, source: "report-json", label: "Imported report" };
  const engine = EngineReportSchema.parse(input);
  return { report: adaptEngineReport(engine), source: "report-json", label: "Loom engine report" };
}

type EngineReport = z.infer<typeof EngineReportSchema>;

function engineNodeKind(kind: string): LoomReport["nodes"][number]["kind"] {
  if (kind === "module") return "file";
  if (kind === "contract") return "type";
  return NodeKind.options.includes(kind as never) ? kind as LoomReport["nodes"][number]["kind"] : "file";
}

function adaptEngineReport(input: EngineReport): LoomReport {
  const graphNodes = input.graph?.nodes ?? [];
  const nodeIds = new Set(graphNodes.map((node) => node.id));
  const nodes = graphNodes.map((node, index) => ({
    id: node.id,
    label: node.label,
    path: node.path ?? node.label,
    kind: engineNodeKind(node.kind),
    changed: input.changedFiles.includes(node.path ?? ""),
    position: { x: 80 + (index % 4) * 280, y: 80 + Math.floor(index / 4) * 150 },
  }));
  const edges = (input.graph?.edges ?? []).filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to)).map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    kind: edge.relation as LoomReport["edges"][number]["kind"],
    evidence: edge.evidence ?? edge.label ?? edge.relation,
  }));
  const findings = input.findings.map((finding) => {
    const contractId = `contract:${finding.contractPath}#${finding.contract}`;
    const consumerId = `module:${finding.consumer}`;
    const affectedNodeIds = [contractId, consumerId, ...finding.evidence.flatMap((evidence) => evidence.path.map((file) => `module:${file}`))].filter((id, index, values) => nodeIds.has(id) && values.indexOf(id) === index);
    const firstEvidence = finding.evidence[0];
    return {
      id: finding.id,
      title: finding.message,
      summary: finding.message,
      severity: finding.severity === "high" ? "high" as const : finding.severity === "medium" ? "medium" as const : "low" as const,
      status: "open" as const,
      confidence: finding.confidence === "high" ? 0.95 : finding.confidence === "medium" ? 0.65 : 0.35,
      category: finding.kind,
      location: { file: firstEvidence?.file ?? finding.contractPath, line: firstEvidence?.line ?? 1 },
      evidence: finding.evidence.map((evidence) => ({
        label: evidence.relation,
        value: evidence.code || finding.message,
        source: `${evidence.file}:${evidence.line}:${evidence.column}`,
        file: evidence.file,
        line: evidence.line,
        column: evidence.column,
        code: evidence.code,
        relation: evidence.relation,
        path: evidence.path,
      })),
      affectedNodeIds: affectedNodeIds.length ? affectedNodeIds : [consumerId].filter((id) => nodeIds.has(id)),
      recommendedAction: finding.kind === "renamed-field" ? `Update ${finding.consumer} to read ${finding.field}, or preserve a compatibility alias.` : `Review ${finding.consumer} and add a focused regression check before merging.`,
      introducedIn: input.repository.commit,
      uncertainty: finding.uncertainty,
    };
  });
  const checks: LoomReport["checks"] = (input.verification ?? []).map((result) => ({
    id: result.id,
    name: result.command.join(" "),
    command: result.command.join(" "),
    status: result.status,
    durationMs: result.durationMs,
    output: result.output,
    ...(result.reason ? { reason: result.reason } : {}),
  }));
  return ReportSchema.parse({
    version: "loom.report/v1",
    reportId: input.reportId,
    generatedAt: input.generatedAt,
    repository: input.repository,
    summary: { filesChanged: input.summary.changedFiles, findings: input.summary.findings, highRisk: input.summary.high, verification: verificationSummary(checks) },
    contractChanges: input.contractChanges,
    nodes,
    edges,
    findings,
    checks,
    verification: input.verification,
  });
}

export function verificationSummary(checks: LoomReport["checks"]): VerificationSummary {
  if (checks.length === 0) return "not-run";
  if (checks.some((check) => check.status === "failed")) return "failed";
  if (checks.some((check) => check.status === "inconclusive" || check.status === "running" || check.status === "skipped")) return "partial";
  return "passing";
}

export function reportStats(report: LoomReport) {
  return {
    filesChanged: report.summary.filesChanged,
    findings: report.findings.length,
    highRisk: report.findings.filter((finding) => finding.severity === "critical" || finding.severity === "high").length,
    contractChanges: report.contractChanges.length,
    affectedNodes: new Set(report.findings.flatMap((finding) => finding.affectedNodeIds)).size,
    checksPassed: report.checks.filter((check) => check.status === "passed").length,
    checksTotal: report.checks.length,
    verification: verificationSummary(report.checks),
  };
}

export function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function findingSummary(finding: Finding): string {
  return finding.uncertainty.length > 0
    ? `${finding.summary} Limits: ${finding.uncertainty.join(" ")}`
    : finding.summary;
}

export function filterFindings(
  findings: LoomReport["findings"],
  filters: { query?: string; severity?: FindingSeverity | "all"; status?: FindingStatus | "all" },
): LoomReport["findings"] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return findings.filter((finding) => {
    const matchesQuery = !query || [finding.title, findingSummary(finding), finding.location.file, finding.category, ...finding.uncertainty]
      .some((value) => value.toLowerCase().includes(query));
    const matchesSeverity = !filters.severity || filters.severity === "all" || finding.severity === filters.severity;
    const matchesStatus = !filters.status || filters.status === "all" || finding.status === filters.status;
    return matchesQuery && matchesSeverity && matchesStatus;
  });
}

export function getFindingGraphScope(report: LoomReport, finding: Finding): GraphScope {
  const nodeIds = new Set(finding.affectedNodeIds);
  const pathFiles = finding.evidence.flatMap((evidence) => evidence.path ?? []);
  for (const node of report.nodes) {
    if (pathFiles.includes(node.path) || pathFiles.includes(node.id) || pathFiles.includes(node.id.replace(/^module:/, ""))) nodeIds.add(node.id);
  }
  const edgeIds = new Set(report.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => edge.id));
  return { nodeIds, edgeIds };
}

export function getGraphHighlight(report: LoomReport, selectedNodeId?: string, scope?: GraphScope) {
  if (scope) {
    const nodeIds = new Set(scope.nodeIds);
    if (selectedNodeId) nodeIds.add(selectedNodeId);
    return { nodeIds, edgeIds: new Set(scope.edgeIds) };
  }
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
