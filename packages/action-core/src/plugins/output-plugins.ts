/**
 * Output Action Plugins
 *
 * 提供：file_output（将报告保存到本地文件）
 */

import { ActionPlugin, ActionPayload, ActionContext } from '@report-tool/types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * File Output 配置接口
 */
interface FileOutputConfig {
  /** 输出文件路径（支持模板变量，可选扩展名会根据 renderMode 自动添加） */
  path: string;
  /** 文件编码（默认 utf-8） */
  encoding?: BufferEncoding;
  /** 如果文件存在是否覆盖 */
  overwrite?: boolean;
  /** 是否自动添加扩展名（默认 true） */
  autoExtension?: boolean;
}

/**
 * file_output Action Plugin
 *
 * 将渲染后的报告保存到本地文件系统
 */
export const fileOutputPlugin: ActionPlugin = {
  name: 'file-output-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'file_output',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    const config = payload as unknown as FileOutputConfig;
    const { renderResult, runtime } = context;

    // 验证必需参数
    if (!config.path) {
      throw new Error('file_output requires "path" in payload');
    }

    // 验证 renderResult 存在
    if (!renderResult) {
      throw new Error('file_output requires a render result (report content)');
    }

    console.log('');
    console.log('  ========================================');
    console.log('  [file_output] Saving Report to File');
    console.log('  ========================================');
    console.log(`  Path: ${config.path}`);
    console.log(`  Render Mode: ${renderResult.renderMode}`);
    console.log(`  Content Length: ${renderResult.content.length} chars`);

    // 替换模板变量
    let resolvedPath = resolveTemplateVariables(config.path, runtime.dateContext);

    // 自动添加扩展名（如果路径没有扩展名）
    const autoExtension = config.autoExtension !== false;
    if (autoExtension && !path.extname(resolvedPath)) {
      const ext = getFileExtension(renderResult.renderMode);
      resolvedPath += ext;
      console.log(`  Auto-extension: ${ext}`);
    }

    // 解析路径
    let filePath = resolvedPath;
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(process.cwd(), filePath);
    }

    // 确保目录存在
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`  Created directory: ${dir}`);
    } catch {
      // 目录可能已存在
    }

    // 检查文件是否存在
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

    if (fileExists && !config.overwrite) {
      console.log(`  Status: ⚠️  File exists, overwrite=false`);
      console.log('  ========================================');
      console.log('');
      throw new Error(`File already exists: ${filePath}. Set overwrite=true to overwrite.`);
    }

    // 写入文件
    const encoding = config.encoding || 'utf-8';
    await fs.writeFile(filePath, renderResult.content, { encoding });

    console.log(`  Status: ✅ File saved successfully`);
    console.log(`  Absolute Path: ${filePath}`);
    console.log(`  Encoding: ${encoding}`);
    console.log('  ========================================');
    console.log('');
  }
};

/**
 * 解析模板变量
 */
function resolveTemplateVariables(template: string, dateContext: any): string {
  return template
    .replace(/\{\{YYYY\}\}/g, dateContext.YYYY || '')
    .replace(/\{\{YY\}\}/g, dateContext.YY || '')
    .replace(/\{\{MM\}\}/g, dateContext.MM || '')
    .replace(/\{\{DD\}\}/g, dateContext.DD || '')
    .replace(/\{\{YYYYMMDD\}\}/g, dateContext.YYYYMMDD || '')
    .replace(/\{\{YYMMDD\}\}/g, dateContext.YYMMDD || '')
    .replace(/\{\{MMDD\}\}/g, dateContext.MMDD || '')
    .replace(/\{\{rawDate\}\}/g, dateContext.rawDate || '');
}

/**
 * 获取输出相关插件
 */
export function getOutputPlugins(): Map<string, ActionPlugin> {
  return new Map([
    ['file_output', fileOutputPlugin]
  ]);
}

/**
 * 获取文件扩展名
 */
function getFileExtension(renderMode: string): string {
  const extensions: Record<string, string> = {
    'html': '.html',
    'email': '.html',
    'markdown': '.md'
  };
  return extensions[renderMode] || '.html';
}
