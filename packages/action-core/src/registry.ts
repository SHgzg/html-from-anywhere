/**
 * ActionRegistry - Action 插件注册表
 *
 * 负责管理和分发 Action 插件
 */

import { BaseRegistry } from '@report-tool/registry-core';
import { ActionPlugin, ActionPayload, ActionContext } from '@report-tool/types';

/**
 * Action Registry
 *
 * 按 ActionType 查找对应的 ActionPlugin
 */
export class ActionRegistry extends BaseRegistry<string, ActionPlugin> {
  constructor(contractsVersion: string) {
    super(contractsVersion, 'action');
  }

  /**
   * 获取 Action 插件
   *
   * @param type - Action 类型
   * @returns Action 插件
   * @throws {PluginNotFoundError} 如果插件未注册
   */
  get(type: string): ActionPlugin {
    return this.require(type);
  }

  /**
   * 执行 Action
   *
   * @param type - Action 类型
   * @param payload - Action 参数（已被解析）
   * @param context - 执行上下文
   */
  async execute(
    type: string,
    payload: ActionPayload,
    context: ActionContext
  ): Promise<void> {
    const plugin = this.get(type);
    await plugin.execute(payload, context);
  }
}
