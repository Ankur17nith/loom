import { spawn } from "node:child_process";
import { stableId } from "./utils.js";
import type { LoomConfig } from "./types.js";

export type VerificationStatus = "passed" | "failed" | "inconclusive";

export interface VerificationResult {
  id: string;
  command: string[];
  status: VerificationStatus;
  exitCode?: number;
  durationMs: number;
  output: string;
  reason?: string;
}

function redact(value: string): string {
  return value
    .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s]+/gi, "$1[REDACTED]")
    .replace(/(["'](?:token|secret|password|api[_-]?key|access[_-]?key|private[_-]?key)["']\s*[:=]\s*["'])([^"']+)(["'])/gi, "$1[REDACTED]$3")
    .replace(/((?:token|secret|password|api[_-]?key|access[_-]?key|private[_-]?key)\s*[:=]\s*)[^\s]+/gi, "$1[REDACTED]");
}

export function runApprovedCommand(root: string, command: string[], timeoutMs: number, maxOutputBytes: number): Promise<VerificationResult> {
  const started = Date.now();
  const id = stableId("check", command.join("\0"));
  return new Promise((resolve) => {
    const executable = command[0];
    const args = command.slice(1);
    if (!executable) {
      resolve({ id, command, status: "inconclusive", durationMs: Date.now() - started, output: "", reason: "The configured command is empty." });
      return;
    }
    const child = spawn(executable, args, {
      cwd: root,
      shell: false,
      env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let truncated = false;
    const append = (chunk: Buffer | string) => {
      if (output.length >= maxOutputBytes) { truncated = true; return; }
      output += chunk.toString().slice(0, maxOutputBytes - output.length);
      if (output.length >= maxOutputBytes) truncated = true;
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGTERM"); }, timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timer);
      resolve({ id, command, status: "inconclusive", durationMs: Date.now() - started, output: redact(output), reason: error.message });
    });
    child.once("close", (exitCode) => {
      clearTimeout(timer);
      const result: VerificationResult = {
        id,
        command,
        status: timedOut || truncated ? "inconclusive" : exitCode === 0 ? "passed" : "failed",
        durationMs: Date.now() - started,
        output: redact(output),
        ...(exitCode === null ? {} : { exitCode }),
        ...(timedOut ? { reason: `Command exceeded the ${timeoutMs}ms timeout.` } : {}),
        ...(truncated ? { reason: `Command output exceeded the ${maxOutputBytes}-byte limit.` } : {}),
      };
      resolve(result);
    });
  });
}

export async function runApprovedChecks(root: string, config: LoomConfig): Promise<VerificationResult[]> {
  return Promise.all(config.verification.commands.map((command) => runApprovedCommand(root, command, config.verification.timeoutMs, config.verification.maxOutputBytes)));
}
