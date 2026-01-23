/**
 * String Fetcher
 * Fetches data from direct string input
 */

import { Fetcher } from './fetcher';
import { FetcherConfig, SourceConfig } from './types';

export interface StringFetcherConfig extends FetcherConfig {
  source: SourceConfig & {
    type: 'string';
    data: any;
  };
}

export class StringFetcher extends Fetcher {
  private stringConfig: StringFetcherConfig['source'];

  constructor(config: StringFetcherConfig) {
    super(config);
    this.stringConfig = config.source;
  }

  /**
   * Fetch raw data from string input
   */
  protected async fetchRawData(): Promise<any> {
    let data = this.stringConfig.data;

    // If data is a string, try to parse it
    if (typeof data === 'string') {
      // Try to parse as JSON
      try {
        return JSON.parse(data);
      } catch {
        // Not JSON, return as-is
        return data;
      }
    }

    // Return data as-is if already an object
    return data;
  }
}
