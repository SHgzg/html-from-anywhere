/**
 * 多数据源融合配置示例
 */

// 类型定义（用于 TypeScript 类型检查）
// import { FetcherConfig } from '../src/pipeline/types';

// 数据源 1: 用户列表（从 API 获取）
const usersFetcher: FetcherConfig = {
  id: 'users',
  source: {
    type: 'http',
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET',
  },
  process: {
    formatter: { type: 'json' },
    error: { strategy: 'retry', maxRetries: 3 },
  },
  retry: { maxRetries: 3, backoff: 1000 },
};

// 数据源 2: 文章列表（从 API 获取）
const postsFetcher: FetcherConfig = {
  id: 'posts',
  source: {
    type: 'http',
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'GET',
  },
  process: {
    formatter: { type: 'json' },
    // 只取前 5 篇文章
    filter: {
      type: 'field',
      rules: [{ field: 'id', operator: 'lte', value: 5 }],
    },
    error: { strategy: 'skip' },
  },
};

// 数据源 3: 自定义数据（字符串输入）
const customFetcher: FetcherConfig = {
  id: 'custom',
  source: {
    type: 'string',
    data: JSON.stringify([
      { id: 101, type: '系统消息', content: '系统维护通知', priority: 'high' },
      { id: 102, type: '系统消息', content: '版本更新公告', priority: 'normal' },
    ]),
  },
  process: {
    formatter: { type: 'json' },
    error: { strategy: 'throw' },
  },
};

export const fetchers = [usersFetcher, postsFetcher, customFetcher];

// 聚合配置：拼接所有数据并按 ID 排序
export const aggregate = {
  strategy: 'concat' as const,
  parallel: true, // 并行获取提高速度
  maxParallel: 3,
  postProcess: {
    sort: { field: 'id', order: 'asc' as const },
    limit: 20, // 最多保留 20 条
  },
};

export default {
  fetchers,
  aggregate,
};
