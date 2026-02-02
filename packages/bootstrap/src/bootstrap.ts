/**
 * Bootstrap Module
 *
 * 负责：加载 .env、连接 DB、构建 RuntimeContext、初始化 Registry
 */

import { RuntimeContext, EnvConfig, DateContext, CliArgs } from '@report-tool/types';
import { createRegistries, lockRegistries, type Registries } from './registry-factory';
import { parseCliArgs as parseCliArgsInternal, showHelp, showVersion } from './cli-parser';
import { loadEnvConfigFromMongo } from './config-loader';
import { getAllMockDataPlugins } from '@report-tool/data-core';
import { htmlRenderPlugin } from '@report-tool/render-core';
import { getAllMockActionPlugins, getNotificationPlugins, getStoragePlugins } from '@report-tool/action-core';
import type { DataSourceType } from '@report-tool/types';

/**
 * Bootstrap 主函数
 *
 * 负责初始化系统运行时上下文
 *
 * @returns 完整的 RuntimeContext
 * @throws {Error} 如果 CLI 参数解析失败或需要退出程序
 */
export async function bootstrap(): Promise<RuntimeContext> {
  // 0. 解析 CLI 参数（最先执行，因为可能需要显示帮助/版本信息）
  const parseResult = parseCliArgsInternal();

  // 处理帮助信息
  if (parseResult.showHelp) {
    showHelp();
    process.exit(0);
  }

  // 处理版本信息
  if (parseResult.showVersion) {
    showVersion();
    process.exit(0);
  }

  // 处理解析错误
  if (parseResult.errors.length > 0) {
    console.error('Errors:');
    parseResult.errors.forEach(error => console.error(`  ❌ ${error}`));
    console.error('\nUse --help for usage information');
    throw new Error('CLI argument parsing failed');
  }

  console.log('[Bootstrap] Starting...');

  // 1. 创建 Registry 实例
  console.log('[Bootstrap] Creating registries...');
  const registries = createRegistries();

  // 2. 注册 Mock 插件（用于演示）
  console.log('[Bootstrap] Registering mock plugins...');
  registerMockPlugins(registries);

  // 3. 加载环境配置
  console.log('[Bootstrap] Loading environment config...');
  const envConfig = await loadEnvConfig();

  // 4. 使用已解析的 CLI 参数
  const cliArgs = parseResult.args;

  // 5. 构建日期上下文
  console.log('[Bootstrap] Building date context...');
  const dateContext = buildDateContext(cliArgs.date);

  // 6. 锁定所有 Registry（防止运行期注册）
  console.log('[Bootstrap] Locking registries...');
  lockRegistries(registries);

  // 7. 构建 RuntimeContext
  const runtime: RuntimeContext = {
    envConfig,
    dateContext,
    cliArgs,
    registries
  };

  console.log('[Bootstrap] Complete');
  return runtime;
}

/**
 * 加载环境配置
 *
 * 从 MongoDB 的 env collection 中获取配置
 */
async function loadEnvConfig(): Promise<EnvConfig> {
  // 从 MongoDB 加载生产配置
  return await loadEnvConfigFromMongo();
}

/**
 * 构建日期上下文
 *
 * @param dateInput - 日期输入（YYYY-MM-DD 格式）
 * @returns DateContext
 */
function buildDateContext(dateInput?: string): DateContext {
  // 如果没有提供日期，使用当前日期
  const date = dateInput
    ? new Date(dateInput)
    : new Date();

  const rawDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const [year, month, day] = rawDate.split('-');

  return {
    rawDate,
    YYYY: year,
    YY: year.slice(-2),
    MM: month,
    DD: day,
    YYYYMMDD: `${year}${month}${day}`,
    YYMMDD: `${year.slice(-2)}${month}${day}`,
    MMDD: `${month}${day}`
  };
}

/**
 * 注册 Mock 插件
 *
 * 用于演示和测试
 */
function registerMockPlugins(registries: Registries): void {
  // 注册 Data 插件
  const dataPlugins = getAllMockDataPlugins();
  dataPlugins.forEach((plugin: any, type: any) => {
    registries.dataRegistry.register(type as DataSourceType, plugin);
    console.log(`  ✓ Registered Data plugin: ${plugin.name} (${type})`);
  });

  // 注册 Render 插件
  registries.renderRegistry.register('html', htmlRenderPlugin);
  console.log(`  ✓ Registered Render plugin: ${htmlRenderPlugin.name} (html)`);

  // 注册 Mock Action 插件
  const actionPlugins = getAllMockActionPlugins();
  actionPlugins.forEach((plugin: any, type: any) => {
    registries.actionRegistry.register(type, plugin);
    console.log(`  ✓ Registered Action plugin: ${plugin.name} (${type})`);
  });

  // 注册通知 Action 插件
  const notificationPlugins = getNotificationPlugins();
  notificationPlugins.forEach((plugin: any, type: any) => {
    registries.actionRegistry.register(type, plugin);
    console.log(`  ✓ Registered Action plugin: ${plugin.name} (${type})`);
  });

  // 注册存储 Action 插件
  const storagePlugins = getStoragePlugins();
  storagePlugins.forEach((plugin: any, type: any) => {
    registries.actionRegistry.register(type, plugin);
    console.log(`  ✓ Registered Action plugin: ${plugin.name} (${type})`);
  });
}
