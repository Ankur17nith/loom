#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command, CommanderError } from "commander";
import { createRequire } from "node:module";
import { analyzeRepository } from "./analysis.js";
import { ConfigError, initConfig, loadConfig } from "./config.js";
import { gitAvailable, repositoryRoot } from "./git.js";
import { reverseImportReachability } from "./graph.js";
import { graphText, explainText, jsonReport, reportDocument, textReport } from "./report.js";
import type { Finding, LoomConfig, ReportDocument } from "./types.js";
import { pathIsInside } from "./utils.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

export interface CliIo {
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

class CliFailure extends Error {
  public constructor(public readonly exitCode: number, message: string) {
    super(message);
  }
}

function output(io: CliIo, text: string): void {
  (io.stdout ?? ((value: string) => process.stdout.write(value)))(text);
}

function errorOutput(io: CliIo, text: string): void {
  (io.stderr ?? ((value: string) => process.stderr.write(value)))(text);
}

function addRepositoryOptions(command: Command): Command {
  return command
    .option("--root <path>", "repository root (default: current directory)")
    .option("--base <commit>", "Git commit to compare with")
    .option("--config <path>", "repository-relative JSON config path")
    .option("--format <format>", "output format: text or json", "text")
    .option("--output <path>", "repository-relative output file");
}

function commandOptions(command: Command): { root: string; base?: string; configPath?: string; format: "text" | "json"; output?: string } {
  const options = command.opts() as { root?: string; base?: string; config?: string; format?: string; output?: string };
  const format = options.format ?? "text";
  if (format !== "text" && format !== "json") throw new CliFailure(2, `Unsupported format ${format}; use text or json`);
  return { root: path.resolve(options.root ?? process.cwd()), ...(options.base ? { base: options.base } : {}), ...(options.config ? { configPath: options.config } : {}), format, ...(options.output ? { output: options.output } : {}) };
}

function loadRepositoryConfig(options: ReturnType<typeof commandOptions>): { root: string; config: LoomConfig } {
  let root: string;
  try {
    root = repositoryRoot(options.root);
  } catch (error) {
    throw new CliFailure(2, error instanceof Error ? error.message : String(error));
  }
  try {
    return { root, config: loadConfig(root, options.configPath) };
  } catch (error) {
    throw new CliFailure(2, error instanceof Error ? error.message : String(error));
  }
}

function writeResult(root: string, requested: string | undefined, text: string): void {
  if (!requested) return;
  if (path.isAbsolute(requested)) throw new CliFailure(2, "Output path must be repository-relative");
  const destination = path.resolve(root, requested);
  if (!pathIsInside(root, destination)) throw new CliFailure(2, "Output path must stay inside the repository");
  fs.writeFileSync(destination, text, "utf8");
}

function render(document: ReportDocument, format: "text" | "json"): string {
  return format === "json" ? jsonReport(document) : textReport(document);
}

function analyzeForCommand(command: Command) {
  const options = commandOptions(command);
  const repository = loadRepositoryConfig(options);
  const analysis = analyzeRepository({ root: repository.root, config: repository.config, ...(options.base ? { base: options.base } : {}) });
  return { options, ...repository, analysis };
}

function addScanCommand(program: Command): void {
  const command = addRepositoryOptions(program.command("scan").description("Analyze Git changes and report contract consumers"));
  command.action(() => {
    const result = analyzeForCommand(command);
    const text = render(reportDocument(result.analysis), result.options.format);
    writeResult(result.root, result.options.output, text);
    if (!result.options.output) output({}, text);
  });
}

function addImpactCommand(program: Command): void {
  const command = addRepositoryOptions(program.command("impact").description("Show files transitively impacted by changed modules"));
  command.action(() => {
    const result = analyzeForCommand(command);
    const impacted = new Set(result.analysis.changedFiles);
    for (const changed of result.analysis.changedFiles) for (const file of reverseImportReachability(result.analysis.current, changed).keys()) impacted.add(file);
    const text = render(reportDocument(result.analysis, { impactedFiles: [...impacted] }), result.options.format);
    writeResult(result.root, result.options.output, text);
    if (!result.options.output) output({}, text);
  });
}

function addGraphCommand(program: Command): void {
  const command = addRepositoryOptions(program.command("graph").description("Print the deterministic current-repository graph"));
  command.action(() => {
    const result = analyzeForCommand(command);
    const text = result.options.format === "json" ? `${JSON.stringify({ schemaVersion: 1, graph: result.analysis.current }, null, 2)}\n` : graphText(result.analysis.current);
    writeResult(result.root, result.options.output, text);
    if (!result.options.output) output({}, text);
  });
}

function addReportCommand(program: Command): void {
  const command = addRepositoryOptions(program.command("report").description("Write a complete scan report"));
  command.action(() => {
    const result = analyzeForCommand(command);
    const text = render(reportDocument(result.analysis, { graph: result.analysis.current }), result.options.format);
    writeResult(result.root, result.options.output, text);
    if (!result.options.output) output({}, text);
  });
}

function addExplainCommand(program: Command): void {
  const command = addRepositoryOptions(program.command("explain <findingId>").description("Explain one finding with its evidence"));
  command.action((findingId: string) => {
    const result = analyzeForCommand(command);
    const finding = result.analysis.findings.find((candidate) => candidate.id === findingId);
    if (!finding) throw new CliFailure(2, `Finding ${findingId} was not found`);
    const text = result.options.format === "json" ? `${JSON.stringify(finding, null, 2)}\n` : explainText(finding);
    writeResult(result.root, result.options.output, text);
    if (!result.options.output) output({}, text);
  });
}

function addCiCommand(program: Command): void {
  const command = addRepositoryOptions(program.command("ci").description("Run the scan as a bounded CI gate"));
  command.option("--fail-on <severity>", "fail on high, medium, or low findings", "high");
  command.action(() => {
    const result = analyzeForCommand(command);
    const commandConfig = command.opts() as { failOn?: string };
    const failOn = commandConfig.failOn ?? "high";
    const ranks = { high: 3, medium: 2, low: 1 };
    if (!(failOn in ranks)) throw new CliFailure(2, `Unsupported --fail-on ${failOn}`);
    const text = render(reportDocument(result.analysis), result.options.format);
    writeResult(result.root, result.options.output, text);
    if (!result.options.output) output({}, text);
    if (result.analysis.findings.some((finding) => ranks[finding.severity] >= ranks[failOn as keyof typeof ranks])) throw new CliFailure(1, `CI found findings at or above ${failOn}`);
  });
}

function addDoctorCommand(program: Command): void {
  const command = addRepositoryOptions(program.command("doctor").description("Check Loom prerequisites without running project scripts"));
  command.action(() => {
    const options = commandOptions(command);
    const checks: Record<string, string | boolean> = { node: process.versions.node, gitRepository: false, config: false };
    try {
      const root = repositoryRoot(options.root);
      checks.gitRepository = true;
      loadConfig(root, options.configPath);
      checks.config = true;
    } catch (error) {
      checks.error = error instanceof Error ? error.message : String(error);
    }
    const ok = checks.gitRepository === true && checks.config === true;
    const text = options.format === "json" ? `${JSON.stringify({ schemaVersion: 1, version: packageJson.version, ok, checks }, null, 2)}\n` : [`Loom ${packageJson.version}`, `Node: ${checks.node}`, `Git repository: ${checks.gitRepository ? "ok" : "missing"}`, `Config: ${checks.config ? "ok" : "invalid or missing repository"}`, checks.error ? `Error: ${checks.error}` : "Ready for bounded analysis.", ""].join("\n");
    writeResult(options.root, options.output, text);
    if (!options.output) output({}, text);
    if (!ok) throw new CliFailure(2, "Doctor found a prerequisite problem");
  });
}

function addInitCommand(program: Command): void {
  const command = program.command("init").description("Create a safe JSON-only Loom config").option("--root <path>", "repository root (default: current directory)").option("--force", "replace an existing config");
  command.action(() => {
    const options = command.opts() as { root?: string; force?: boolean };
    try {
      const root = repositoryRoot(path.resolve(options.root ?? process.cwd()));
      const file = initConfig(root, options.force === true);
      output({}, `Created ${file}\n`);
    } catch (error) {
      throw new CliFailure(2, error instanceof Error ? error.message : String(error));
    }
  });
}

function createProgram(io: CliIo): Command {
  const program = new Command();
  program.name("loom").description("See what your changes touch.").version(packageJson.version).configureOutput({ writeOut: (text) => output(io, text), writeErr: (text) => errorOutput(io, text) }).exitOverride();
  addScanCommand(program);
  addImpactCommand(program);
  addGraphCommand(program);
  addReportCommand(program);
  addExplainCommand(program);
  addDoctorCommand(program);
  addCiCommand(program);
  addInitCommand(program);
  return program;
}

export async function runCli(argv: string[], io: CliIo = {}): Promise<number> {
  const program = createProgram(io);
  try {
    await program.parseAsync(["node", "loom", ...argv]);
    return 0;
  } catch (error) {
    if (error instanceof CliFailure) {
      errorOutput(io, `loom: ${error.message}\n`);
      return error.exitCode;
    }
    if (error instanceof CommanderError) return error.exitCode === 0 ? 0 : 2;
    errorOutput(io, `loom: ${error instanceof Error ? error.message : String(error)}\n`);
    return 3;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
