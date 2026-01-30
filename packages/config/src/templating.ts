/**
 * Config Templating
 *
 * 负责配置中的模板变量替换
 */

import { DateContext } from '@report-tool/types';

/**
 * 替换配置中的模板变量
 *
 * 支持的变量格式：
 * - {{YYYY}} - 4位年份
 * - {{YY}} - 2位年份
 * - {{MM}} - 月份
 * - {{DD}} - 日期
 * - {{YYYYMMDD}} - 完整日期
 * - {{rawDate}} - YYYY-MM-DD 格式
 *
 * @param config - 原始配置对象
 * @param dateContext - 日期上下文
 * @returns 替换后的配置
 */
export function replaceTemplateVariables<T>(config: T, dateContext: DateContext): T {
  if (config === null || config === undefined) {
    return config;
  }

  // 处理字符串
  if (typeof config === 'string') {
    return replaceVariablesInString(config, dateContext) as T;
  }

  // 处理数组
  if (Array.isArray(config)) {
    return config.map(item => replaceTemplateVariables(item, dateContext)) as T;
  }

  // 处理对象
  if (typeof config === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      result[key] = replaceTemplateVariables(value, dateContext);
    }
    return result as T;
  }

  return config;
}

/**
 * 替换字符串中的变量
 *
 * @param str - 原始字符串
 * @param dateContext - 日期上下文
 * @returns 替换后的字符串
 */
function replaceVariablesInString(str: string, dateContext: DateContext): string {
  return str
    .replace(/\{\{YYYY\}\}/g, dateContext.YYYY)
    .replace(/\{\{YY\}\}/g, dateContext.YY)
    .replace(/\{\{MM\}\}/g, dateContext.MM)
    .replace(/\{\{DD\}\}/g, dateContext.DD)
    .replace(/\{\{YYYYMMDD\}\}/g, dateContext.YYYYMMDD)
    .replace(/\{\{YYMMDD\}\}/g, dateContext.YYMMDD)
    .replace(/\{\{MMDD\}\}/g, dateContext.MMDD)
    .replace(/\{\{rawDate\}\}/g, dateContext.rawDate);
}
