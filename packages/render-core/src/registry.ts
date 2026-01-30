/**
 * RenderRegistry - Render 插件注册表
 *
 * 负责管理和分发 Render 插件
 */

import { BaseRegistry } from '@report-cli/registry-core';
import { RenderPlugin, RenderMode } from '@report-cli/types';

/**
 * Render Registry
 *
 * 按 RenderMode 查找对应的 RenderPlugin
 */
export class RenderRegistry extends BaseRegistry<RenderMode, RenderPlugin> {
  constructor(contractsVersion: string) {
    super(contractsVersion, 'render');
  }

  /**
   * 获取 Render 插件
   *
   * @param mode - 渲染模式
   * @returns Render 插件
   * @throws {PluginNotFoundError} 如果插件未注册
   */
  get(mode: RenderMode): RenderPlugin {
    return this.require(mode);
  }

  /**
   * 渲染报告
   *
   * @param mode - 渲染模式
   * @param data - 数据结果
   * @param config - 可执行配置
   * @param runtime - 运行时上下文
   */
  async render(
    mode: RenderMode,
    data: import('@report-cli/types').DataResult[],
    config: import('@report-cli/types').ExecutableConfig,
    runtime: import('@report-cli/types').RuntimeContext
  ): Promise<import('@report-cli/types').RenderResult> {
    const plugin = this.get(mode);
    return await plugin.render(data, config, runtime);
  }
}
