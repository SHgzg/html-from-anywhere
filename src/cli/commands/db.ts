/**
 * Database Command
 * Fetches data from database and generates HTML email
 */

import { EmailBuilder } from '../../generators/email-builder';
import { TableProcessor } from '../../processors/table';
import chalk from 'chalk';

export async function dbCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Connecting to database...'));

    // Import database fetcher dynamically
    const { DatabaseFetcher } = await import('../../pipeline/database');

    // Create fetcher config
    const fetcherConfig = {
      id: 'db',
      source: {
        type: 'database' as const,
        connection: options.connection,
        query: options.query,
        params: options.params ? JSON.parse(options.params) : [],
      },
      process: {
        formatter: { type: 'json' as const },
        error: { strategy: 'throw' as const },
      },
    };

    // Create fetcher and execute
    const fetcher = new DatabaseFetcher(fetcherConfig);
    const result = await fetcher.execute();

    if (!result.success) {
      throw new Error('Failed to fetch data from database');
    }

    console.log(chalk.green(`✓ Data fetched successfully`));

    // Process data
    console.log(chalk.blue('Processing data...'));
    const tableProcessor = new TableProcessor();
    const processedData = tableProcessor.process(result.data);

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject(options.subject || 'Database Query Results')
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
