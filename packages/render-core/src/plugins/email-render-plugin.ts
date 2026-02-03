/**
 * Email Render Plugin
 *
 * 将数据渲染为 Email 兼容的 HTML 格式
 *
 * 与 HTML 渲染器的区别：
 * - 使用 table 布局而非 CSS Flexbox/Grid
 * - 样式完全内联（inline styles）
 * - 不使用 JavaScript
 * - 使用兼容邮件客户端的 CSS
 */

import { RenderPlugin, DataResult, ExecutableConfig, RuntimeContext, RenderResult } from '@report-tool/types';

/**
 * 渲染配置选项
 */
interface EmailRenderOptions {
  /** 大表格最大行数 */
  maxTableRows?: number;
  /** 大文本最大字符数 */
  maxTextLength?: number;
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 渲染表格数据（Email 兼容）
 */
function renderTable(data: Record<string, unknown>[], options: EmailRenderOptions): string {
  if (!data || data.length === 0) {
    return '<p style="color: #999; font-style: italic; text-align: center; padding: 20px;">No data available</p>';
  }

  const headers = Object.keys(data[0]);
  const maxRows = options.maxTableRows || 50; // Email 需要更小的限制
  const displayData = data.slice(0, maxRows);
  const isTruncated = data.length > maxRows;

  let html = '<table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;">\n';

  // 表头
  html += '<thead>\n<tr>\n';
  for (const header of headers) {
    html += `<th style="background: #007bff; color: white; padding: 10px; text-align: left; border: 1px solid #0056b3;">${escapeHtml(header)}</th>\n`;
  }
  html += '</tr>\n</thead>\n';

  // 表体
  html += '<tbody>\n';
  for (const row of displayData) {
    html += '<tr>\n';
    for (const header of headers) {
      const value = row[header];
      let cellContent: string;

      if (value === null || value === undefined) {
        cellContent = '<span style="color: #999;">null</span>';
      } else if (typeof value === 'object') {
        cellContent = `<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-size: 12px;">${escapeHtml(JSON.stringify(value))}</code>`;
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        cellContent = String(value);
      } else {
        cellContent = escapeHtml(String(value));
      }

      const align = (typeof value === 'number') ? 'text-align: right;' : 'text-align: left;';
      html += `<td style="border: 1px solid #ddd; padding: 8px; ${align} border-bottom: 1px solid #ddd;">${cellContent}</td>\n`;
    }
    html += '</tr>\n';
  }
  html += '</tbody>\n';

  // 截断提示
  if (isTruncated) {
    html += `<tfoot><tr><td colspan="${headers.length}" style="background: #fff3cd; color: #856404; padding: 10px; text-align: center; font-weight: 500;">\n`;
    html += `... ${data.length} rows total, showing first ${maxRows} rows\n`;
    html += `</td></tr></tfoot>\n`;
  }

  html += '</table>\n';
  return html;
}

/**
 * 渲染图片数据（Email 兼容）
 */
function renderImage(data: { format: string; encoding: string; data: string }, title: string): string {
  const mimeType = `image/${data.format}`;
  const src = `data:${mimeType};${data.encoding},${data.data}`;

  return `
    <div style="margin: 20px 0; text-align: center;">
      <img src="${src}" alt="${escapeHtml(title)}" style="max-width: 100%; height: auto; border-radius: 4px;" />
      <p style="margin-top: 8px; font-size: 13px; color: #666; font-style: italic;">${escapeHtml(title)}</p>
    </div>
  `.trim();
}

/**
 * 渲染对象数据（Email 兼容）
 */
function renderObject(data: Record<string, unknown>, options: EmailRenderOptions): string {
  const entries = Object.entries(data);

  let html = '<div style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">\n';
  for (const [key, value] of entries) {
    html += `<div style="margin-bottom: 12px;">\n`;
    html += `<strong style="color: #007bff; font-size: 14px;">${escapeHtml(key)}:</strong> `;

    let valueContent: string;
    if (value === null || value === undefined) {
      valueContent = '<span style="color: #999;">null</span>';
    } else if (typeof value === 'object') {
      valueContent = `<pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; margin: 5px 0;">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
    } else if (typeof value === 'boolean') {
      valueContent = `<span style="color: #28a745;">${String(value)}</span>`;
    } else if (typeof value === 'number') {
      valueContent = `<span style="color: #dc3545;">${String(value)}</span>`;
    } else {
      valueContent = escapeHtml(String(value));
    }

    html += valueContent + '\n';
    html += '</div>\n';
  }
  html += '</div>\n';
  return html;
}

/**
 * 渲染文本数据（Email 兼容）
 */
function renderText(data: string, options: EmailRenderOptions): string {
  const maxLength = options.maxTextLength || 5000; // Email 更短的限制
  const isTruncated = data.length > maxLength;
  const displayText = data.substring(0, maxLength);

  let html = `<pre style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 15px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.5;">${escapeHtml(displayText)}</pre>\n`;

  if (isTruncated) {
    html += `<p style="color: #856404; background: #fff3cd; padding: 8px; border-radius: 4px; text-align: center; font-size: 13px; margin-top: 10px;">... ${data.length} characters total, showing first ${maxLength}</p>\n`;
  }

  return html;
}

/**
 * 渲染数据项
 */
function renderDataItem(item: DataResult, options: EmailRenderOptions): string {
  const dataType = (item.meta?.dataType as string) || 'text';
  const title = escapeHtml(item.title);

  let contentHtml = '';

  switch (dataType) {
    case 'table':
      const tableData = item.data as Record<string, unknown>[];
      contentHtml = renderTable(tableData, options);
      break;

    case 'image':
      const imageData = item.data as { format: string; encoding: string; data: string };
      contentHtml = renderImage(imageData, item.title);
      break;

    case 'object':
      const objectData = item.data as Record<string, unknown>;
      contentHtml = renderObject(objectData, options);
      break;

    case 'text':
    default:
      const textData = String(item.data);
      contentHtml = renderText(textData, options);
      break;
  }

  // 添加元数据信息
  let metaHtml = '';
  if (item.meta) {
    const metaItems: string[] = [];
    if (item.meta.rows !== undefined) metaItems.push(`Rows: ${item.meta.rows}`);
    if (item.meta.columns !== undefined) metaItems.push(`Columns: ${item.meta.columns}`);
    if (item.meta.format) metaItems.push(`Format: ${item.meta.format}`);

    if (metaItems.length > 0) {
      metaHtml = `<div style="font-size: 12px; color: #888; margin: 10px 0 15px 0; padding: 5px 10px; background: #eee; border-radius: 4px; display: inline-block;">${metaItems.join(' | ')}</div>\n`;
    }
  }

  return `
    <div style="margin: 30px 0; padding: 20px; background: #fafafa; border-radius: 6px; border-left: 4px solid #007bff;">
      <h2 style="font-size: 20px; color: #333; margin: 0 0 10px 0;">${title}</h2>
      ${metaHtml}
      ${contentHtml}
    </div>
  `.trim();
}

/**
 * Email Render Plugin
 */
export const emailRenderPlugin: RenderPlugin = {
  name: 'email-render',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'render',
  mode: 'email',

  async render(
    data: DataResult[],
    config: ExecutableConfig,
    context: RuntimeContext
  ): Promise<RenderResult> {
    console.log(`  [Email Render Plugin] Rendering ${data.length} data items for email`);

    const options: EmailRenderOptions = {
      maxTableRows: 50,
      maxTextLength: 5000
    };

    const timestamp = new Date().toLocaleString();
    const dataItemsHtml = data.map(item => renderDataItem(item, options)).join('\n\n');

    // Email HTML（不使用 DOCTYPE，使用 table 布局）
    const html = `
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(config.report.title || 'Report')}</title>
        <!--[if mso]>
        <style type="text/css">
          table { border-collapse: collapse; }
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; background: #f5f5f5;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          <tr>
            <td style="border-bottom: 2px solid #007bff; padding-bottom: 20px;">
              <h1 style="font-size: 24px; color: #007bff; margin: 0 0 10px 0;">${escapeHtml(config.report.title || 'Report')}</h1>
              <div style="font-size: 13px; color: #666;">
                Generated: ${timestamp} | Data Items: ${data.length}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 30px;">
              ${dataItemsHtml}
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 13px;">
              Generated by Report-Tool | ${timestamp}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `.trim();

    return {
      renderMode: 'email',
      content: html,
      meta: {
        dataCount: data.length,
        generatedAt: new Date().toISOString(),
        options
      }
    };
  }
};
