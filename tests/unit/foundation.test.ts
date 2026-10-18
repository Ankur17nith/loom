import { describe, expect, it } from "vitest";
import { LOOM_VERSION } from "../../src/index.js";

describe("Loom foundation", () => {
  it("exposes a semantic application version", () => {
    expect(LOOM_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
