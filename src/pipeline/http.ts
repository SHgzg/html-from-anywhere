/**
 * HTTP Fetcher
 * Fetches data from HTTP/HTTPS endpoints
 */

import axios, { AxiosRequestConfig } from 'axios';
import { Fetcher } from './fetcher';
import { FetcherConfig, SourceConfig } from './types';

export interface HttpFetcherConfig extends FetcherConfig {
  source: SourceConfig & {
    type: 'http';
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    auth?: {
      type: 'basic' | 'bearer' | 'apikey';
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
      apiKeyHeader?: string;
    };
    body?: any;
    timeout?: number;
  };
}

export class HttpFetcher extends Fetcher {
  private httpConfig: HttpFetcherConfig['source'];

  constructor(config: HttpFetcherConfig) {
    super(config);
    this.httpConfig = config.source;
  }

  /**
   * Fetch raw data from HTTP endpoint
   */
  protected async fetchRawData(): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      method: this.httpConfig.method || 'GET',
      url: this.httpConfig.url,
      headers: this.httpConfig.headers || {},
      timeout: this.httpConfig.timeout || 30000,
    };

    // Add authentication
    if (this.httpConfig.auth) {
      this.addAuthentication(requestConfig);
    }

    // Add body for POST/PUT/PATCH requests
    if (this.httpConfig.body && ['POST', 'PUT', 'PATCH'].includes(requestConfig.method!)) {
      requestConfig.data = this.httpConfig.body;
    }

    try {
      const response = await axios(requestConfig);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `HTTP request failed: ${error.message}. Status: ${error.response?.status}`
        );
      }
      throw error;
    }
  }

  /**
   * Add authentication to request
   */
  private addAuthentication(requestConfig: AxiosRequestConfig): void {
    const auth = this.httpConfig.auth!;

    switch (auth.type) {
      case 'basic':
        requestConfig.auth = {
          username: auth.username || '',
          password: auth.password || '',
        };
        break;

      case 'bearer':
        requestConfig.headers = requestConfig.headers || {};
        requestConfig.headers.Authorization = `Bearer ${auth.token}`;
        break;

      case 'apikey':
        requestConfig.headers = requestConfig.headers || {};
        const headerName = auth.apiKeyHeader || 'X-API-Key';
        requestConfig.headers[headerName] = auth.apiKey;
        break;
    }
  }
}
