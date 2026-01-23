/**
 * Image Command
 * Processes and embeds images in HTML email
 */

import { EmailBuilder } from '../../generators/email-builder';
import { ImageProcessor } from '../../processors/image';
import { ImageOptions } from '../../types';
import chalk from 'chalk';

export async function imageCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Processing image...'));

    // Process image
    const imageOptions: ImageOptions = {
      format: options.format,
      width: options.width ? parseInt(options.width) : undefined,
      height: options.height ? parseInt(options.height) : undefined,
    };

    const imageProcessor = new ImageProcessor(imageOptions);
    const processedData = await imageProcessor.process(options.url);

    console.log(chalk.green(`✓ Image processed successfully`));

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject('Image Email')
      .addData(processedData);

    // Save to file
    await builder.save(options.output);
    console.log(chalk.green(`✓ Email saved to ${options.output}`));
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
