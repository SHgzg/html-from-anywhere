/**
 * Action 执行器
 *
 * 负责编排和执行多个 Action
 */

import { ActionRegistry } from './registry';
import { ActionConfig, DataResult, RenderResult, RuntimeContext, ActionPayload } from '@report-tool/types';

/**
 * Action 执行上下文
 */
interface ExecutionContext {
  runtime: RuntimeContext;
  data: DataResult[];
  renderResult?: RenderResult;
}

/**
 * Action 执行结果
 */
interface ActionResult {
  type: string;
  success: boolean;
  error?: Error;
  duration: number;
}

/**
 * 执行 Actions
 *
 * @param actions - Action 配置列表
 * @param event - 当前事件
 * @param registry - Action 注册表
 * @param context - 执行上下文
 * @returns 执行结果列表
 */
export async function executeActions(
  actions: ActionConfig[],
  event: 'data_ready' | 'report_ready' | 'report_archived',
  registry: ActionRegistry,
  context: ExecutionContext
): Promise<ActionResult[]> {
  // 过滤出当前事件的 actions
  const eventActions = actions.filter(a => a.on === event);

  if (eventActions.length === 0) {
    return [];
  }

  const results: ActionResult[] = [];

  for (const actionConfig of eventActions) {
    const startTime = Date.now();

    try {
      // 构建执行上下文
      const actionContext: import('@report-tool/types').ActionContext = {
        runtime: context.runtime,
        data: context.data,
        renderResult: context.renderResult
      };

      // 执行 Action
      await registry.execute(
        actionConfig.type,
        actionConfig.spec as ActionPayload,
        actionContext
      );

      results.push({
        type: actionConfig.type,
        success: true,
        duration: Date.now() - startTime
      });

    } catch (error) {
      results.push({
        type: actionConfig.type,
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      });

      // Action 错误不中断其他 Action
      console.error(`[Action] Failed: ${actionConfig.type}`, { error });
    }
  }

  return results;
}
