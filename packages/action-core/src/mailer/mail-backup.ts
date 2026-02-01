/**
 * Mail Backup Service
 *
 * 负责：将发送成功的邮件备份到数据库
 */

import { Db, MongoClient } from 'mongodb';

/**
 * 邮件备份记录
 */
export interface MailBackupRecord {
  /** 邮件 ID (来自 nodemailer) */
  messageId: string;
  /** 发送时间 */
  sentAt: Date;
  /** 收件人 */
  to: string | string[];
  /** 抄送 */
  cc?: string | string[];
  /** 密送 */
  bcc?: string | string[];
  /** 主题 */
  subject: string;
  /** 发件人 */
  from: string;
  /** 邮件内容 (HTML 或 Text) */
  content: string;
  /** 内容类型 */
  contentType: 'html' | 'text';
  /** 报告日期 (来自 RuntimeContext) */
  reportDate?: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 (如果失败) */
  error?: string;
}

/**
 * 邮件备份服务类
 */
export class MailBackupService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collectionName: string;
  private dbName: string;

  constructor(
    private readonly uri: string,
    database: string,
    collection: string = 'bak'
  ) {
    this.dbName = database;
    this.collectionName = collection;
  }

  /**
   * 连接到数据库
   */
  async connect(): Promise<void> {
    if (this.client) {
      return; // 已连接
    }

    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
  }

  /**
   * 备份邮件
   *
   * @param record - 邮件备份记录
   */
  async backup(record: MailBackupRecord): Promise<void> {
    try {
      await this.connect();

      if (!this.db) {
        throw new Error('Database not connected');
      }

      const collection = this.db.collection<MailBackupRecord>(this.collectionName);
      await collection.insertOne(record);

      console.log(`  [Mail Backup] Email backed up to ${this.dbName}.${this.collectionName}`);
    } catch (error) {
      console.error(`  [Mail Backup] Failed to backup email:`, error);
      // 备份失败不影响主流程，只记录错误
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

/**
 * 创建邮件备份服务实例
 *
 * @param config - 备份数据库配置
 * @returns MailBackupService 实例，如果配置不存在则返回 null
 */
export function createMailBackupService(config?: {
  uri: string;
  database: string;
  collection: string;
}): MailBackupService | null {
  if (!config) {
    return null;
  }

  return new MailBackupService(config.uri, config.database, config.collection);
}

/**
 * 全局单例缓存
 */
let globalBackupService: MailBackupService | null = null;

/**
 * 获取全局邮件备份服务实例
 *
 * @param config - 备份数据库配置
 * @returns MailBackupService 实例
 */
export function getMailBackupService(config?: {
  uri: string;
  database: string;
  collection: string;
}): MailBackupService | null {
  if (!config) {
    return null;
  }

  if (!globalBackupService) {
    globalBackupService = new MailBackupService(config.uri, config.database, config.collection);
  }

  return globalBackupService;
}
