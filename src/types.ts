export type Framework = "react" | "express";
export type GraphNodeKind = "module" | "contract" | "framework";
export type GraphRelation = "imports" | "exports" | "uses-type" | "reads-property" | "renders" | "framework";
export type FindingKind = "removed-field" | "renamed-field" | "added-required-field";
export type Severity = "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";

export interface SourcePosition {
  line: number;
  column: number;
}

export interface ImportRecord extends SourcePosition {
  source: string;
  imported: string;
  local: string;
  kind: "named" | "default" | "namespace" | "side-effect" | "re-export";
  typeOnly: boolean;
}

export interface ContractField extends SourcePosition {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
}

export interface Contract extends SourcePosition {
  name: string;
  kind: "interface" | "type";
  exported: boolean;
  fields: ContractField[];
}

export interface PropertyAccess extends SourcePosition {
  receiver: string;
  property: string;
  text: string;
  contractNames: string[];
}

export interface JsxUsage extends SourcePosition {
  tag: string;
  props: string[];
}

export interface ParsedModule {
  path: string;
  imports: ImportRecord[];
  contracts: Contract[];
  propertyAccesses: PropertyAccess[];
  jsxUsages: JsxUsage[];
  frameworks: Framework[];
  parseErrors: string[];
}

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  path?: string;
  framework?: Framework;
}

export interface GraphEdge extends SourcePosition {
  id: string;
  from: string;
  to: string;
  relation: GraphRelation;
  label?: string;
  evidence?: string;
}

export interface UsageEvidence extends SourcePosition {
  module: string;
  contractPath: string;
  contract: string;
  field: string;
  relation: "typed-property" | "jsx-prop" | "transitive-property";
  text: string;
  resolved: boolean;
}

export interface GraphSnapshot {
  modules: ParsedModule[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  usages: UsageEvidence[];
}

export interface ContractChange {
  kind: FindingKind | "added-optional-field";
  contractPath: string;
  contract: string;
  field: string;
  previousField?: string;
  type: string;
  optional: boolean;
  evidence: SourcePosition;
}

export interface FindingEvidence extends SourcePosition {
  file: string;
  code: string;
  relation: string;
  path: string[];
}

export interface Finding {
  id: string;
  kind: FindingKind;
  severity: Severity;
  contractPath: string;
  contract: string;
  field: string;
  previousField?: string;
  consumer: string;
  message: string;
  confidence: Confidence;
  uncertainty: string[];
  evidence: FindingEvidence[];
}

export interface RepositorySummary {
  modules: number;
  changedFiles: number;
  contractChanges: number;
  findings: number;
  high: number;
  medium: number;
  low: number;
}

export interface RepositoryAnalysis {
  base: string;
  changedFiles: string[];
  current: GraphSnapshot;
  baseline: GraphSnapshot;
  contractChanges: ContractChange[];
  findings: Finding[];
  summary: RepositorySummary;
}

export interface LoomConfig {
  base?: string;
  extensions: string[];
  exclude: string[];
  maxFiles: number;
  maxFileBytes: number;
}

export interface AnalysisOptions {
  root: string;
  base?: string;
  config?: LoomConfig;
}

export interface ReportDocument {
  schemaVersion: 1;
  base: string;
  changedFiles: string[];
  summary: RepositorySummary;
  contractChanges: ContractChange[];
  findings: Finding[];
  graph?: GraphSnapshot;
  impactedFiles?: string[];
}
