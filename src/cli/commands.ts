/**
 * CLI Commands
 * Defines and registers all CLI commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { fetchCommand } from './commands/fetch';
import { fileCommand } from './commands/file';
import { dbCommand } from './commands/db';
import { stringCommand } from './commands/string';
import { pipelineCommand } from './commands/pipeline';
import { imageCommand } from './commands/image';
import { textCommand } from './commands/text';
import { markdownCommand } from './commands/markdown';

/**
 * Register all commands
 */
export function registerCommands(program: Command): void {
  // Fetch command
  program.command('fetch')
    .description('Fetch data from HTTP/HTTPS URL')
    .requiredOption('-u, --url <url>', 'URL to fetch data from')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-f, --format <type>', 'Output format (table, image, text, markdown)', 'table')
    .option('-s, --subject <subject>', 'Email subject')
    .option('-t, --template <name>', 'Email template name', 'default')
    .option('-m, --method <method>', 'HTTP method', 'GET')
    .option('-H, --header <header>', 'HTTP headers (key:value)', collect, [])
    .action(fetchCommand);

  // File command
  program.command('file')
    .description('Fetch data from local file')
    .requiredOption('-p, --path <path>', 'Path to file')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-f, --format <type>', 'Output format (table, image, text, markdown)', 'table')
    .option('-s, --subject <subject>', 'Email subject')
    .option('-t, --template <name>', 'Email template name', 'default')
    .action(fileCommand);

  // Database command
  program.command('db')
    .description('Fetch data from database')
    .requiredOption('-c, --connection <connection>', 'Database connection string')
    .requiredOption('-q, --query <query>', 'SQL query')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-f, --format <type>', 'Output format (table, image, text, markdown)', 'table')
    .option('-s, --subject <subject>', 'Email subject')
    .option('-t, --template <name>', 'Email template name', 'default')
    .option('-p, --params <params>', 'Query parameters (JSON array)')
    .action(dbCommand);

  // String command
  program.command('string')
    .description('Process data from string input')
    .requiredOption('-d, --data <data>', 'String data (JSON, CSV, etc.)')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-f, --format <type>', 'Output format (table, image, text, markdown)', 'table')
    .option('-s, --subject <subject>', 'Email subject')
    .option('-t, --template <name>', 'Email template name', 'default')
    .action(stringCommand);

  // Pipeline command
  program.command('pipeline')
    .description('Execute data pipeline with multiple fetchers')
    .requiredOption('-c, --config <path>', 'Pipeline configuration file path')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-s, --subject <subject>', 'Email subject')
    .option('-t, --template <name>', 'Email template name', 'default')
    .option('-f, --fetcher <ids>', 'Comma-separated list of fetcher IDs to execute')
    .action(pipelineCommand);

  // Image command
  program.command('image')
    .description('Process and embed images')
    .requiredOption('-u, --url <url>', 'Image URL or file path')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-f, --format <type>', 'Embed format (base64, cid, url)', 'base64')
    .option('-W, --width <number>', 'Image width')
    .option('-H, --height <number>', 'Image height')
    .option('-q, --quality <number>', 'Image quality (1-100)')
    .action(imageCommand);

  // Text command
  program.command('text')
    .description('Process text content with styling')
    .requiredOption('-c, --content <content>', 'Text content')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-s, --subject <subject>', 'Email subject')
    .option('-a, --align <align>', 'Text alignment (left, center, right, justify)')
    .option('--color <color>', 'Text color (hex)')
    .option('--font-size <size>', 'Font size in pixels')
    .option('--font-weight <weight>', 'Font weight (normal, bold)')
    .action(textCommand);

  // Markdown command
  program.command('markdown')
    .description('Convert Markdown to HTML email')
    .option('-f, --file <path>', 'Markdown file path')
    .option('-c, --content <content>', 'Markdown content string')
    .option('-o, --output <path>', 'Output file path', 'output.html')
    .option('-s, --subject <subject>', 'Email subject')
    .option('-t, --template <name>', 'Email template name', 'default')
    .action(markdownCommand);
}

/**
 * Helper function to collect multiple values
 */
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
