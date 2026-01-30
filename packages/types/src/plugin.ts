/**
 * Plugin System Type Definitions
 *
 * 插件系统核心类型定义
 */

import { RuntimeContext } from './runtime';
import { UserConfig, ExecutableConfig, DataItemConfig } from './config';
import { DataResult } from './data';
import { RenderResult, RenderMode } from './render';

/**
 * Contracts 版本
 * 用于约束插件与核心系统的兼容性
 */
export const CONTRACTS_VERSION = '1.0.0';

/**
 * 所有插件的基础接口
 */
export interface BasePlugin {
  /** 插件名称（全局唯一） */
  name: string;

  /** 插件版本（语义化版本） */
  version: string;

  /** 兼容的 contracts 版本范围 */
  compatibleContracts: string;

  /** 插件所属的 Phase */
  phase: PluginPhase;
}

/**
 * 插件 Phase 类型
 */
export type PluginPhase = 'enhance' | 'data' | 'render' | 'action';

/**
 * SemVer 版本范围
 */
export type SemVerRange = string;

// ============================================================================
// Enhance Plugin
// ============================================================================

/**
 * Enhance 插件接口
 *
 * 约束：
 * - 必须是纯函数
 * - 不能有副作用
 * - 不能修改 RuntimeContext
 * - 只能返回新的配置对象
 */
export interface EnhancePlugin extends BasePlugin {
  phase: 'enhance';

  /**
   * 应用配置增强
   * @param userConfig - 用户配置
   * @param context - 运行时上下文（只读）
   * @returns 增强后的配置
   */
  apply(
    userConfig: UserConfig,
    context: RuntimeContext
  ): UserConfig;
}

// ============================================================================
// Data Plugin
// ============================================================================

/**
 * 数据源类型
 */
export type DataSourceType =
  | 'http'
  | 'https'
  | 'file'
  | 'inline'
  | 'glob'
  | 'db';

/**
 * Data 插件接口
 *
 * 约束：
 * - 只能执行数据获取操作
 * - 不能直接访问 MongoDB
 * - 失败必须抛出 DataError
 */
export interface DataPlugin extends BasePlugin {
  phase: 'data';

  /** 数据源类型标识 */
  type: DataSourceType;

  /**
   * 获取数据
   * @param config - 数据源配置
   * @param context - 运行时上下文（只读）
   * @returns 标准化的数据结果
   */
  fetch(
    config: DataItemConfig,
    context: RuntimeContext
  ): Promise<DataResult>;

  /**
   * 验证配置
   * @param config - 数据源配置
   * @returns 配置是否合法
   */
  validate(config: DataItemConfig): boolean;
}

// ============================================================================
// Render Plugin
// ============================================================================

/**
 * Render 插件接口
 *
 * 约束：
 * - 只能执行渲染操作
 * - 不能执行 IO 操作
 * - 失败必须抛出 RenderError
 */
export interface RenderPlugin extends BasePlugin {
  phase: 'render';

  /** 渲染模式 */
  mode: RenderMode;

  /**
   * 渲染报告
   * @param data - 数据结果
   * @param config - 可执行配置
   * @param context - 运行时上下文（只读）
   * @returns 渲染结果
   */
  render(
    data: DataResult[],
    config: ExecutableConfig,
    context: RuntimeContext
  ): Promise<RenderResult>;
}
