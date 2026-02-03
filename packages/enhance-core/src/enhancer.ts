/**
 * Enhancer
 *
 * 负责：应用 Enhance 插件增强配置
 */

import { EnhanceRegistry } from './registry';
import { UserConfig, RuntimeContext, ExecutableConfig, ReportConfig, DataItemConfig, ActionConfig } from '@report-tool/types';

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

  // 转换为 ExecutableConfig
  return transformToExecutableConfig(enhancedConfig);
}

/**
 * 将 UserConfig 转换为 ExecutableConfig
 *
 * 提供默认值，确保配置结构完整
 */
function transformToExecutableConfig(userConfig: UserConfig): ExecutableConfig {
  // 提取 report 配置
  const reportConfig = (userConfig.report as ReportConfig) || {
    title: 'Untitled Report',
    data: []
  };

  // 提取 data 配置（默认为空数组）
  const dataConfig = (userConfig.data as DataItemConfig[]) || [];

  // 提取 actions 配置（默认为空数组）
  const actionsConfig = (userConfig.actions as ActionConfig[]) || [];

  // 保留 meta 和 deprecated 信息（如果有）
  const { meta, deprecated } = userConfig;

  return {
    report: reportConfig,
    data: dataConfig,
    actions: actionsConfig,
    meta: meta as Record<string, unknown> | undefined,
    deprecated: deprecated as ExecutableConfig['deprecated'] | undefined
  };
}
