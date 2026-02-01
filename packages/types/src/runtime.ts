/**
 * RuntimeContext - 启动阶段构建完成的只读上下文
 * 包含了程序运行所需的全部环境信息
 */

import { Registries } from './registries';

export interface DateContext {
  rawDate: string;          // YYYY-MM-DD
  YYYY: string;
  YY: string;
  MM: string;
  DD: string;
  YYYYMMDD: string;
  YYMMDD: string;
  MMDD: string;
}

export interface MinioConnectionConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region?: string;
  port?: number;
  useSSL?: boolean;
}

/**
 * 邮件传输配置
 */
export interface MailerConfig {
  /** 邮件服务类型 */
  type: 'smtp' | 'sendmail' | 'ses' | 'mailgun' | 'sparkpost';

  /** SMTP 配置 */
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };

  /** 默认发件人 */
  defaultFrom?: string;

  /** 默认回复地址 */
  defaultReplyTo?: string;
}

export interface EnvConfig {
  minio: Record<string, MinioConnectionConfig>;
  userConfigDB: {
    uri: string;
    database: string;
    collection: string;
  };
  /** 邮件传输配置 */
  mailer: MailerConfig;
  /** 邮件备份配置（使用同一数据库的 bak collection） */
  mailBackupDB?: {
    uri: string;
    database: string;
    collection: string;
  };
}

export interface RuntimeContext {
  envConfig: EnvConfig;
  dateContext: DateContext;
  cliArgs: CliArgs;

  // Registry 只读，Bootstrap 后不可修改
  readonly registries: Registries;
}

export interface CliArgs {
  reportId?: string;
  configPath?: string;
  date?: string;
  [key: string]: unknown;
}
