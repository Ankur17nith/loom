import type { Finding, GraphSnapshot, ReportDocument, RepositoryAnalysis } from "./types.js";
import { stableJson, uniqueSorted } from "./utils.js";

export function reportDocument(analysis: RepositoryAnalysis, options: { graph?: GraphSnapshot; impactedFiles?: string[] } = {}): ReportDocument {
  return {
    schemaVersion: 1,
    base: analysis.base,
    changedFiles: [...analysis.changedFiles],
    summary: analysis.summary,
    contractChanges: [...analysis.contractChanges],
    findings: [...analysis.findings],
    ...(options.graph ? { graph: options.graph } : {}),
    ...(options.impactedFiles ? { impactedFiles: uniqueSorted(options.impactedFiles) } : {}),
  };
}

export function jsonReport(document: ReportDocument): string {
  return `${stableJson(document)}\n`;
}

function findingText(finding: Finding): string[] {
  const lines = [
    `[${finding.severity.toUpperCase()}] ${finding.id} ${finding.message}`,
    `  consumer: ${finding.consumer}`,
    `  confidence: ${finding.confidence}`,
  ];
  for (const evidence of finding.evidence) lines.push(`  evidence: ${evidence.file}:${evidence.line}:${evidence.column} (${evidence.relation}) path=${evidence.path.join(" -> ")}`);
  for (const uncertainty of finding.uncertainty) lines.push(`  uncertainty: ${uncertainty}`);
  return lines;
}

export function textReport(document: ReportDocument): string {
  const lines = [
    "Loom report",
    `Base: ${document.base}`,
    `Changed files: ${document.changedFiles.length}${document.changedFiles.length ? ` (${document.changedFiles.join(", ")})` : ""}`,
    `Modules: ${document.summary.modules}`,
    `Contract changes: ${document.summary.contractChanges}`,
    `Findings: ${document.summary.findings} (high ${document.summary.high}, medium ${document.summary.medium}, low ${document.summary.low})`,
  ];
  if (document.impactedFiles) lines.push(`Impacted files: ${document.impactedFiles.length}${document.impactedFiles.length ? ` (${document.impactedFiles.join(", ")})` : ""}`);
  if (document.contractChanges.length) {
    lines.push("Contract changes:");
    for (const change of document.contractChanges) lines.push(`  ${change.kind}: ${change.contractPath}#${change.contract}.${change.previousField ? `${change.previousField} -> ` : ""}${change.field}`);
  }
  if (document.findings.length) {
    lines.push("Findings:");
    for (const finding of document.findings) lines.push(...findingText(finding));
  } else {
    lines.push("No breaking consumer findings.");
  }
  return `${lines.join("\n")}\n`;
}

export function graphText(graph: GraphSnapshot): string {
  const lines = [`Loom graph (${graph.nodes.length} nodes, ${graph.edges.length} edges)`];
  for (const edge of graph.edges) lines.push(`${edge.from} --${edge.relation}${edge.label ? `:${edge.label}` : ""}--> ${edge.to}`);
  return `${lines.join("\n")}\n`;
}

export function explainText(finding: Finding): string {
  return `${findingText(finding).join("\n")}\n`;
}
