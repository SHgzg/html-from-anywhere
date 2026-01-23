/**
 * File Fetcher
 * Fetches data from local files
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { Fetcher } from './fetcher';
import { FetcherConfig, SourceConfig } from './types';

export interface FileFetcherConfig extends FetcherConfig {
  source: SourceConfig & {
    type: 'file';
    path: string;
    encoding?: BufferEncoding;
  };
}

export class FileFetcher extends Fetcher {
  private fileConfig: FileFetcherConfig['source'];

  constructor(config: FileFetcherConfig) {
    super(config);
    this.fileConfig = config.source;
  }

  /**
   * Fetch raw data from file
   */
  protected async fetchRawData(): Promise<any> {
    const filePath = this.fileConfig.path;
    const encoding = this.fileConfig.encoding || 'utf-8';

    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file
    const content = await readFile(filePath, { encoding });

    // Try to parse as JSON
    if (filePath.endsWith('.json')) {
      try {
        return JSON.parse(content);
      } catch {
        // Not JSON, return raw content
        return content;
      }
    }

    // Return content as-is for other file types
    return content;
  }
}
