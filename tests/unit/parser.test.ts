import { describe, expect, it } from "vitest";
import { parseSource } from "../../src/parser.js";

describe("TypeScript compiler parser", () => {
  it("captures contracts, imports, property accesses, JSX, and honest framework signals", () => {
    const module = parseSource({
      path: "src/view.tsx",
      source: [
        'import React from "react";',
        'import type { User } from "./api";',
        'import Card from "./Card";',
        "export interface Props { title?: string; }",
        "export function View(user: User) {",
        "  return <Card title={user.name} />;",
        "}",
      ].join("\n"),
    });
    expect(module.contracts[0]).toMatchObject({ name: "Props", exported: true });
    expect(module.contracts[0]?.fields[0]).toMatchObject({ name: "title", optional: true, type: "string" });
    expect(module.imports.map((item) => item.local)).toEqual(["User", "Card", "React"]);
    expect(module.propertyAccesses.some((item) => item.property === "name" && item.contractNames.includes("User"))).toBe(true);
    expect(module.jsxUsages).toEqual([{ tag: "Card", props: ["title"], line: 6, column: 10 }]);
    expect(module.frameworks).toEqual(["react"]);
  });

  it("detects Express route signals without claiming route semantics", () => {
    const module = parseSource({ path: "src/server.ts", source: 'import express from "express"; const app = express(); app.get("/users", handler);' });
    expect(module.frameworks).toEqual(["express"]);
  });
});
