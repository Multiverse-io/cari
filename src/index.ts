#!/usr/bin/env node

/**
 * AI Rules Installer CLI
 */

import { Command } from "commander";
import { init } from "./commands/init.js";
import { update } from "./commands/update.js";

const program = new Command();

program
  .name("cari")
  .description("AI Rules Installer - A CLI tool for installing AI rules")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize AI Rules Installer in the current directory")
  .action(async () => {
    await init();
  });

program
  .command("update")
  .description("Update AI rules in the current directory")
  .action(async () => {
    await update();
  });

program.parse();
