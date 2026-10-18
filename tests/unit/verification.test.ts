import { describe, expect, it } from "vitest";
import { runApprovedCommand } from "../../src/verification.js";

describe("bounded verification", () => {
  it("captures a successful explicitly approved command without a shell", async () => {
    const result = await runApprovedCommand(process.cwd(), [process.execPath, "-e", "process.stdout.write('verified')"], 1_000, 1_000);
    expect(result.status).toBe("passed");
    expect(result.exitCode).toBe(0);
    expect(result.output).toBe("verified");
  });

  it("redacts secret-shaped output", async () => {
    const result = await runApprovedCommand(process.cwd(), [process.execPath, "-e", "process.stdout.write('token=secret-value')"], 1_000, 1_000);
    expect(result.output).toContain("token=[REDACTED]");
    expect(result.output).not.toContain("secret-value");
  });

  it("redacts JSON-shaped secret output", async () => {
    const result = await runApprovedCommand(process.cwd(), [process.execPath, "-e", "process.stdout.write(JSON.stringify({token:'json-secret'}))"], 1_000, 1_000);
    expect(result.output).toContain('"token":"[REDACTED]"');
    expect(result.output).not.toContain("json-secret");
  });

  it("marks a command that exceeds its budget inconclusive", async () => {
    const result = await runApprovedCommand(process.cwd(), [process.execPath, "-e", "setTimeout(() => {}, 1000)"], 50, 1_000);
    expect(result.status).toBe("inconclusive");
    expect(result.reason).toContain("timeout");
  });
});
