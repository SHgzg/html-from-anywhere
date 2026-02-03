/**
 * Database Storage Action Plugins
 *
 * 提供：saveToDatabase（将报告保存到 MongoDB）
 */

import { ActionPlugin, ActionPayload, ActionContext } from '@report-tool/types';
import { saveReportToDatabase } from '../storage/mongodb-client-factory';

/**
 * 数据库存储配置接口
 */
interface DatabaseStorageConfig {
  /** 数据库配置名称（预留，未来支持多数据库） */
  dbName?: string;
  /** 集合名称（默认 reports） */
  collection?: string;
  /** 是否包含完整报告内容（默认 true） */
  includeContent?: boolean;
  /** 身份信息（可选） */
  identity?: {
    /** 用户 ID */
    userId?: string;
    /** 用户名 */
    username?: string;
    /** 部门 */
    department?: string;
    /** 其他自定义身份信息 */
    [key: string]: unknown;
  };
}

/**
 * 报告存储记录接口
 */
interface ReportStorageRecord {
  /** 报告元数据 */
  meta: {
    /** 报告标题 */
    title: string;
    /** 渲染模式 */
    renderMode: string;
    /** 报告日期 */
    reportDate: string;
    /** 存储时间 */
    storedAt: Date;
    /** 报告内容长度 */
    contentLength?: number;
  };
  /** 报告内容（可选） */
  content?: string;
  /** 数据源信息 */
  dataSources: Array<{
    title: string;
    tag: string;
    type: string;
  }>;
  /** 身份信息 */
  identity?: {
    userId?: string;
    username?: string;
    department?: string;
    [key: string]: unknown;
  };
  /** 环境信息 */
  environment: {
    hostname?: string;
    platform?: string;
  };
  /** 索引签名，允许额外的字段 */
  [key: string]: unknown;
}

/**
 * saveToDatabase Action Plugin
 *
 * 将报告保存到 MongoDB
 * 自动添加身份、时间等元数据信息
 */
export const saveToDatabasePlugin: ActionPlugin = {
  name: 'save-to-database-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'saveToDatabase',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    const config = payload as unknown as DatabaseStorageConfig;
    const { renderResult, runtime, data } = context;

    // 验证 renderResult 存在
    if (!renderResult) {
      throw new Error('saveToDatabase requires a render result (report content)');
    }

    // 从环境配置获取数据库配置
    const dbConfig = runtime.envConfig.userConfigDB;

    console.log('');
    console.log('  ========================================');
    console.log('  [saveToDatabase] Saving Report to MongoDB');
    console.log('  ========================================');
    console.log(`  Database: ${dbConfig.database}`);
    console.log(`  Collection: ${config.collection || 'reports'}`);
    console.log(`  Render Mode: ${renderResult.renderMode}`);
    console.log(`  Report Date: ${runtime.dateContext.rawDate}`);

    // 构建报告存储记录
    const record: ReportStorageRecord = {
      meta: {
        title: extractTitle(data) || 'Untitled Report',
        renderMode: renderResult.renderMode,
        reportDate: runtime.dateContext.rawDate,
        storedAt: new Date(),
        contentLength: renderResult.content.length
      },
      dataSources: extractDataSources(data),
      environment: {
        hostname: getHostname(),
        platform: process.platform
      }
    };

    // 添加报告内容（如果配置允许）
    if (config.includeContent !== false) {
      record.content = renderResult.content;
      console.log(`  Content: ✅ Included (${renderResult.content.length} chars)`);
    } else {
      console.log(`  Content: ⚠️  Skipped (includeContent=false)`);
    }

    // 添加身份信息（如果提供）
    if (config.identity) {
      record.identity = {
        userId: config.identity.userId,
        username: config.identity.username,
        department: config.identity.department,
        ...config.identity
      };
      console.log(`  Identity: ${record.identity.username || record.identity.userId || 'N/A'}`);
      if (record.identity.department) {
        console.log(`  Department: ${record.identity.department}`);
      }
    }

    // 保存到数据库
    try {
      const collection = config.collection || 'reports';
      const result = await saveReportToDatabase(
        config.dbName || 'default',
        dbConfig,
        collection,
        record
      );

      console.log(`  Status: ✅ Report saved successfully`);
      console.log(`  Inserted ID: ${result.insertedId}`);
      console.log('  ========================================');
      console.log('');
    } catch (error) {
      console.error(`  Status: ❌ Failed to save report`);
      console.error(`  Error: ${(error as Error).message}`);
      console.log('  ========================================');
      console.log('');
      throw error;
    }
  }
};

/**
 * 提取报告标题
 */
function extractTitle(data: import('@report-tool/types').DataResult[]): string | null {
  if (data && data.length > 0) {
    // 尝试从第一个数据项获取标题
    return data[0].title || null;
  }
  return null;
}

/**
 * 提取数据源信息
 */
function extractDataSources(data: import('@report-tool/types').DataResult[]): Array<{
  title: string;
  tag: string;
  type: string;
}> {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map(item => ({
    title: item.title,
    tag: item.tag,
    type: item.meta?.dataType ? String(item.meta.dataType) : 'unknown'
  }));
}

/**
 * 获取主机名
 */
function getHostname(): string {
  return process.env.HOSTNAME || process.env.COMPUTERNAME || 'unknown';
}

/**
 * 获取数据库存储相关插件
 */
export function getDatabaseStoragePlugins(): Map<string, ActionPlugin> {
  return new Map([
    ['saveToDatabase', saveToDatabasePlugin]
  ]);
}
