/**
 * Pipeline Configuration Example
 * Defines fetchers and aggregation strategy for data pipeline
 */

import { FetcherConfig, AggregateConfig } from '../src/pipeline/types';

// Fetcher 1: Users from API
const usersFetcher: FetcherConfig = {
  id: 'users',
  source: {
    type: 'http',
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  },
  process: {
    formatter: {
      type: 'json',
    },
    error: {
      strategy: 'retry',
      maxRetries: 3,
    },
  },
  retry: {
    maxRetries: 3,
    backoff: 1000,
  },
};

// Fetcher 2: Posts from API
const postsFetcher: FetcherConfig = {
  id: 'posts',
  source: {
    type: 'http',
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'GET',
  },
  process: {
    formatter: {
      type: 'json',
    },
    filter: {
      type: 'field',
      rules: [
        { field: 'userId', operator: 'lte', value: 3 },
      ],
    },
    error: {
      strategy: 'skip',
    },
  },
};

// Fetcher 3: Comments from file
const commentsFetcher: FetcherConfig = {
  id: 'comments',
  source: {
    type: 'file',
    path: './data/comments.json',
  },
  process: {
    formatter: {
      type: 'json',
    },
    error: {
      strategy: 'default',
      defaultValue: [],
    },
  },
};

// Fetcher 4: Custom data from string
const customFetcher: FetcherConfig = {
  id: 'custom',
  source: {
    type: 'string',
    data: JSON.stringify([
      { id: 1, name: 'Item 1', status: 'active' },
      { id: 2, name: 'Item 2', status: 'inactive' },
      { id: 3, name: 'Item 3', status: 'active' },
    ]),
  },
  process: {
    formatter: {
      type: 'json',
    },
    filter: {
      type: 'field',
      rules: [
        { field: 'status', operator: 'eq', value: 'active' },
      ],
    },
    error: {
      strategy: 'throw',
    },
  },
};

// Export fetchers
export const fetchers = [
  usersFetcher,
  postsFetcher,
  commentsFetcher,
  customFetcher,
];

// Export aggregate configuration
export const aggregate = {
  strategy: 'concat' as const,
  parallel: true,
  maxParallel: 3,
  postProcess: {
    sort: {
      field: 'id',
      order: 'asc' as const,
    },
    limit: 50,
  },
};

// Default export
export default {
  fetchers,
  aggregate,
};
