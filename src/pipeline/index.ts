/**
 * Data Pipeline main class
 * Manages data fetchers and executes aggregation pipelines
 */

import {
  FetcherConfig,
  AggregateConfig,
  PipelineResult,
  PipelineContext,
} from './types';
import { Fetcher } from './fetcher';
import { DataAggregator } from './aggregator';

export class DataPipeline {
  private fetchers: Map<string, Fetcher> = new Map();

  /**
   * Register a fetcher
   */
  registerFetcher(config: FetcherConfig): void {
    // Fetcher instance will be created by specific fetcher factories
    // This is a placeholder for registration logic
  }

  /**
   * Register a fetcher instance
   */
  registerFetcherInstance(fetcher: Fetcher): void {
    this.fetchers.set(fetcher.getId(), fetcher);
  }

  /**
   * Get a registered fetcher
   */
  getFetcher(id: string): Fetcher | undefined {
    return this.fetchers.get(id);
  }

  /**
   * Execute a single fetcher
   */
  async executeFetcher(id: string): Promise<PipelineResult> {
    const fetcher = this.fetchers.get(id);
    if (!fetcher) {
      throw new Error(`Fetcher not found: ${id}`);
    }

    return await fetcher.execute();
  }

  /**
   * Execute an aggregation pipeline
   */
  async executeAggregate(config: AggregateConfig): Promise<PipelineResult> {
    const startTime = Date.now();
    const errors: Error[] = [];
    const results: PipelineResult[] = [];

    // Execute fetchers
    if (config.parallel) {
      // Parallel execution
      const maxParallel = config.maxParallel || 5;
      const fetcherIds = config.fetchers;

      for (let i = 0; i < fetcherIds.length; i += maxParallel) {
        const batch = fetcherIds.slice(i, i + maxParallel);
        const batchResults = await Promise.allSettled(
          batch.map((id) => this.executeFetcher(id))
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            if (result.value.errors.length > 0) {
              errors.push(...result.value.errors);
            }
          } else {
            errors.push(result.reason);
          }
        }
      }
    } else {
      // Sequential execution
      for (const id of config.fetchers) {
        try {
          const result = await this.executeFetcher(id);
          results.push(result);
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    // Aggregate results
    let data: any;
    try {
      const aggregator = new DataAggregator();
      data = await aggregator.aggregate(results, config.strategy);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
      data = null;
    }

    // Apply post-processing
    if (config.postProcess && data != null) {
      try {
        data = await this.applyPostProcess(data, config.postProcess);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Handle error strategy
    if (!config.postProcess?.error) {
      // Default: throw if there are errors
      if (errors.length > 0 && data == null) {
        throw errors[0];
      }
    }

    const metadata = {
      fetcherId: 'aggregate',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      success: errors.length === 0,
    };

    return {
      success: errors.length === 0,
      data,
      errors,
      metadata,
    };
  }

  /**
   * Apply post-processing to aggregated data
   */
  private async applyPostProcess(
    data: any,
    postProcess: any
  ): Promise<any> {
    const { Filter, Formatter } = await import('./index');

    // Apply filter
    if (postProcess.filter) {
      const filter = new Filter(postProcess.filter);
      data = await filter.apply(data);
    }

    // Apply formatter
    if (postProcess.formatter) {
      const formatter = new Formatter(postProcess.formatter);
      data = await formatter.format(data);
    }

    // Apply sort
    if (postProcess.sort) {
      data = this.sortData(data, postProcess.sort);
    }

    // Apply limit
    if (postProcess.limit != null && Array.isArray(data)) {
      const offset = postProcess.offset || 0;
      data = data.slice(offset, offset + postProcess.limit);
    }

    return data;
  }

  /**
   * Sort data array
   */
  private sortData(data: any[], sortConfig: any): any[] {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.sort((a, b) => {
      const aVal = this.getNestedValue(a, sortConfig.field);
      const bVal = this.getNestedValue(b, sortConfig.field);

      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value == null) return null;
      value = value[key];
    }

    return value;
  }
}

// Re-export classes for convenience
export { Fetcher } from './fetcher';
export { Formatter } from './formatter';
export { Filter } from './filter';
export { DataAggregator } from './aggregator';
