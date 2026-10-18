import * as ts from "typescript";
import { compareStrings, normalizeRepoPath, uniqueSorted } from "./utils.js";
import type { Contract, ContractField, Framework, ImportRecord, JsxUsage, ParsedModule, PropertyAccess, SourcePosition } from "./types.js";

export interface SourceInput {
  path: string;
  source: string;
}

function position(sourceFile: ts.SourceFile, node: ts.Node): SourcePosition {
  const start = node.getStart(sourceFile);
  const result = sourceFile.getLineAndCharacterOfPosition(start);
  return { line: result.line + 1, column: result.character + 1 };
}

function scriptKind(filePath: string): ts.ScriptKind {
  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (filePath.endsWith(".js")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function typeText(type: ts.TypeNode | undefined, sourceFile: ts.SourceFile): string {
  return type ? type.getText(sourceFile).replace(/\s+/g, " ").trim() : "unknown";
}

function isExported(node: ts.Node): boolean {
  return !!(ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function fieldsFromMembers(members: ts.NodeArray<ts.TypeElement>, sourceFile: ts.SourceFile): ContractField[] {
  const fields: ContractField[] = [];
  for (const member of members) {
    if (!ts.isPropertySignature(member) || !member.name || !ts.isIdentifier(member.name)) continue;
    const pos = position(sourceFile, member);
    fields.push({
      name: member.name.text,
      type: typeText(member.type, sourceFile),
      optional: !!member.questionToken,
      readonly: !!member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword),
      ...pos,
    });
  }
  return fields.sort((a, b) => compareStrings(a.name, b.name));
}

function typeNames(type: ts.TypeNode | undefined, sourceFile: ts.SourceFile): string[] {
  if (!type) return [];
  const names: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isTypeReferenceNode(node)) names.push(qualifiedName(node.typeName));
    ts.forEachChild(node, visit);
  };
  visit(type);
  return uniqueSorted(names);
}

function qualifiedName(node: ts.EntityName | ts.Expression): string {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isQualifiedName(node)) return `${qualifiedName(node.left)}.${node.right.text}`;
  if (ts.isPropertyAccessExpression(node)) return `${qualifiedName(node.expression)}.${node.name.text}`;
  return node.getText();
}

export function parseSource(input: SourceInput): ParsedModule {
  const filePath = normalizeRepoPath(input.path);
  const sourceFile = ts.createSourceFile(filePath, input.source, ts.ScriptTarget.Latest, true, scriptKind(filePath));
  const imports: ImportRecord[] = [];
  const contracts: Contract[] = [];
  const propertyAccesses: PropertyAccess[] = [];
  const jsxUsages: JsxUsage[] = [];
  const frameworks = new Set<Framework>();
  const variableTypes = new Map<string, string[]>();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const source = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      const pos = position(sourceFile, statement);
      if (!clause) {
        imports.push({ source, imported: "*", local: "*", kind: "side-effect", typeOnly: false, ...pos });
      } else {
        if (clause.name) imports.push({ source, imported: "default", local: clause.name.text, kind: "default", typeOnly: clause.isTypeOnly, ...pos });
        if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          imports.push({ source, imported: "*", local: clause.namedBindings.name.text, kind: "namespace", typeOnly: clause.isTypeOnly, ...pos });
        }
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const element of clause.namedBindings.elements) {
            imports.push({ source, imported: element.propertyName?.text ?? element.name.text, local: element.name.text, kind: "named", typeOnly: clause.isTypeOnly || element.isTypeOnly, ...position(sourceFile, element) });
          }
        }
      }
      if (source === "react" || source === "react-dom" || source.startsWith("react/")) frameworks.add("react");
      if (source === "express" || source.startsWith("express/")) frameworks.add("express");
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const pos = position(sourceFile, statement);
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          imports.push({ source: statement.moduleSpecifier.text, imported: element.propertyName?.text ?? element.name.text, local: element.name.text, kind: "re-export", typeOnly: !!statement.isTypeOnly, ...position(sourceFile, element) });
        }
      }
    }
  }

  const visitType = (node: ts.Node): void => {
    if (ts.isInterfaceDeclaration(node)) {
      const pos = position(sourceFile, node);
      contracts.push({ name: node.name.text, kind: "interface", exported: isExported(node), fields: fieldsFromMembers(node.members, sourceFile), ...pos });
    } else if (ts.isTypeAliasDeclaration(node)) {
      const pos = position(sourceFile, node);
      const fields = ts.isTypeLiteralNode(node.type) ? fieldsFromMembers(node.type.members, sourceFile) : [];
      if (fields.length > 0) contracts.push({ name: node.name.text, kind: "type", exported: isExported(node), fields, ...pos });
    }
    ts.forEachChild(node, visitType);
  };
  visitType(sourceFile);

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name) && node.type) {
      variableTypes.set(node.name.text, typeNames(node.type, sourceFile));
    }
    if (ts.isParameter(node) && ts.isIdentifier(node.name) && node.type) {
      variableTypes.set(node.name.text, typeNames(node.type, sourceFile));
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
      const pos = position(sourceFile, node);
      const receiver = node.expression.getText(sourceFile);
      const receiverName = ts.isIdentifier(node.expression) ? node.expression.text : receiver.split(".").at(-1) ?? receiver;
      propertyAccesses.push({
        receiver,
        property: node.name.text,
        text: node.getText(sourceFile),
        contractNames: variableTypes.get(receiverName) ?? [],
        ...pos,
      });
      if ((node.name.text === "get" || node.name.text === "post" || node.name.text === "put" || node.name.text === "patch" || node.name.text === "delete" || node.name.text === "use") && ts.isIdentifier(node.expression)) frameworks.add("express");
    }
    if (ts.isJsxElement(node)) {
      frameworks.add("react");
      const opening = node.openingElement;
      jsxUsages.push({ tag: opening.tagName.getText(sourceFile), props: opening.attributes.properties.filter(ts.isJsxAttribute).map((attribute) => attribute.name.getText(sourceFile)).sort(), ...position(sourceFile, opening) });
    } else if (ts.isJsxSelfClosingElement(node)) {
      frameworks.add("react");
      jsxUsages.push({ tag: node.tagName.getText(sourceFile), props: node.attributes.properties.filter(ts.isJsxAttribute).map((attribute) => attribute.name.getText(sourceFile)).sort(), ...position(sourceFile, node) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const diagnostics = (sourceFile as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
  const parseErrors = diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
  return {
    path: filePath,
    source: input.source,
    imports: imports.sort((a, b) => compareStrings(a.source, b.source) || compareStrings(a.local, b.local) || a.line - b.line),
    contracts: contracts.sort((a, b) => compareStrings(a.name, b.name)),
    propertyAccesses: propertyAccesses.sort((a, b) => a.line - b.line || a.column - b.column || compareStrings(a.property, b.property)),
    jsxUsages: jsxUsages.sort((a, b) => a.line - b.line || a.column - b.column || compareStrings(a.tag, b.tag)),
    frameworks: [...frameworks].sort(),
    parseErrors: parseErrors.sort(),
  };
}
