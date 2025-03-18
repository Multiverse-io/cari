#!/usr/bin/env node

/**
 * AI Rules Installer CLI
 */

import { Command } from "commander";
import { init } from "./commands/init.js";
import { update } from "./commands/update.js";

// Create a new Commander program
const program = new Command();

// Configure the CLI
program
  .name("ari")
  .description("AI Rules Installer - A CLI tool for installing AI rules")
  .version("1.0.0");

// Add init command
program
  .command("init")
  .description("Initialize AI Rules Installer in the current directory")
  .action(async () => {
    await init();
  });

// Add update command
program
  .command("update")
  .description("Update AI rules in the current directory")
  .action(async () => {
    await update();
  });

// Parse command line arguments
program.parse();
