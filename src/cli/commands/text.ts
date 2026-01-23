/**
 * Text Command
 * Processes text content with styling
 */

import { EmailBuilder } from '../../generators/email-builder';
import { TextProcessor } from '../../processors/text';
import chalk from 'chalk';

export async function textCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Processing text...'));

    // Process text
    const textProcessor = new TextProcessor({
      align: options.align,
      color: options.color,
      fontSize: options.fontSize ? parseInt(options.fontSize) : undefined,
      fontWeight: options.fontWeight,
    });

    const processedData = textProcessor.process(options.content);

    console.log(chalk.green(`✓ Text processed successfully`));

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject(options.subject || 'Text Email')
      .addData(processedData);

    // Save to file
    await builder.save(options.output);
    console.log(chalk.green(`✓ Email saved to ${options.output}`));
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
