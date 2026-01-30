/**
 * Registry Factory
 *
 * 负责创建和初始化所有 Registry 实例
 */

import { CONTRACTS_VERSION } from '@report-cli/types';
import { ActionRegistry } from '@report-cli/action-core';
import { DataRegistry } from '@report-cli/data-core';
import { RenderRegistry } from '@report-cli/render-core';
import { EnhanceRegistry } from '@report-cli/enhance-core';
import { Registries } from '@report-cli/types';

/**
 * 创建并初始化所有 Registry
 *
 * @param contractsVersion - contracts 版本（默认使用系统版本）
 * @returns 初始化完成的 Registry 集合
 */
export function createRegistries(contractsVersion: string = CONTRACTS_VERSION): Registries {
  // 创建各子系统 Registry
  const actionRegistry = new ActionRegistry(contractsVersion);
  const dataRegistry = new DataRegistry(contractsVersion);
  const renderRegistry = new RenderRegistry(contractsVersion);
  const enhanceRegistry = new EnhanceRegistry();

  return {
    actionRegistry,
    dataRegistry,
    renderRegistry,
    enhanceRegistry
  };
}

/**
 * 锁定所有 Registry
 *
 * 在 Bootstrap 完成后调用，防止运行期注册
 *
 * @param registries - Registry 集合
 */
export function lockRegistries(registries: Registries): void {
  registries.actionRegistry.lock();
  registries.dataRegistry.lock();
  registries.renderRegistry.lock();
  registries.enhanceRegistry.lock();
}

// Re-export types
export type { Registries } from '@report-cli/types';
