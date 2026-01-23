#!/usr/bin/env node

/**
 * CLI Main Entry Point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { registerCommands } from './commands';

const program = new Command();

// Configure CLI
program
  .name('html-from-anywhere')
  .description('Fetch data from various sources and generate email-compatible HTML files')
  .version('1.0.0');

// Register all commands
registerCommands(program);

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
