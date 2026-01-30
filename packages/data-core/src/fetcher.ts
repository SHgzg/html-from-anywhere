/**
 * Data Fetcher
 *
 * 负责编排数据获取流程
 */

import { DataRegistry } from './registry';
import { DataItemConfig, ExecutableConfig, RuntimeContext, DataResult } from '@report-cli/types';
import { DataSourceType } from '@report-cli/types';

/**
 * 获取所有数据
 *
 * @param config - 可执行配置
 * @param registry - Data 注册表
 * @param runtime - 运行时上下文
 * @returns 数据结果列表
 */
export async function fetchAllData(
  config: ExecutableConfig,
  registry: DataRegistry,
  runtime: RuntimeContext
): Promise<DataResult[]> {
  const results: DataResult[] = [];

  for (const dataItem of config.data) {
    try {
      // 检测数据源类型
      const sourceType = detectSourceType(dataItem.source);

      // 获取对应的插件
      const plugin = registry.get(sourceType);

      // 验证配置
      if (!plugin.validate(dataItem)) {
        throw new Error(`Invalid data source config for: ${dataItem.title}`);
      }

      // 获取数据
      const result = await plugin.fetch(dataItem, runtime);
      results.push(result);

    } catch (error) {
      // 单个数据源失败，终止整个流程
      console.error(`[Data] Failed to fetch: ${dataItem.title}`, { error });
      throw error;
    }
  }

  return results;
}

/**
 * 检测数据源类型
 *
 * @param source - 数据源配置
 * @returns 数据源类型
 */
export function detectSourceType(source: unknown): DataSourceType {
  if (typeof source === 'string') {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return 'https';
    }
    if (source.startsWith('/') || source.startsWith('./')) {
      return 'file';
    }
    // 尝试解析为 inline JSON
    try {
      JSON.parse(source);
      return 'inline';
    } catch {
      return 'inline';  // raw string
    }
  }

  if (typeof source === 'object' && source !== null) {
    const obj = source as Record<string, unknown>;
    const type = obj.type as string;

    if (type === 'http' || type === 'https' || type === 'file' ||
        type === 'inline' || type === 'glob' || type === 'db') {
      return type as DataSourceType;
    }
  }

  throw new Error(`Cannot detect data source type: ${JSON.stringify(source)}`);
}
