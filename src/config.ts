import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { LoomConfig } from "./types.js";
import { normalizeRepoPath, pathIsInside } from "./utils.js";

export const DEFAULT_CONFIG_FILE = "loom.config.json";

const configSchema = z.object({
  base: z.string().min(1).optional(),
  extensions: z.array(z.string().regex(/^\.[a-z0-9]+$/i)).min(1).optional(),
  exclude: z.array(z.string().min(1)).optional(),
  maxFiles: z.number().int().positive().max(100_000).optional(),
  maxFileBytes: z.number().int().positive().max(10_000_000).optional(),
}).strict();

export class ConfigError extends Error {
  public readonly code = "CONFIG_ERROR";
}

export function defaultConfig(): LoomConfig {
  return {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    exclude: ["node_modules", "dist", "build", "coverage", ".git"],
    maxFiles: 10_000,
    maxFileBytes: 1_000_000,
  };
}

function configPath(root: string, requested?: string): string {
  const relative = requested ?? DEFAULT_CONFIG_FILE;
  if (path.isAbsolute(relative)) throw new ConfigError("Config path must be repository-relative");
  const resolved = path.resolve(root, relative);
  if (!pathIsInside(root, resolved)) throw new ConfigError("Config path must stay inside the repository");
  return resolved;
}

export function loadConfig(root: string, requested?: string): LoomConfig {
  const defaults = defaultConfig();
  const filePath = configPath(root, requested);
  if (!fs.existsSync(filePath)) return defaults;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new ConfigError(`Could not parse ${normalizeRepoPath(path.relative(root, filePath))}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const result = configSchema.safeParse(parsed);
  if (!result.success) throw new ConfigError(`Invalid ${normalizeRepoPath(path.relative(root, filePath))}: ${result.error.issues.map((issue) => `${issue.path.join(".") || "config"} ${issue.message}`).join("; ")}`);
  return {
    extensions: result.data.extensions ?? defaults.extensions,
    exclude: result.data.exclude ?? defaults.exclude,
    maxFiles: result.data.maxFiles ?? defaults.maxFiles,
    maxFileBytes: result.data.maxFileBytes ?? defaults.maxFileBytes,
    ...(result.data.base ? { base: result.data.base } : {}),
  };
}

export function initConfig(root: string, force = false): string {
  const filePath = configPath(root);
  if (fs.existsSync(filePath) && !force) throw new ConfigError(`${DEFAULT_CONFIG_FILE} already exists; use --force to replace it`);
  const sample = `${JSON.stringify({
    base: "HEAD",
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    exclude: ["node_modules", "dist", "build", "coverage", ".git"],
    maxFiles: 10000,
    maxFileBytes: 1000000,
  }, null, 2)}\n`;
  fs.writeFileSync(filePath, sample, { encoding: "utf8", flag: "w" });
  return DEFAULT_CONFIG_FILE;
}
