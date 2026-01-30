/**
 * Mock Data Plugins
 *
 * 用于演示和测试的 Mock 数据插件
 */

import { DataPlugin, DataItemConfig, RuntimeContext, DataResult, DataSourceType } from '@report-tool/types';

/**
 * File Data Plugin
 */
export const fileDataPlugin: DataPlugin = {
  name: 'mock-file-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'file',

  validate(config: DataItemConfig): boolean {
    return typeof config.source === 'string';
  },

  async fetch(config: DataItemConfig, context: RuntimeContext): Promise<DataResult> {
    const filePath = config.source as string;

    // Mock: 返回模拟数据
    console.log(`  [File Plugin] Reading: ${filePath}`);

    return {
      title: config.title,
      tag: 'file',
      data: {
        mock: true,
        file: filePath,
        content: `Mock file content from ${filePath}`
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * HTTPS Data Plugin
 */
export const httpsDataPlugin: DataPlugin = {
  name: 'mock-https-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'https',

  validate(config: DataItemConfig): boolean {
    return typeof config.source === 'string' &&
           (config.source.startsWith('http://') || config.source.startsWith('https://'));
  },

  async fetch(config: DataItemConfig, context: RuntimeContext): Promise<DataResult> {
    const url = config.source as string;

    // Mock: 返回模拟数据
    console.log(`  [HTTPS Plugin] Fetching: ${url}`);

    return {
      title: config.title,
      tag: url,
      data: {
        mock: true,
        url,
        content: `Mock HTTP response from ${url}`
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Inline Data Plugin
 */
export const inlineDataPlugin: DataPlugin = {
  name: 'mock-inline-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'inline',

  validate(config: DataItemConfig): boolean {
    return true; // Always valid
  },

  async fetch(config: DataItemConfig, context: RuntimeContext): Promise<DataResult> {
    // Mock: 返回模拟数据
    console.log(`  [Inline Plugin] Processing: ${config.title}`);

    return {
      title: config.title,
      tag: 'inline',
      data: {
        mock: true,
        inline: true,
        content: config.source
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * 获取所有 Mock Data 插件
 */
export function getAllMockDataPlugins(): Map<DataSourceType, DataPlugin> {
  return new Map([
    ['file', fileDataPlugin],
    ['https', httpsDataPlugin],
    ['inline', inlineDataPlugin]
  ]);
}
