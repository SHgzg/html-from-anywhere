/**
 * Renderer
 *
 * 负责编排渲染流程
 */

import { RenderRegistry } from './registry';
import { ExecutableConfig, RuntimeContext, DataResult, RenderResult, RenderMode } from '@report-tool/types';

/**
 * 渲染报告
 *
 * @param config - 可执行配置
 * @param data - 数据结果
 * @param registry - Render 注册表
 * @param runtime - 运行时上下文
 * @param renderModes - 需要渲染的模式
 * @returns 渲染结果映射
 */
export async function renderReports(
  config: ExecutableConfig,
  data: DataResult[],
  registry: RenderRegistry,
  runtime: RuntimeContext,
  renderModes: RenderMode[]
): Promise<Map<RenderMode, RenderResult>> {
  const results = new Map<RenderMode, RenderResult>();

  for (const mode of renderModes) {
    try {
      const result = await registry.render(mode, data, config, runtime);
      results.set(mode, result);
    } catch (error) {
      // 单个渲染模式失败，只影响该模式
      console.error(`[Render] Failed to render: ${mode}`, { error });
      throw error;
    }
  }

  return results;
}
