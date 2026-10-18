import path from "node:path";
import * as ts from "typescript";
import { parseSource, type SourceInput } from "./parser.js";
import { compareStrings, normalizeRepoPath, stableId, uniqueSorted } from "./utils.js";
import type { Contract, Framework, GraphEdge, GraphNode, GraphSnapshot, ImportRecord, ParsedModule, PropertyAccess, UsageEvidence } from "./types.js";

export function moduleId(filePath: string): string {
  return `module:${normalizeRepoPath(filePath)}`;
}

export function contractId(filePath: string, name: string): string {
  return `contract:${normalizeRepoPath(filePath)}#${name}`;
}

function resolveImport(from: string, source: string, paths: Set<string>): string | undefined {
  if (!source.startsWith(".")) return undefined;
  const base = normalizeRepoPath(path.posix.normalize(path.posix.join(path.posix.dirname(from), source)));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`, `${base}/index.jsx`];
  return candidates.find((candidate) => paths.has(candidate));
}

function addEdge(edges: GraphEdge[], from: string, to: string, relation: GraphEdge["relation"], pos: { line: number; column: number }, label?: string, evidence?: string): void {
  edges.push({ id: stableId("edge", `${from}|${to}|${relation}|${label ?? ""}|${pos.line}|${pos.column}`), from, to, relation, ...(label ? { label } : {}), ...(evidence ? { evidence } : {}), ...pos });
}

function contractLookup(modules: ParsedModule[]): Map<string, Contract> {
  const result = new Map<string, Contract>();
  for (const module of modules) for (const contract of module.contracts) result.set(`${module.path}#${contract.name}`, contract);
  return result;
}

function importedContract(module: ParsedModule, imported: ImportRecord, resolved: string | undefined, contracts: Map<string, Contract>, aliases: Map<string, { path: string; name: string }>): { path: string; name: string } | undefined {
  if (!resolved || imported.imported === "*" || imported.imported === "default") return undefined;
  const key = `${resolved}#${imported.imported}`;
  if (contracts.has(key)) return { path: resolved, name: imported.imported };
  return aliases.get(key);
}

function refsForProperty(module: ParsedModule, access: PropertyAccess, paths: Set<string>, contracts: Map<string, Contract>, aliases: Map<string, { path: string; name: string }>): { path: string; name: string; resolved: boolean }[] {
  if (access.resolvedContracts?.length) return access.resolvedContracts.map((ref) => ({ ...ref, resolved: true }));
  const refs: { path: string; name: string; resolved: boolean }[] = [];
  for (const name of access.contractNames) {
    const imported = module.imports.find((candidate) => candidate.local === name);
    if (imported) {
      const resolved = resolveImport(module.path, imported.source, paths);
      const ref = importedContract(module, imported, resolved, contracts, aliases);
      if (ref) refs.push({ ...ref, resolved: true });
    } else if (contracts.has(`${module.path}#${name}`)) {
      refs.push({ path: module.path, name, resolved: true });
    }
  }
  return refs;
}

function semanticPropertyRefs(inputs: SourceInput[]): Map<string, { path: string; name: string }[]> {
  const cacheKey = inputs.map((input) => `${input.path}\0${input.source}`).join("\0");
  const cached = semanticCache.get(cacheKey);
  if (cached) return cached;
  const virtualRoot = path.resolve("/.loom-virtual-analysis");
  const fileNames = new Map(inputs.map((input) => [path.resolve(virtualRoot, input.path), input]));
  const compilerOptions: ts.CompilerOptions = {
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    noLib: true,
  };
  const host = ts.createCompilerHost(compilerOptions, true);
  const defaultGetSourceFile = host.getSourceFile.bind(host);
  const defaultFileExists = host.fileExists.bind(host);
  const defaultReadFile = host.readFile.bind(host);
  host.fileExists = (fileName) => fileNames.has(path.resolve(fileName)) || defaultFileExists(fileName);
  host.readFile = (fileName) => fileNames.get(path.resolve(fileName))?.source ?? defaultReadFile(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const input = fileNames.get(path.resolve(fileName));
    if (input) return ts.createSourceFile(fileName, input.source, languageVersion, true, input.path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    return defaultGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };
  host.resolveModuleNames = (moduleNames, containingFile) => moduleNames.map((moduleName) => ts.resolveModuleName(moduleName, containingFile, compilerOptions, host).resolvedModule);
  const program = ts.createProgram([...fileNames.keys()], compilerOptions, host);
  const checker = program.getTypeChecker();
  const result = new Map<string, { path: string; name: string }[]>();

  function contractDeclaration(declaration: ts.Declaration): { path: string; name: string } | undefined {
    let parent: ts.Node = declaration.parent;
    if (ts.isTypeLiteralNode(parent)) parent = parent.parent;
    if (!ts.isInterfaceDeclaration(parent) && !ts.isTypeAliasDeclaration(parent)) return undefined;
    const sourceFile = parent.getSourceFile();
    const relativePath = inputs.find((input) => path.resolve(virtualRoot, input.path) === path.resolve(sourceFile.fileName))?.path;
    return relativePath ? { path: relativePath, name: parent.name.text } : undefined;
  }

  for (const input of inputs) {
    const sourceFile = program.getSourceFile(path.resolve(virtualRoot, input.path));
    if (!sourceFile) continue;
    const module = parseSource(input);
    for (const access of module.propertyAccesses) {
      const target = sourceFile.getPositionOfLineAndCharacter(access.line - 1, access.column - 1);
      let propertyNode: ts.PropertyAccessExpression | undefined;
      const find = (node: ts.Node): void => {
        if (node.getStart(sourceFile) === target && ts.isPropertyAccessExpression(node)) propertyNode = node;
        if (target >= node.getStart(sourceFile) && target <= node.getEnd()) ts.forEachChild(node, find);
      };
      find(sourceFile);
      if (!propertyNode) continue;
      const property = checker.getPropertyOfType(checker.getTypeAtLocation(propertyNode.expression), propertyNode.name.text);
      const refs = (property?.declarations ?? []).map(contractDeclaration).filter((ref): ref is { path: string; name: string } => Boolean(ref));
      if (refs.length) result.set(`${input.path}|${access.line}|${access.column}`, refs);
    }
  }
  semanticCache.set(cacheKey, result);
  return result;
}

const semanticCache = new Map<string, Map<string, { path: string; name: string }[]>>();

function frameworkNodes(frameworks: Framework[]): GraphNode[] {
  return frameworks.map((framework) => ({ id: `framework:${framework}`, kind: "framework", label: framework, framework }));
}

export function buildGraph(inputs: SourceInput[]): GraphSnapshot {
  const modules = inputs.map(parseSource).sort((a, b) => compareStrings(a.path, b.path));
  const semanticRefs = semanticPropertyRefs(inputs);
  for (const module of modules) for (const access of module.propertyAccesses) {
    const refs = semanticRefs.get(`${module.path}|${access.line}|${access.column}`);
    if (refs?.length) access.resolvedContracts = refs;
  }
  const paths = new Set(modules.map((module) => module.path));
  const contracts = contractLookup(modules);
  const aliases = new Map<string, { path: string; name: string }>();
  for (const module of modules) for (const imported of module.imports.filter((candidate) => candidate.kind === "re-export")) {
    const resolved = resolveImport(module.path, imported.source, paths);
    if (!resolved) continue;
    const target = contracts.has(`${resolved}#${imported.imported}`) ? { path: resolved, name: imported.imported } : undefined;
    if (target) aliases.set(`${module.path}#${imported.local}`, target);
  }
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const usages: UsageEvidence[] = [];
  const allFrameworks = new Set<Framework>();

  for (const module of modules) {
    nodes.push({ id: moduleId(module.path), kind: "module", label: module.path, path: module.path });
    for (const framework of module.frameworks) {
      allFrameworks.add(framework);
      addEdge(edges, moduleId(module.path), `framework:${framework}`, "framework", { line: 1, column: 1 });
    }
    for (const contract of module.contracts.filter((candidate) => candidate.exported)) {
      nodes.push({ id: contractId(module.path, contract.name), kind: "contract", label: contract.name, path: module.path });
      addEdge(edges, moduleId(module.path), contractId(module.path, contract.name), "exports", contract);
    }
    for (const imported of module.imports) {
      const resolved = resolveImport(module.path, imported.source, paths);
      if (!resolved) continue;
      addEdge(edges, moduleId(module.path), moduleId(resolved), "imports", imported, imported.local);
      const ref = importedContract(module, imported, resolved, contracts, aliases);
      if (ref) addEdge(edges, moduleId(module.path), contractId(ref.path, ref.name), "uses-type", imported, imported.local);
    }
    for (const access of module.propertyAccesses) {
      for (const ref of refsForProperty(module, access, paths, contracts, aliases)) {
        usages.push({ module: module.path, contractPath: ref.path, contract: ref.name, field: access.property, relation: "typed-property", text: access.text, resolved: ref.resolved, line: access.line, column: access.column });
        addEdge(edges, moduleId(module.path), contractId(ref.path, ref.name), "reads-property", access, access.property, access.text);
      }
    }
    for (const jsx of module.jsxUsages) {
      const imported = module.imports.find((candidate) => candidate.local === jsx.tag || candidate.local === jsx.tag.split(".")[0]);
      if (!imported) continue;
      const resolved = resolveImport(module.path, imported.source, paths);
      if (!resolved) continue;
      addEdge(edges, moduleId(module.path), moduleId(resolved), "renders", jsx, jsx.tag);
      const candidateContracts = modules.find((candidate) => candidate.path === resolved)?.contracts.filter((contract) => contract.exported && (contract.name === `${jsx.tag}Props` || contract.name.endsWith("Props"))) ?? [];
      for (const contract of candidateContracts) {
        for (const field of jsx.props) {
          usages.push({ module: module.path, contractPath: resolved, contract: contract.name, field, relation: "jsx-prop", text: `${jsx.tag} ${field}=...`, resolved: true, line: jsx.line, column: jsx.column });
          addEdge(edges, moduleId(module.path), contractId(resolved, contract.name), "reads-property", jsx, field, `${jsx.tag} ${field}`);
        }
      }
    }
  }

  nodes.push(...frameworkNodes([...allFrameworks].sort()));
  const dedupedEdges = [...new Map(edges.map((edge) => [edge.id, edge])).values()].sort((a, b) => compareStrings(a.id, b.id));
  const dedupedUsages = [...new Map(usages.map((usage) => [`${usage.module}|${usage.contractPath}|${usage.contract}|${usage.field}|${usage.line}|${usage.column}`, usage])).values()].sort((a, b) => compareStrings(`${a.module}|${a.contractPath}|${a.contract}|${a.field}|${a.line}`, `${b.module}|${b.contractPath}|${b.contract}|${b.field}|${b.line}`));
  return {
    modules,
    nodes: nodes.sort((a, b) => compareStrings(a.id, b.id)),
    edges: dedupedEdges,
    usages: dedupedUsages,
  };
}

export function reverseImportReachability(graph: GraphSnapshot, targetPath: string): Map<string, string[]> {
  const imports = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.relation !== "imports") continue;
    const from = edge.from.replace(/^module:/, "");
    const to = edge.to.replace(/^module:/, "");
    imports.set(to, [...(imports.get(to) ?? []), from]);
  }
  const paths = new Map<string, string[]>([[targetPath, [targetPath]]]);
  const queue = [targetPath];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const consumer of uniqueSorted(imports.get(current) ?? [])) {
      if (paths.has(consumer)) continue;
      paths.set(consumer, [consumer, ...(paths.get(current) ?? [current])]);
      queue.push(consumer);
    }
  }
  return paths;
}
