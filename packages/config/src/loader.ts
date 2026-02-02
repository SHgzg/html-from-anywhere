/**
 * Config Loader
 *
 * 负责从文件或 MongoDB 加载配置
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface UserConfig {
  report?: {
    title?: string;
    data?: unknown[];
  };
  data?: Array<{
    title: string;
    tag: string;
    source: unknown;
    enhance?: string;
  }>;
  actions?: Array<{
    type: string;
    on: 'data_ready' | 'report_ready' | 'report_archived';
    renderMode?: 'html' | 'email';
    spec?: Record<string, unknown>;
  }>;
  [key: string]: unknown;
}

/**
 * 从 MongoDB 加载配置
 *
 * @param configName - 配置名称（可选）
 * @returns UserConfig
 */
export async function loadConfigFromMongo(configName?: string): Promise<UserConfig> {
  // 动态导入避免循环依赖
  const bootstrap = await import('@report-tool/bootstrap');
  const loadUserConfigFromMongo = bootstrap.loadUserConfigFromMongo as any;

  const configDoc = await loadUserConfigFromMongo(configName);

  return configDoc.config as UserConfig;
}

/**
 * 从 JSON 文件加载配置
 *
 * @param configPath - 配置文件路径
 * @returns UserConfig
 * @throws {Error} 如果文件不存在或 JSON 格式错误
 */
export function loadConfigFromFile(configPath: string): UserConfig {
  // 尝试多个路径
  const possiblePaths = [
    resolve(process.cwd(), configPath),  // 当前工作目录
    resolve(process.cwd(), '../../', configPath),  // 从 apps/report-cli 到项目根目录
    resolve(__dirname, '../../', configPath)  // 从包目录到项目根目录
  ];

  let resolvedPath = '';
  let lastError: Error | null = null;

  for (const path of possiblePaths) {
    try {
      const fileContent = readFileSync(path, 'utf-8');
      const config = JSON.parse(fileContent) as UserConfig;

      console.log(`[Config Loader] Loading config from: ${path}`);
      console.log(`[Config Loader] Config loaded successfully`);
      return config;
    } catch (error) {
      lastError = error as Error;
      // Continue to next path
    }
  }

  // 所有路径都失败
  if (lastError instanceof SyntaxError) {
    throw new Error(`Invalid JSON in config file: ${configPath}`);
  }
  throw new Error(`Failed to load config file: ${configPath} (tried: ${possiblePaths.join(', ')})`);
}

/**
 * 验证配置
 *
 * @param config - UserConfig
 * @returns 是否有效
 */
export function validateConfig(config: UserConfig): boolean {
  // 基础验证
  if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
    console.warn('[Config Loader] Warning: No data sources configured');
  }

  if (!config.actions || !Array.isArray(config.actions) || config.actions.length === 0) {
    console.warn('[Config Loader] Warning: No actions configured');
  }

  // 验证 data 项
  config.data?.forEach((item, index) => {
    if (!item.title) {
      throw new Error(`Data item at index ${index} is missing 'title'`);
    }
    if (!item.tag) {
      throw new Error(`Data item "${item.title}" is missing 'tag'`);
    }
    if (!item.source) {
      throw new Error(`Data item "${item.title}" is missing 'source'`);
    }
  });

  // 验证 action 项
  config.actions?.forEach((action, index) => {
    if (!action.type) {
      throw new Error(`Action at index ${index} is missing 'type'`);
    }
    if (!action.on) {
      throw new Error(`Action "${action.type}" is missing 'on' event`);
    }
    if (!['data_ready', 'report_ready', 'report_archived'].includes(action.on)) {
      throw new Error(`Action "${action.type}" has invalid 'on' event: ${action.on}`);
    }
  });

  return true;
}
