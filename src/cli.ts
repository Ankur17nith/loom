#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

const program = new Command();

program
  .name("loom")
  .description("See what your changes touch.")
  .version(packageJson.version);

program
  .command("doctor")
  .description("Check the local Loom prerequisites")
  .action(() => {
    console.log(`Loom ${packageJson.version}`);
    console.log("Core CLI is installed. Full repository checks are added by the analysis engine.");
  });

program.parse();
