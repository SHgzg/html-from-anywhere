/**
 * String Command
 * Processes data from string input and generates HTML email
 */

import { EmailBuilder } from '../../generators/email-builder';
import { TableProcessor } from '../../processors/table';
import { TextProcessor } from '../../processors/text';
import { MarkdownProcessor } from '../../processors/markdown';
import chalk from 'chalk';

export async function stringCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Processing string data...'));

    // Parse data
    let data: any;
    try {
      data = JSON.parse(options.data);
    } catch {
      data = options.data;
    }

    console.log(chalk.green(`✓ Data parsed successfully`));

    // Process data based on format
    console.log(chalk.blue('Processing data...'));
    const processedData = await processData(data, options.format);

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject(options.subject || 'String Data')
      .setTemplate(options.template)
      .addData(processedData);

    // Save to file
    await builder.save(options.output);
    console.log(chalk.green(`✓ Email saved to ${options.output}`));
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Process data based on format
 */
async function processData(data: any, format: string): Promise<any> {
  switch (format) {
    case 'table':
      const tableProcessor = new TableProcessor();
      return tableProcessor.process(data);
    case 'text':
      const textProcessor = new TextProcessor();
      return textProcessor.process(data);
    case 'markdown':
      const markdownProcessor = new MarkdownProcessor();
      return await markdownProcessor.process(data);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
