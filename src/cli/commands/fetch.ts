/**
 * Fetch Command
 * Fetches data from HTTP/HTTPS URL and generates HTML email
 */

import axios from 'axios';
import { EmailBuilder } from '../../generators/email-builder';
import { TableProcessor } from '../../processors/table';
import { ImageProcessor } from '../../processors/image';
import { TextProcessor } from '../../processors/text';
import { MarkdownProcessor } from '../../processors/markdown';
import chalk from 'chalk';

export async function fetchCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Fetching data from URL...'));

    // Fetch data from URL
    const response = await axios.get(options.url, {
      headers: parseHeaders(options.header),
      method: options.method,
    });

    const data = response.data;
    console.log(chalk.green(`✓ Fetched data successfully`));

    // Process data based on format
    console.log(chalk.blue('Processing data...'));
    const processedData = await processData(data, options.format);

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject(options.subject || 'Data from ' + options.url)
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
 * Parse headers from key:value format
 */
function parseHeaders(headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const header of headers) {
    const [key, value] = header.split(':');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  }
  return result;
}

/**
 * Process data based on format
 */
async function processData(data: any, format: string): Promise<any> {
  switch (format) {
    case 'table':
      const tableProcessor = new TableProcessor();
      return tableProcessor.process(data);
    case 'image':
      const imageProcessor = new ImageProcessor({ format: 'base64' });
      return await imageProcessor.process(data);
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
