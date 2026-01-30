/**
 * Mock Render Plugin
 *
 * 用于演示和测试的 Mock 渲染插件
 */

import { RenderPlugin, DataResult, ExecutableConfig, RuntimeContext, RenderResult, RenderMode } from '@report-cli/types';

/**
 * HTML Render Plugin
 */
export const htmlRenderPlugin: RenderPlugin = {
  name: 'mock-html-render',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'render',
  mode: 'html',

  async render(
    data: DataResult[],
    config: ExecutableConfig,
    context: RuntimeContext
  ): Promise<RenderResult> {
    console.log(`  [HTML Render Plugin] Rendering ${data.length} data items`);

    // Mock: 生成简单的 HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.report.title || 'Mock Report'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .data-item { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .data-title { font-weight: bold; color: #007bff; }
    .timestamp { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>${config.report.title || 'Mock Report'}</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>

  ${data.map(item => `
  <div class="data-item">
    <div class="data-title">${item.title}</div>
    <div class="timestamp">Tag: ${item.tag} | ${item.meta?.timestamp || 'N/A'}</div>
    <pre>${JSON.stringify(item.data, null, 2)}</pre>
  </div>
  `).join('\n')}

</body>
</html>
    `.trim();

    return {
      renderMode: 'html',
      content: html,
      meta: {
        dataCount: data.length,
        generatedAt: new Date().toISOString()
      }
    };
  }
};
