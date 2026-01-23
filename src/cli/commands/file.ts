/**
 * File Command
 * Fetches data from local file and generates HTML email
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { EmailBuilder } from '../../generators/email-builder';
import { TableProcessor } from '../../processors/table';
import { ImageProcessor } from '../../processors/image';
import { TextProcessor } from '../../processors/text';
import { MarkdownProcessor } from '../../processors/markdown';
import chalk from 'chalk';

export async function fileCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Reading file...'));

    // Check if file exists
    if (!existsSync(options.path)) {
      throw new Error(`File not found: ${options.path}`);
    }

    // Read file
    const content = await readFile(options.path, 'utf-8');
    console.log(chalk.green(`✓ File read successfully`));

    // Parse data
    let data: any;
    if (options.path.endsWith('.json')) {
      data = JSON.parse(content);
    } else if (options.path.endsWith('.md')) {
      data = content;
    } else {
      data = content;
    }

    // Process data based on format
    console.log(chalk.blue('Processing data...'));
    const processedData = await processData(data, options.format, options.path);

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject(options.subject || `Data from ${options.path}`)
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
async function processData(data: any, format: string, filePath: string): Promise<any> {
  switch (format) {
    case 'table':
      const tableProcessor = new TableProcessor();
      return tableProcessor.process(data);
    case 'image':
      const imageProcessor = new ImageProcessor({ format: 'base64' });
      return await imageProcessor.process(filePath);
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
