/**
 * Data Aggregator class
 * Aggregates results from multiple fetchers
 */

import { PipelineResult } from './types';

export class DataAggregator {
  /**
   * Aggregate results using specified strategy
   */
  async aggregate(
    results: PipelineResult[],
    strategy: 'merge' | 'concat' | 'custom'
  ): Promise<any> {
    switch (strategy) {
      case 'merge':
        return this.merge(results);
      case 'concat':
        return this.concat(results);
      case 'custom':
        // Custom aggregation would use a custom function
        return this.concat(results);
      default:
        throw new Error(`Unknown aggregation strategy: ${strategy}`);
    }
  }

  /**
   * Merge results into a single object
   */
  private merge(results: PipelineResult[]): any {
    const merged: any = {};

    for (const result of results) {
      if (result.success && result.data != null) {
        if (typeof result.data === 'object' && !Array.isArray(result.data)) {
          // Merge objects
          Object.assign(merged, result.data);
        } else {
          // For arrays or primitives, add by fetcher ID
          merged[result.metadata.fetcherId] = result.data;
        }
      }
    }

    return merged;
  }

  /**
   * Concatenate results into an array
   */
  private concat(results: PipelineResult[]): any[] {
    const concatenated: any[] = [];

    for (const result of results) {
      if (result.success && result.data != null) {
        if (Array.isArray(result.data)) {
          concatenated.push(...result.data);
        } else {
          concatenated.push(result.data);
        }
      }
    }

    return concatenated;
  }

  /**
   * Custom aggregation using a function
   */
  private custom(results: PipelineResult[], fn: (results: PipelineResult[]) => any): any {
    return fn(results);
  }
}
