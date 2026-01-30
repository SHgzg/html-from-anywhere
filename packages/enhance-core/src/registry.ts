/**
 * EnhanceRegistry - Enhance 插件注册表
 *
 * 注意：Enhance 是 pipeline 而不是 lookup，所以不继承 BaseRegistry
 */

import semver from 'semver';
import { EnhancePlugin } from '@report-cli/types';
import { CONTRACTS_VERSION } from '@report-cli/types';

/**
 * Enhance Registry
 *
 * 按注册顺序顺序执行所有 Enhance 插件
 */
export class EnhanceRegistry {
  private readonly list: EnhancePlugin[] = [];
  private locked = false;

  /**
   * 注册 Enhance 插件
   *
   * @throws {RegistryLockedError} 如果 registry 已锁定
   * @throws {PluginIncompatibleError} 如果 contracts 版本不兼容
   */
  register(plugin: EnhancePlugin): void {
    if (this.locked) {
      throw new Error(`EnhanceRegistry is locked, cannot register plugin: ${plugin.name}`);
    }

    // 检查 contracts 版本兼容性
    if (!semver.satisfies(CONTRACTS_VERSION, plugin.compatibleContracts)) {
      throw new Error(
        `Plugin ${plugin.name}@${plugin.version} is incompatible with contracts version ${CONTRACTS_VERSION}`
      );
    }

    this.list.push(plugin);
  }

  /**
   * 锁定 registry（启动完成后调用）
   */
  lock(): void {
    this.locked = true;
  }

  /**
   * 检查 registry 是否已锁定
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * 应用所有 Enhance 插件
   *
   * 按注册顺序依次应用
   *
   * @param userConfig - 用户配置
   * @param context - 运行时上下文
   * @returns 增强后的配置
   */
  applyAll(
    userConfig: import('@report-cli/types').UserConfig,
    context: import('@report-cli/types').RuntimeContext
  ): import('@report-cli/types').UserConfig {
    return this.list.reduce(
      (config, plugin) => plugin.apply(config, context),
      userConfig
    );
  }

  /**
   * 获取所有已注册的插件（用于调试/诊断）
   */
  getAll(): readonly EnhancePlugin[] {
    return [...this.list];
  }

  /**
   * 获取已注册插件数量
   */
  size(): number {
    return this.list.length;
  }
}
