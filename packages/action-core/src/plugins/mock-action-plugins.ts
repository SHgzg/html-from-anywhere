/**
 * Mock Action Plugins
 *
 * 用于演示和测试的 Mock Action 插件
 */

import { ActionPlugin, ActionPayload, ActionContext, ActionConfig } from '@report-cli/types';

/**
 * Log Action Plugin
 *
 * 输出日志到控制台
 */
export const logActionPlugin: ActionPlugin = {
  name: 'mock-log-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'log',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    console.log('');
    console.log('  ========================================');
    console.log('  [Log Action] Execution Summary');
    console.log('  ========================================');
    console.log(`  Date: ${context.runtime.dateContext?.rawDate || 'N/A'}`);
    console.log(`  Data Items: ${context.data.length}`);

    if (context.renderResult) {
      console.log(`  Render Result: ${context.renderResult.renderMode}`);
      console.log(`  Content Length: ${context.renderResult.content.length} chars`);
    } else {
      console.log(`  Render Result: None`);
    }

    console.log('  ========================================');
    console.log('');
  }
};

/**
 * Email Action Plugin
 *
 * 模拟发送邮件
 */
export const emailActionPlugin: ActionPlugin = {
  name: 'mock-email-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'email',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    const emailPayload = payload as any;

    console.log('');
    console.log('  ========================================');
    console.log('  [Email Action] Mock Send');
    console.log('  ========================================');
    console.log(`  To: ${emailPayload.to || 'N/A'}`);
    console.log(`  Subject: ${emailPayload.subject || 'Mock Report'}`);
    console.log(`  Template: ${emailPayload.template || 'default'}`);

    if (context.renderResult) {
      console.log(`  Attachment: ${context.renderResult.renderMode} report (${context.renderResult.content.length} chars)`);
    }

    console.log('  Status: ✅ Mock sent successfully');
    console.log('  ========================================');
    console.log('');
  }
};

/**
 * File Output Action Plugin
 *
 * 模拟输出文件
 */
export const fileOutputActionPlugin: ActionPlugin = {
  name: 'mock-file-output-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'file_output',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    const filePayload = payload as any;

    console.log('');
    console.log('  ========================================');
    console.log('  [File Output Action] Mock Write');
    console.log('  ========================================');
    console.log(`  Path: ${filePayload.path || './output/report.html'}`);

    if (context.renderResult) {
      console.log(`  Mode: ${context.renderResult.renderMode}`);
      console.log(`  Size: ${context.renderResult.content.length} chars`);
      console.log('  Status: ✅ Mock written successfully');
    } else {
      console.log('  Status: ⚠️  No render result to write');
    }

    console.log('  ========================================');
    console.log('');
  }
};

/**
 * 获取所有 Mock Action 插件
 */
export function getAllMockActionPlugins(): Map<string, ActionPlugin> {
  return new Map([
    ['log', logActionPlugin],
    ['email', emailActionPlugin],
    ['file_output', fileOutputActionPlugin]
  ]);
}
