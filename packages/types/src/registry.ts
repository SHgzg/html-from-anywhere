/**
 * Registry Type Definitions
 *
 * 插件注册表的核心类型定义
 */

import { BasePlugin } from './plugin';

/**
 * Registry 锁定错误
 */
export class RegistryLockedError extends Error {
  constructor(public readonly registryName: string) {
    super(`Registry '${registryName}' is locked, cannot register plugins`);
    this.name = 'RegistryLockedError';
  }
}

/**
 * 重复注册错误
 */
export class DuplicatePluginError extends Error {
  constructor(public readonly key: string) {
    super(`Duplicate plugin key registration: ${key}`);
    this.name = 'DuplicatePluginError';
  }
}

/**
 * 插件未注册错误
 */
export class PluginNotFoundError extends Error {
  constructor(public readonly key: string) {
    super(`No plugin registered for key: ${key}`);
    this.name = 'PluginNotFoundError';
  }
}

/**
 * 插件版本不兼容错误
 */
export class PluginIncompatibleError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly pluginVersion: string,
    public readonly contractsVersion: string
  ) {
    super(
      `Plugin ${pluginName}@${pluginVersion} is incompatible with contracts version ${contractsVersion}`
    );
    this.name = 'PluginIncompatibleError';
  }
}

/**
 * 插件类型不匹配错误
 */
export class PluginTypeError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly expectedPhase: string,
    public readonly actualPhase: string
  ) {
    super(
      `Plugin '${pluginName}' has invalid phase: expected '${expectedPhase}', got '${actualPhase}'`
    );
    this.name = 'PluginTypeError';
  }
}
