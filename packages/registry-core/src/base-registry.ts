/**
 * BaseRegistry - 插件注册表基类
 *
 * 提供：
 * - 启动期注册锁
 * - 重复注册检测
 * - contracts 版本校验
 * - 强失败（fail-fast）
 */

import semver from 'semver';
import {
  RegistryLockedError,
  DuplicatePluginError,
  PluginNotFoundError,
  PluginIncompatibleError,
  PluginTypeError,
} from '@report-cli/types';

/**
 * Registry 基类
 *
 * @typeparam K - 插件键类型（如 ActionType, RenderMode）
 * @typeparam P - 插件类型（必须继承 BasePlugin）
 */
export abstract class BaseRegistry<K, P extends { name: string; version: string; compatibleContracts: string; phase?: string }> {
  protected readonly map = new Map<K, P>();
  private locked = false;

  constructor(
    private readonly contractsVersion: string,
    private readonly expectedPhase?: string
  ) {}

  /**
   * 注册插件（仅允许启动期）
   *
   * @throws {RegistryLockedError} 如果 registry 已锁定
   * @throws {DuplicatePluginError} 如果键已存在
   * @throws {PluginIncompatibleError} 如果 contracts 版本不兼容
   * @throws {PluginTypeError} 如果插件 phase 不匹配
   */
  register(key: K, plugin: P): void {
    // 1. 检查是否已锁定
    if (this.locked) {
      throw new RegistryLockedError(this.constructor.name);
    }

    // 2. 检查重复注册
    if (this.map.has(key)) {
      throw new DuplicatePluginError(String(key));
    }

    // 3. 检查 phase 类型（如果有）
    if (this.expectedPhase && plugin.phase !== this.expectedPhase) {
      throw new PluginTypeError(plugin.name, this.expectedPhase, plugin.phase || 'undefined');
    }

    // 4. 检查 contracts 版本兼容性
    if (
      !semver.satisfies(
        this.contractsVersion,
        plugin.compatibleContracts
      )
    ) {
      throw new PluginIncompatibleError(
        plugin.name,
        plugin.version,
        this.contractsVersion
      );
    }

    // 5. 注册插件
    this.map.set(key, plugin);
  }

  /**
   * 锁定 registry（启动完成后调用）
   *
   * 锁定后不再允许注册新插件
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
   * 内部获取（插件必须存在）
   *
   * @throws {PluginNotFoundError} 如果插件未注册
   */
  protected require(key: K): P {
    const plugin = this.map.get(key);
    if (!plugin) {
      throw new PluginNotFoundError(String(key));
    }
    return plugin;
  }

  /**
   * 检查插件是否已注册
   */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * 获取所有已注册的插件（用于调试/诊断）
   */
  list(): readonly P[] {
    return Array.from(this.map.values());
  }

  /**
   * 获取所有已注册的插件键
   */
  keys(): readonly K[] {
    return Array.from(this.map.keys());
  }

  /**
   * 获取已注册插件数量
   */
  size(): number {
    return this.map.size;
  }
}
