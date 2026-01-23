/**
 * Pipeline Command
 * Executes data pipeline with multiple fetchers
 */

import { EmailBuilder } from '../../generators/email-builder';
import { TableProcessor } from '../../processors/table';
import { DataPipeline } from '../../pipeline';
import { HttpFetcher } from '../../pipeline/http';
import { FileFetcher } from '../../pipeline/file';
import { DatabaseFetcher } from '../../pipeline/database';
import { StringFetcher } from '../../pipeline/string';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

export async function pipelineCommand(options: any): Promise<void> {
  try {
    console.log(chalk.blue('Loading pipeline configuration...'));

    // Load pipeline configuration
    const configPath = options.config;
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    let pipelineConfig: any;

    // Check if file is JSON or TS
    if (configPath.endsWith('.json')) {
      // Load JSON configuration
      const content = await readFile(configPath, 'utf-8');
      pipelineConfig = JSON.parse(content);
    } else {
      // Load TypeScript configuration
      const configModule = await import(configPath);
      pipelineConfig = configModule.default || configModule;
    }

    console.log(chalk.green(`✓ Configuration loaded`));

    // Create pipeline
    console.log(chalk.blue('Initializing pipeline...'));
    const pipeline = new DataPipeline();

    // Register fetchers
    const fetchers = pipelineConfig.fetchers || [];
    for (const fetcherConfig of fetchers) {
      const fetcher = createFetcher(fetcherConfig);
      pipeline.registerFetcherInstance(fetcher);
    }

    console.log(chalk.green(`✓ Registered ${fetchers.length} fetcher(s)`));

    // Determine which fetchers to execute
    let fetcherIds: string[];
    if (options.fetcher) {
      fetcherIds = options.fetcher.split(',').map((id: string) => id.trim());
    } else {
      fetcherIds = fetchers.map((f: any) => f.id);
    }

    // Execute pipeline
    console.log(chalk.blue('Executing pipeline...'));
    const aggregateConfig = {
      fetchers: fetcherIds,
      strategy: (pipelineConfig.aggregate?.strategy || 'concat') as any,
      postProcess: pipelineConfig.aggregate?.postProcess,
      parallel: pipelineConfig.aggregate?.parallel ?? false,
      maxParallel: pipelineConfig.aggregate?.maxParallel,
    };

    const result = await pipeline.executeAggregate(aggregateConfig);

    if (!result.success) {
      throw new Error('Pipeline execution failed');
    }

    console.log(chalk.green(`✓ Pipeline executed successfully`));

    // Process data
    console.log(chalk.blue('Processing data...'));
    const tableProcessor = new TableProcessor();
    const processedData = tableProcessor.process(result.data);

    // Build email
    console.log(chalk.blue('Building email...'));
    const builder = new EmailBuilder();
    builder
      .setSubject(options.subject || 'Pipeline Data')
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
 * Create fetcher instance from config
 */
function createFetcher(config: any): any {
  switch (config.source.type) {
    case 'http':
      return new HttpFetcher(config);
    case 'file':
      return new FileFetcher(config);
    case 'database':
      return new DatabaseFetcher(config);
    case 'string':
      return new StringFetcher(config);
    default:
      throw new Error(`Unknown fetcher type: ${config.source.type}`);
  }
}
