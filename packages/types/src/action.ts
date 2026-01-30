/**
 * Action - Action 插件相关类型
 */

import { BasePlugin } from './plugin';
import { RuntimeContext } from './runtime';
import { DataResult } from './data';
import { RenderResult } from './render';

/**
 * Action 参数类型
 */
export type ActionPayload = Record<string, unknown>;

/**
 * Action 执行上下文
 */
export interface ActionContext {
  /** 运行时上下文（只读） */
  readonly runtime: RuntimeContext;

  /** 数据结果（只读） */
  readonly data: DataResult[];

  /** 渲染结果（只读，可选） */
  readonly renderResult?: RenderResult;
}

/**
 * Action 插件接口
 *
 * 约束：
 * - 只能执行副作用操作
 * - 不能修改 RuntimeContext
 * - 失败不能中断其他 Action
 */
export interface ActionPlugin extends BasePlugin {
  phase: 'action';

  /** Action 类型标识 */
  type: string;

  /**
   * 执行 Action
   * @param payload - Action 参数（已被解析）
   * @param context - 执行上下文
   * @returns void
   */
  execute(
    payload: ActionPayload,
    context: ActionContext
  ): Promise<void>;
}

/**
 * @deprecated 使用 ActionPlugin 代替
 * 保留用于向后兼容
 */
export interface ActionExecutor {
  type: string;
  execute(params: {
    action: import('./config').ActionConfig;
    data: DataResult[];
    renderResult?: RenderResult;
    runtime: RuntimeContext;
  }): Promise<void>;
}
