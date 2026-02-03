/**
 * Template Enhance Plugin
 *
 * 提供：template（模板变量替换）
 *
 * 将配置中的 {{YYYY}}, {{MM}}, {{DD}} 等模板变量替换为实际日期值
 */

import { EnhancePlugin, UserConfig, RuntimeContext } from '@report-tool/types';

/**
 * 模板变量替换配置接口
 */
interface TemplateConfig {
  /** 模板变量映射 */
  variables?: Record<string, string>;
}

/**
 * template Enhance Plugin
 *
 * 替换配置中的所有模板变量为实际值
 */
export const templateEnhancePlugin: EnhancePlugin = {
  name: 'template-enhance',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'enhance',

  apply(userConfig: UserConfig, context: RuntimeContext): UserConfig {
    const { dateContext } = context;

    console.log('');
    console.log('  ========================================');
    console.log('  [template] Replacing Template Variables');
    console.log('  ========================================');
    console.log(`  Date Context: ${dateContext.YYYY}-${dateContext.MM}-${dateContext.DD}`);

    const enhancedConfig = replaceTemplateVariables(userConfig, dateContext) as UserConfig;

    console.log(`  Status: ✅ Template variables replaced`);
    console.log('  ========================================');
    console.log('');

    return enhancedConfig;
  }
};

/**
 * 递归替换对象中的所有模板变量
 *
 * 支持的模板变量：
 * - {{YYYY}}: 4位年份
 * - {{YY}}: 2位年份
 * - {{MM}}: 月份
 * - {{DD}}: 日期
 * - {{YYYYMMDD}}: 完整日期（YYYYMMDD）
 * - {{YYMMDD}}: 完整日期（YYMMDD）
 * - {{MMDD}}: 月日（MMDD）
 * - {{rawDate}}: 原始日期（YYYY-MM-DD）
 */
function replaceTemplateVariables(obj: unknown, dateContext: RuntimeContext['dateContext']): unknown {
  // 字符串：直接替换
  if (typeof obj === 'string') {
    return replaceStringVariables(obj, dateContext);
  }

  // 数组：递归处理每个元素
  if (Array.isArray(obj)) {
    return obj.map(item => replaceTemplateVariables(item, dateContext));
  }

  // 对象：递归处理每个属性
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceTemplateVariables(value, dateContext);
    }
    return result;
  }

  // 其他类型（数字、布尔、null）：直接返回
  return obj;
}

/**
 * 替换字符串中的模板变量
 */
function replaceStringVariables(str: string, dateContext: RuntimeContext['dateContext']): string {
  return str
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
 * 获取模板相关插件
 */
export function getTemplatePlugins(): Map<string, EnhancePlugin> {
  return new Map([
    ['template', templateEnhancePlugin]
  ]);
}
