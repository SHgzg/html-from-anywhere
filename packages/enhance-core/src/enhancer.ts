/**
 * Enhancer
 *
 * 负责：应用 Enhance 插件增强配置
 */

import { EnhanceRegistry } from './registry';
import { UserConfig, RuntimeContext, ExecutableConfig } from '@report-tool/types';

/**
 * 应用 Enhances
 *
 * @param userConfig - 用户配置
 * @param registry - Enhance 注册表
 * @param runtime - 运行时上下文
 * @returns 可执行配置
 */
export function applyEnhances(
  userConfig: UserConfig,
  registry: EnhanceRegistry,
  runtime: RuntimeContext
): ExecutableConfig {
  console.log('[Enhance] Applying enhances...');

  // 应用所有 Enhance 插件
  const enhancedConfig = registry.applyAll(userConfig, runtime);

  // TODO: 转换为 ExecutableConfig
  // 这里需要根据 Config Phase 的逻辑来转换
  // @ts-ignore - TODO: Implement proper config transformation
  return enhancedConfig as unknown as ExecutableConfig;
}
