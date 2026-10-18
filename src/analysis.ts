import type { SourceInput } from "./parser.js";
import { buildGraph, reverseImportReachability } from "./graph.js";
import { changedFiles, listBaseSourceFiles, listCurrentSourceFiles, readBaseFile, readCurrentFile, repositoryRoot, resolveBase } from "./git.js";
import type { AnalysisOptions, Contract, ContractChange, Finding, FindingEvidence, GraphSnapshot, LoomConfig, ParsedModule, RepositoryAnalysis, Severity, UsageEvidence } from "./types.js";
import { compareStrings, lineText, stableId, uniqueSorted } from "./utils.js";

function inputsForCurrent(root: string, config: LoomConfig): SourceInput[] {
  return listCurrentSourceFiles(root, config).map((filePath) => ({ path: filePath, source: readCurrentFile(root, filePath, config.maxFileBytes) }));
}

function inputsForBase(root: string, base: string, config: LoomConfig): SourceInput[] {
  return listBaseSourceFiles(root, base, config).map((filePath) => ({ path: filePath, source: readBaseFile(root, base, filePath) }));
}

function contractMap(graph: GraphSnapshot): Map<string, { module: ParsedModule; contract: Contract }> {
  const result = new Map<string, { module: ParsedModule; contract: Contract }>();
  for (const module of graph.modules) for (const contract of module.contracts.filter((candidate) => candidate.exported)) result.set(`${module.path}#${contract.name}`, { module, contract });
  return result;
}

function normalizedType(type: string): string {
  return type.replace(/\s+/g, "").replace(/;$/, "");
}

function compareContracts(baseline: GraphSnapshot, current: GraphSnapshot): ContractChange[] {
  const oldContracts = contractMap(baseline);
  const newContracts = contractMap(current);
  const changes: ContractChange[] = [];
  for (const [key, oldValue] of oldContracts) {
    const currentValue = newContracts.get(key);
    if (!currentValue) continue;
    const oldFields = new Map(oldValue.contract.fields.map((field) => [field.name, field]));
    const newFields = new Map(currentValue.contract.fields.map((field) => [field.name, field]));
    const removed = [...oldFields.values()].filter((field) => !newFields.has(field.name));
    const added = [...newFields.values()].filter((field) => !oldFields.has(field.name));
    const pairedAdded = new Set<string>();
    for (const oldField of removed) {
      const rename = added.find((candidate) => !pairedAdded.has(candidate.name) && normalizedType(candidate.type) === normalizedType(oldField.type) && candidate.optional === oldField.optional);
      if (rename) {
        pairedAdded.add(rename.name);
        changes.push({ kind: "renamed-field", contractPath: oldValue.module.path, contract: oldValue.contract.name, field: rename.name, previousField: oldField.name, type: rename.type, optional: rename.optional, evidence: { line: oldField.line, column: oldField.column } });
      } else {
        changes.push({ kind: "removed-field", contractPath: oldValue.module.path, contract: oldValue.contract.name, field: oldField.name, type: oldField.type, optional: oldField.optional, evidence: { line: oldField.line, column: oldField.column } });
      }
    }
    for (const field of added) {
      if (pairedAdded.has(field.name)) continue;
      changes.push({ kind: field.optional ? "added-optional-field" : "added-required-field", contractPath: oldValue.module.path, contract: oldValue.contract.name, field: field.name, type: field.type, optional: field.optional, evidence: { line: field.line, column: field.column } });
    }
  }
  return changes.sort((a, b) => compareStrings(`${a.contractPath}#${a.contract}|${a.kind}|${a.field}|${a.previousField ?? ""}`, `${b.contractPath}#${b.contract}|${b.kind}|${b.field}|${b.previousField ?? ""}`));
}

function moduleSource(graph: GraphSnapshot, filePath: string): string {
  return graph.modules.find((candidate) => candidate.path === filePath)?.source ?? "";
}

function findCurrentUsage(graph: GraphSnapshot, consumer: string, change: ContractChange): { usage: UsageEvidence; uncertain: boolean } | undefined {
  const exact = graph.usages.find((usage) => usage.module === consumer && usage.contractPath === change.contractPath && usage.contract === change.contract && usage.field === (change.previousField ?? change.field));
  if (exact) return { usage: exact, uncertain: false };
  const reachability = reverseImportReachability(graph, change.contractPath);
  const candidate = graph.modules.find((module) => module.path === consumer);
  if (!candidate || !reachability.has(consumer)) return undefined;
  const oldField = change.previousField ?? change.field;
  const property = candidate.propertyAccesses.find((access) => access.property === oldField);
  if (!property) return undefined;
  return {
    usage: { module: consumer, contractPath: change.contractPath, contract: change.contract, field: oldField, relation: "transitive-property", text: property.text, resolved: false, line: property.line, column: property.column },
    uncertain: true,
  };
}

function evidenceFor(consumer: string, change: ContractChange, usage: UsageEvidence, graph: GraphSnapshot, uncertain: boolean): FindingEvidence {
  const path = reverseImportReachability(graph, change.contractPath).get(consumer) ?? [consumer, change.contractPath];
  const source = moduleSource(graph, consumer);
  return { file: consumer, line: usage.line, column: usage.column, code: usage.text || lineText(source, usage.line), relation: usage.relation, path };
}

function findingFor(change: ContractChange, usage: UsageEvidence, consumer: string, graph: GraphSnapshot, uncertain: boolean): Finding {
  const kind: Finding["kind"] = change.kind === "renamed-field" ? "renamed-field" : change.kind === "added-required-field" ? "added-required-field" : "removed-field";
  const severity: Severity = kind === "added-required-field" ? "medium" : "high";
  const message = kind === "renamed-field" ? `${change.contract} renamed ${change.previousField} to ${change.field}; ${consumer} still reads ${change.previousField}` : kind === "added-required-field" ? `${change.contract} added required field ${change.field}; ${consumer} may construct an incomplete value` : `${change.contract}.${change.field} was removed; ${consumer} still reads it`;
  const uncertainty = uncertain ? ["The consumer is connected transitively and its property access could not be type-resolved."] : [];
  const evidence = evidenceFor(consumer, change, usage, graph, uncertain);
  const idValue = `${kind}|${change.contractPath}|${change.contract}|${change.previousField ?? ""}|${change.field}|${consumer}|${evidence.file}|${evidence.line}|${evidence.column}`;
  return { id: stableId("finding", idValue), kind, severity, contractPath: change.contractPath, contract: change.contract, field: change.field, ...(change.previousField ? { previousField: change.previousField } : {}), consumer, message, confidence: uncertain ? "medium" : "high", uncertainty, evidence: [evidence] };
}

function baselineUsagesForChange(change: ContractChange, baseline: GraphSnapshot): { usage: UsageEvidence; uncertain: boolean }[] {
  const oldField = change.previousField ?? change.field;
  const resolved = baseline.usages
    .filter((usage) => usage.contractPath === change.contractPath && usage.contract === change.contract && usage.field === oldField)
    .map((usage) => ({ usage, uncertain: false }));
  const resolvedKeys = new Set(resolved.map(({ usage }) => `${usage.module}|${usage.line}|${usage.column}`));
  const reachability = reverseImportReachability(baseline, change.contractPath);
  for (const module of baseline.modules) {
    if (!reachability.has(module.path) || module.path === change.contractPath) continue;
    for (const access of module.propertyAccesses.filter((candidate) => candidate.property === oldField)) {
      const key = `${module.path}|${access.line}|${access.column}`;
      if (resolvedKeys.has(key)) continue;
      resolved.push({ usage: { module: module.path, contractPath: change.contractPath, contract: change.contract, field: oldField, relation: "transitive-property", text: access.text, resolved: false, line: access.line, column: access.column }, uncertain: true });
    }
  }
  return resolved;
}

function detectFindings(changes: ContractChange[], baseline: GraphSnapshot, current: GraphSnapshot): Finding[] {
  const findings: Finding[] = [];
  for (const change of changes.filter((candidate) => candidate.kind !== "added-optional-field")) {
    const oldUsages = baselineUsagesForChange(change, baseline);
    for (const baselineUsage of oldUsages) {
      const consumer = baselineUsage.usage.module;
      const currentUsage = findCurrentUsage(current, consumer, change);
      if (!currentUsage) continue;
      findings.push(findingFor(change, currentUsage.usage, consumer, current, baselineUsage.uncertain || currentUsage.uncertain));
    }
    if (change.kind === "added-required-field") {
      const reachability = reverseImportReachability(current, change.contractPath);
      for (const consumer of uniqueSorted([...reachability.keys()].filter((candidate) => candidate !== change.contractPath))) {
        const module = current.modules.find((candidate) => candidate.path === consumer);
        if (!module || !module.propertyAccesses.some((access) => access.contractNames.includes(change.contract))) continue;
        const access = module.propertyAccesses.find((candidate) => candidate.contractNames.includes(change.contract));
        if (access) findings.push(findingFor(change, { module: consumer, contractPath: change.contractPath, contract: change.contract, field: change.field, relation: "typed-property", text: access.text, resolved: true, line: access.line, column: access.column }, consumer, current, false));
      }
    }
  }
  return [...new Map(findings.map((finding) => [finding.id, finding])).values()].sort((a, b) => compareStrings(a.id, b.id));
}

function summary(analysis: Omit<RepositoryAnalysis, "summary">): RepositoryAnalysis["summary"] {
  return {
    modules: analysis.current.modules.length,
    changedFiles: analysis.changedFiles.length,
    contractChanges: analysis.contractChanges.length,
    findings: analysis.findings.length,
    high: analysis.findings.filter((finding) => finding.severity === "high").length,
    medium: analysis.findings.filter((finding) => finding.severity === "medium").length,
    low: analysis.findings.filter((finding) => finding.severity === "low").length,
  };
}

export function analyzeRepository(options: AnalysisOptions): RepositoryAnalysis {
  const root = repositoryRoot(options.root);
  const config = options.config ?? { extensions: [".ts", ".tsx", ".js", ".jsx"], exclude: ["node_modules", "dist", "build", "coverage", ".git"], maxFiles: 10_000, maxFileBytes: 1_000_000, verification: { commands: [], timeoutMs: 30_000, maxOutputBytes: 100_000 } };
  const base = resolveBase(root, options.base ?? config.base);
  const currentInputs = inputsForCurrent(root, config);
  const baselineInputs = inputsForBase(root, base, config);
  if (currentInputs.length > config.maxFiles || baselineInputs.length > config.maxFiles) throw new Error(`Configured file limit of ${config.maxFiles} exceeded`);
  const current = buildGraph(currentInputs);
  const baseline = buildGraph(baselineInputs);
  const contractChanges = compareContracts(baseline, current);
  const findings = detectFindings(contractChanges, baseline, current);
  const partial: Omit<RepositoryAnalysis, "summary"> = { root, base, changedFiles: changedFiles(root, base, config), current, baseline, contractChanges, findings };
  return { ...partial, summary: summary(partial) };
}
