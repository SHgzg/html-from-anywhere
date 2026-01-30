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

export interface EnvConfig {
  minio: Record<string, MinioConnectionConfig>;
  userConfigDB: {
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
