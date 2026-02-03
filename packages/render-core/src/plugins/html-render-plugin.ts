/**
 * HTML Render Plugin
 *
 * 将数据渲染为 HTML 格式
 */

import { RenderPlugin, DataResult, ExecutableConfig, RuntimeContext, RenderResult } from '@report-tool/types';

/**
 * 渲染配置选项
 */
interface RenderOptions {
  /** 大表格最大行数（超过则截断） */
  maxTableRows?: number;
  /** 大文本最大字符数 */
  maxTextLength?: number;
  /** 是否包含样式 */
  includeStyles?: boolean;
}

/**
 * HTML 转义（防 XSS）
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
 * 渲染表格数据
 */
function renderTable(data: Record<string, unknown>[], options: RenderOptions): string {
  if (!data || data.length === 0) {
    return '<p class="empty-data">No data available</p>';
  }

  const headers = Object.keys(data[0]);
  const maxRows = options.maxTableRows || 1000;
  const displayData = data.slice(0, maxRows);
  const isTruncated = data.length > maxRows;

  let html = '<table class="data-table">\n';

  // 表头
  html += '  <thead>\n    <tr>\n';
  for (const header of headers) {
    html += `      <th>${escapeHtml(header)}</th>\n`;
  }
  html += '    </tr>\n  </thead>\n';

  // 表体
  html += '  <tbody>\n';
  for (const row of displayData) {
    html += '    <tr>\n';
    for (const header of headers) {
      const value = row[header];
      let cellContent: string;

      if (value === null || value === undefined) {
        cellContent = '<span class="null-value">null</span>';
      } else if (typeof value === 'object') {
        cellContent = `<code>${escapeHtml(JSON.stringify(value))}</code>`;
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        cellContent = String(value);
      } else {
        cellContent = escapeHtml(String(value));
      }

      // 数字右对齐，其他左对齐
      const align = (typeof value === 'number') ? 'text-align: right;' : 'text-align: left;';
      html += `      <td style="${align}">${cellContent}</td>\n`;
    }
    html += '    </tr>\n';
  }
  html += '  </tbody>\n';

  // 截断提示
  if (isTruncated) {
    html += `  <tfoot>\n    <tr>\n      <td colspan="${headers.length}" class="truncated-hint">\n`;
    html += `        ... ${data.length} rows total, showing first ${maxRows} rows\n`;
    html += `      </td>\n    </tr>\n  </tfoot>\n`;
  }

  html += '</table>\n';
  return html;
}

/**
 * 渲染图片数据
 */
function renderImage(data: { format: string; encoding: string; data: string }, title: string): string {
  const mimeType = `image/${data.format}`;
  const src = `data:${mimeType};${data.encoding},${data.data}`;

  return `
    <figure class="data-image">
      <img src="${src}" alt="${escapeHtml(title)}" style="max-width: 100%; height: auto;" />
      <figcaption>${escapeHtml(title)}</figcaption>
    </figure>
  `.trim();
}

/**
 * 渲染对象数据
 */
function renderObject(data: Record<string, unknown>, options: RenderOptions): string {
  const entries = Object.entries(data);

  let html = '<dl class="data-object">\n';
  for (const [key, value] of entries) {
    html += '  <dt>' + escapeHtml(key) + '</dt>\n';

    let valueContent: string;
    if (value === null || value === undefined) {
      valueContent = '<span class="null-value">null</span>';
    } else if (typeof value === 'object') {
      valueContent = `<pre><code>${escapeHtml(JSON.stringify(value, null, 2))}</code></pre>`;
    } else if (typeof value === 'boolean') {
      valueContent = `<span class="boolean">${String(value)}</span>`;
    } else if (typeof value === 'number') {
      valueContent = `<span class="number">${String(value)}</span>`;
    } else {
      valueContent = escapeHtml(String(value));
    }

    html += '  <dd>' + valueContent + '</dd>\n';
  }
  html += '</dl>\n';
  return html;
}

/**
 * 渲染文本数据
 */
function renderText(data: string, options: RenderOptions): string {
  const maxLength = options.maxTextLength || 10000;
  const isTruncated = data.length > maxLength;
  const displayText = data.substring(0, maxLength);

  let html = '<pre class="data-text">' + escapeHtml(displayText) + '</pre>\n';

  if (isTruncated) {
    html += `<p class="truncated-hint">... ${data.length} characters total, showing first ${maxLength}</p>\n`;
  }

  return html;
}

/**
 * 渲染数据项
 */
function renderDataItem(item: DataResult, options: RenderOptions): string {
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
    if (item.meta.timestamp) metaItems.push(`Updated: ${item.meta.timestamp}`);

    if (metaItems.length > 0) {
      metaHtml = `<div class="data-meta">${metaItems.join(' | ')}</div>\n`;
    }
  }

  return `
    <section class="data-item" data-type="${dataType}">
      <h2 class="data-title">${title}</h2>
      ${metaHtml}
      <div class="data-content">
        ${contentHtml}
      </div>
    </section>
  `.trim();
}

/**
 * 生成 HTML 样式
 */
function generateStyles(): string {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
        padding: 20px;
      }

      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .report-header {
        border-bottom: 2px solid #007bff;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }

      .report-title {
        font-size: 28px;
        color: #007bff;
        margin-bottom: 10px;
      }

      .report-meta {
        font-size: 14px;
        color: #666;
      }

      .data-item {
        margin: 30px 0;
        padding: 20px;
        background: #fafafa;
        border-radius: 6px;
        border-left: 4px solid #007bff;
      }

      .data-title {
        font-size: 20px;
        color: #333;
        margin-bottom: 10px;
      }

      .data-meta {
        font-size: 12px;
        color: #888;
        margin-bottom: 15px;
        padding: 5px 10px;
        background: #eee;
        border-radius: 4px;
        display: inline-block;
      }

      .data-content {
        margin-top: 15px;
      }

      /* 表格样式 */
      .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 4px;
        overflow: hidden;
      }

      .data-table thead {
        background: #007bff;
        color: white;
      }

      .data-table th,
      .data-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      .data-table th {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;
      }

      .data-table tbody tr:nth-child(even) {
        background: #f8f9fa;
      }

      .data-table tbody tr:hover {
        background: #e9ecef;
      }

      .data-table tfoot {
        background: #fff3cd;
      }

      .data-table tfoot td {
        text-align: center;
        color: #856404;
        font-weight: 500;
      }

      .null-value {
        color: #999;
        font-style: italic;
      }

      /* 图片样式 */
      .data-image {
        margin: 20px 0;
        text-align: center;
      }

      .data-image img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .data-image figcaption {
        margin-top: 10px;
        font-size: 14px;
        color: #666;
        font-style: italic;
      }

      /* 对象样式 */
      .data-object {
        background: white;
        padding: 15px;
        border-radius: 4px;
        border: 1px solid #ddd;
      }

      .data-object dt {
        font-weight: 600;
        color: #007bff;
        margin-top: 10px;
        font-size: 14px;
      }

      .data-object dd {
        margin-left: 20px;
        margin-bottom: 5px;
        font-size: 14px;
      }

      .data-object pre {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
      }

      .boolean {
        color: #28a745;
        font-weight: 600;
      }

      .number {
        color: #dc3545;
        font-weight: 600;
      }

      /* 文本样式 */
      .data-text {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        overflow-x: auto;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        font-size: 13px;
        line-height: 1.5;
      }

      .truncated-hint {
        color: #856404;
        background: #fff3cd;
        padding: 8px;
        border-radius: 4px;
        text-align: center;
        font-size: 13px;
        margin-top: 10px;
      }

      .empty-data {
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }

      .report-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        color: #666;
        font-size: 14px;
      }
    </style>
  `.trim();
}

/**
 * HTML Render Plugin
 */
export const htmlRenderPlugin: RenderPlugin = {
  name: 'html-render',
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

    // 默认渲染选项
    const options: RenderOptions = {
      maxTableRows: 1000,
      maxTextLength: 10000,
      includeStyles: true
    };

    // 生成报告头部
    const styles = options.includeStyles ? generateStyles() : '';
    const timestamp = new Date().toLocaleString();

    // 渲染所有数据项
    const dataItemsHtml = data.map(item => renderDataItem(item, options)).join('\n\n');

    // 生成完整 HTML
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(config.report.title || 'Report')}</title>
        ${styles}
      </head>
      <body>
        <div class="report-container">
          <header class="report-header">
            <h1 class="report-title">${escapeHtml(config.report.title || 'Report')}</h1>
            <div class="report-meta">
              Generated: ${timestamp} |
              Data Items: ${data.length}
            </div>
          </header>

          <main>
            ${dataItemsHtml}
          </main>

          <footer class="report-footer">
            Generated by Report-Tool | ${timestamp}
          </footer>
        </div>
      </body>
      </html>
    `.trim();

    return {
      renderMode: 'html',
      content: html,
      meta: {
        dataCount: data.length,
        generatedAt: new Date().toISOString(),
        options
      }
    };
  }
};
