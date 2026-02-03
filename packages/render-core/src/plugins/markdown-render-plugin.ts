/**
 * Markdown Render Plugin
 *
 * 将数据渲染为 Markdown 格式
 *
 * 适用场景：
 * - 文档归档
 * - 版本控制（Git）
 * - 纯文本展示
 */

import { RenderPlugin, DataResult, ExecutableConfig, RuntimeContext, RenderResult } from '@report-tool/types';
import { htmlRenderPlugin } from './html-render-plugin';
import { emailRenderPlugin } from './email-render-plugin';

/**
 * 渲染配置选项
 */
interface MarkdownRenderOptions {
  /** 大表格最大行数 */
  maxTableRows?: number;
  /** 大文本最大字符数 */
  maxTextLength?: number;
}

/**
 * 转义 Markdown 特殊字符
 */
function escapeMarkdown(text: string): string {
  // 转义 Markdown 特殊字符，但保留中文
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 渲染表格数据为 Markdown
 */
function renderTable(data: Record<string, unknown>[], options: MarkdownRenderOptions): string {
  if (!data || data.length === 0) {
    return '*No data available*\n';
  }

  const headers = Object.keys(data[0]);
  const maxRows = options.maxTableRows || 1000;
  const displayData = data.slice(0, maxRows);
  const isTruncated = data.length > maxRows;

  let markdown = '| ' + headers.join(' | ') + ' |\n';
  markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

  for (const row of displayData) {
    const cells = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '`null`';
      } else if (typeof value === 'object') {
        return `\`${JSON.stringify(value)}\``;
      } else {
        return escapeMarkdown(String(value));
      }
    });
    markdown += '| ' + cells.join(' | ') + ' |\n';
  }

  if (isTruncated) {
    markdown += `\n*... ${data.length} rows total, showing first ${maxRows} rows*\n`;
  }

  return markdown;
}

/**
 * 渲染图片数据为 Markdown
 */
function renderImage(data: { format: string; encoding: string; data: string }, title: string): string {
  // Markdown 不直接支持 base64 图片，返回图片信息和格式说明
  return `
### ${title}

- **Format**: \`${data.format}\`
- **Encoding**: \`${data.encoding}\`
- **Data Size**: ${data.data.length} characters (base64)
- **Preview**: \`${data.data.substring(0, 50)}...\`

*[Note: Full base64 image data available in source]*
`.trim();
}

/**
 * 渲染对象数据为 Markdown
 */
function renderObject(data: Record<string, unknown>, options: MarkdownRenderOptions): string {
  let markdown = '';

  const entries = Object.entries(data);
  for (const [key, value] of entries) {
    markdown += `**${key}**: `;

    if (value === null || value === undefined) {
      markdown += '`null`\n';
    } else if (typeof value === 'object') {
      markdown += '\n```\n' + JSON.stringify(value, null, 2) + '\n```\n';
    } else if (typeof value === 'boolean') {
      markdown += `\`${value}\`\n`;
    } else if (typeof value === 'number') {
      markdown += `\`${value}\`\n`;
    } else {
      markdown += `${escapeMarkdown(String(value))}\n`;
    }
  }

  return markdown;
}

/**
 * 渲染文本数据为 Markdown
 */
function renderText(data: string, options: MarkdownRenderOptions): string {
  const maxLength = options.maxTextLength || 5000;
  const isTruncated = data.length > maxLength;
  const displayText = data.substring(0, maxLength);

  let markdown = '```\n' + displayText + '\n```\n';

  if (isTruncated) {
    markdown += `\n*... ${data.length} characters total, showing first ${maxLength}*\n`;
  }

  return markdown;
}

/**
 * 渲染数据项
 */
function renderDataItem(item: DataResult, options: MarkdownRenderOptions): string {
  const dataType = (item.meta?.dataType as string) || 'text';
  const title = item.title;

  let markdown = `## ${title}\n\n`;

  // 添加元数据
  if (item.meta) {
    const metaItems: string[] = [];
    if (item.meta.dataType) metaItems.push(`Type: ${item.meta.dataType}`);
    if (item.meta.rows !== undefined) metaItems.push(`Rows: ${item.meta.rows}`);
    if (item.meta.columns !== undefined) metaItems.push(`Columns: ${item.meta.columns}`);
    if (item.meta.format) metaItems.push(`Format: ${item.meta.format}`);
    if (item.meta.timestamp) metaItems.push(`Updated: ${item.meta.timestamp}`);

    if (metaItems.length > 0) {
      markdown += '*Metadata*: ' + metaItems.join(' | ') + '\n\n';
    }
  }

  // 渲染内容
  switch (dataType) {
    case 'table':
      const tableData = item.data as Record<string, unknown>[];
      markdown += renderTable(tableData, options);
      break;

    case 'image':
      const imageData = item.data as { format: string; encoding: string; data: string };
      markdown += renderImage(imageData, item.title);
      break;

    case 'object':
      const objectData = item.data as Record<string, unknown>;
      markdown += renderObject(objectData, options);
      break;

    case 'text':
    default:
      const textData = String(item.data);
      markdown += renderText(textData, options);
      break;
  }

  return markdown;
}

/**
 * Markdown Render Plugin
 */
export const markdownRenderPlugin: RenderPlugin = {
  name: 'markdown-render',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'render',
  mode: 'markdown',

  async render(
    data: DataResult[],
    config: ExecutableConfig,
    context: RuntimeContext
  ): Promise<RenderResult> {
    console.log(`  [Markdown Render Plugin] Rendering ${data.length} data items`);

    const options: MarkdownRenderOptions = {
      maxTableRows: 1000,
      maxTextLength: 5000
    };

    const timestamp = new Date().toLocaleString();

    // 生成 Markdown 内容
    let markdown = `# ${config.report.title || 'Report'}\n\n`;
    markdown += `**Generated**: ${timestamp} | **Data Items**: ${data.length}\n\n`;
    markdown += `---\n\n`;

    // 渲染所有数据项
    markdown += data.map(item => renderDataItem(item, options)).join('\n\n---\n\n');

    markdown += `\n---\n\n***\n`;
    markdown += `\n*Generated by Report-Tool | ${timestamp}*\n`;

    return {
      renderMode: 'markdown',
      content: markdown,
      meta: {
        dataCount: data.length,
        generatedAt: new Date().toISOString(),
        options
      }
    };
  }
};

/**
 * 获取所有渲染插件
 */
export function getAllRenderPlugins(): Map<string, RenderPlugin> {
  return new Map([
    ['html', htmlRenderPlugin],
    ['email', emailRenderPlugin],
    ['markdown', markdownRenderPlugin]
  ]);
}
