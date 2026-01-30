/**
 * DataRegistry - Data 插件注册表
 *
 * 负责管理和分发 Data 插件
 */

import { BaseRegistry } from '@report-cli/registry-core';
import { DataPlugin, DataSourceType } from '@report-cli/types';

/**
 * Data Registry
 *
 * 按 DataSourceType 查找对应的 DataPlugin
 */
export class DataRegistry extends BaseRegistry<DataSourceType, DataPlugin> {
  constructor(contractsVersion: string) {
    super(contractsVersion, 'data');
  }

  /**
   * 获取 Data 插件
   *
   * @param type - 数据源类型
   * @returns Data 插件
   * @throws {PluginNotFoundError} 如果插件未注册
   */
  get(type: DataSourceType): DataPlugin {
    return this.require(type);
  }

  /**
   * 获取数据
   *
   * @param type - 数据源类型
   * @param config - 数据源配置
   * @param context - 运行时上下文
   */
  async fetch(
    type: DataSourceType,
    config: import('@report-cli/types').DataItemConfig,
    context: import('@report-cli/types').RuntimeContext
  ): Promise<import('@report-cli/types').DataResult> {
    const plugin = this.get(type);
    return await plugin.fetch(config, context);
  }
}
