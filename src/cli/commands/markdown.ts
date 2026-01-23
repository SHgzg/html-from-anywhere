/**
 * Markdown Command
 * Converts Markdown to HTML email
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { EmailBuilder } from '../../generators/email-builder';
import { MarkdownProcessor } from '../../processors/markdown';
import chalk from 'chalk';

export async function markdownCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Processing Markdown...'));

    let content: string;

    // Get content from file or string
    if (options.file) {
      if (!existsSync(options.file)) {
        throw new Error(`File not found: ${options.file}`);
      }
      content = await readFile(options.file, 'utf-8');
    } else if (options.content) {
      content = options.content;
    } else {
      throw new Error('Either --file or --content must be provided');
    }

    console.log(chalk.green(`✓ Markdown content loaded`));

    // Process markdown
    console.log(chalk.blue('Converting to HTML...'));
    const markdownProcessor = new MarkdownProcessor();
    const processedData = await markdownProcessor.process(content);

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject(options.subject || 'Markdown Email')
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
