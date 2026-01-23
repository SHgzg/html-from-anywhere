/**
 * Base fetcher class
 * All data fetchers should extend this class
 */

import {
  FetcherConfig,
  PipelineResult,
  PipelineResultMetadata,
  SourceConfig,
  ProcessConfig,
  RetryConfig,
  ErrorConfig,
} from './types';
import { Formatter } from './formatter';
import { Filter } from './filter';

export abstract class Fetcher {
  protected config: FetcherConfig;

  constructor(config: FetcherConfig) {
    this.config = config;
  }

  /**
   * Fetch raw data from the source
   * Must be implemented by subclasses
   */
  protected abstract fetchRawData(): Promise<any>;

  /**
   * Execute the fetcher with full pipeline processing
   */
  async execute(): Promise<PipelineResult> {
    const startTime = Date.now();
    const errors: Error[] = [];
    let data: any;

    try {
      // Fetch raw data with retry logic
      data = await this.fetchWithRetry();

      // Apply formatter
      if (this.config.process.formatter) {
        const formatter = new Formatter(this.config.process.formatter);
        data = await formatter.format(data);
      }

      // Apply filter
      if (this.config.process.filter) {
        const filter = new Filter(this.config.process.filter);
        data = await filter.apply(data);
      }

      const metadata: PipelineResultMetadata = {
        fetcherId: this.config.id,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        success: true,
      };

      return {
        success: true,
        data,
        errors,
        metadata,
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      errors.push(errorObj);

      // Handle error based on strategy
      const result = await this.handleError(errorObj);
      const metadata: PipelineResultMetadata = {
        fetcherId: this.config.id,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        success: result.success ?? false,
      };

      return {
        success: result.success ?? false,
        data: result.data,
        errors,
        metadata,
      };
    }
  }

  /**
   * Fetch data with retry logic
   */
  private async fetchWithRetry(): Promise<any> {
    const retryConfig = this.config.retry || { maxRetries: 0, backoff: 1000 };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await this.fetchRawData();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt < retryConfig.maxRetries) {
          const backoffTime = retryConfig.exponentialBackoff
            ? retryConfig.backoff * Math.pow(2, attempt)
            : retryConfig.backoff;

          await this.sleep(backoffTime);
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle error based on error strategy
   */
  private async handleError(error: Error): Promise<Partial<PipelineResult>> {
    const strategy = this.config.process.error.strategy;

    switch (strategy) {
      case 'throw':
        throw error;

      case 'skip':
        return {
          success: false,
          data: null,
        };

      case 'default':
        return {
          success: true,
          data: this.config.process.error.defaultValue ?? null,
        };

      case 'retry':
        // Retry is handled in fetchWithRetry
        // If we're here, all retries have failed
        return {
          success: false,
          data: null,
        };

      default:
        throw error;
    }
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the fetcher ID
   */
  getId(): string {
    return this.config.id;
  }

  /**
   * Get the source configuration
   */
  getSourceConfig(): SourceConfig {
    return this.config.source;
  }

  /**
   * Get the process configuration
   */
  getProcessConfig(): ProcessConfig {
    return this.config.process;
  }

  /**
   * Get the retry configuration
   */
  getRetryConfig(): RetryConfig | undefined {
    return this.config.retry;
  }
}
