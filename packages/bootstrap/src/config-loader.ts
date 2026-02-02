/**
 * Config Loader
 *
 * 从 MongoDB 加载系统配置
 */

import { MongoClient, Db } from 'mongodb';
import { EnvConfig } from '@report-tool/types';

/**
 * 环境配置文档结构
 */
interface EnvConfigDocument {
  _id?: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  updatedAt?: Date;
}

/**
 * MinIO 配置
 */
interface MinioConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
}

/**
 * SMTP 配置
 */
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * 邮件配置
 */
interface MailerConfig {
  type: 'smtp';
  smtp: SmtpConfig;
  defaultFrom: string;
  defaultReplyTo?: string;
}

/**
 * MongoDB 连接缓存
 */
let dbClient: MongoClient | null = null;
let dbInstance: Db | null = null;

/**
 * 获取 MongoDB 客户端
 */
async function getDbClient(dbUri: string, dbName: string): Promise<Db> {
  if (dbInstance && dbClient) {
    return dbInstance;
  }

  console.log(`[Config Loader] Connecting to MongoDB: ${dbName}`);

  dbClient = new MongoClient(dbUri);
  await dbClient.connect();
  dbInstance = dbClient.db(dbName);

  console.log(`[Config Loader] Connected to MongoDB successfully`);
  return dbInstance;
}

/**
 * 关闭 MongoDB 连接
 */
export async function closeDbConnection(): Promise<void> {
  if (dbClient) {
    await dbClient.close();
    dbClient = null;
    dbInstance = null;
  }
}

/**
 * 从 env collection 加载环境配置
 */
async function loadEnvConfigFromDb(db: Db): Promise<Record<string, any>> {
  const collection = db.collection('env');

  console.log('[Config Loader] Loading system configs from env collection...');

  const configs = await collection.find({}).toArray();

  const envMap: Record<string, any> = {};

  for (const config of configs) {
    const envConfig = config as unknown as EnvConfigDocument;
    envMap[envConfig.key] = envConfig.value;
    console.log(`  ✓ Loaded: ${envConfig.key}`);
  }

  console.log(`[Config Loader] Loaded ${Object.keys(envMap).length} system configs`);

  return envMap;
}

/**
 * 从 envMap 构建 MinIO 配置
 */
function buildMinioConfig(envMap: Record<string, any>): Record<string, MinioConfig> {
  // 支持多个 MinIO 实例
  const minioConfigs: Record<string, MinioConfig> = {};

  // 查找所有 MinIO 相关的配置键
  // 格式: MINIO_{NAME}_{PROP}, 例如 MINIO_DEFAULT_ENDPOINT, MINIO_BACKUP_ENDPOINT
  const minioKeys = Object.keys(envMap).filter(k => k.startsWith('MINIO_'));

  const instances = new Set<string>();
  minioKeys.forEach(key => {
    const parts = key.split('_');
    if (parts.length >= 3) {
      instances.add(parts[1].toLowerCase());
    }
  });

  // 构建每个 MinIO 实例的配置
  instances.forEach(instance => {
    const prefix = `MINIO_${instance.toUpperCase()}_`;
    const config: MinioConfig = {
      endpoint: envMap[`${prefix}ENDPOINT`] || 'localhost',
      port: parseInt(envMap[`${prefix}PORT`] || '9000'),
      useSSL: envMap[`${prefix}USE_SSL`] === true || envMap[`${prefix}USE_SSL`] === 'true',
      accessKey: envMap[`${prefix}ACCESS_KEY`] || '',
      secretKey: envMap[`${prefix}SECRET_KEY`] || '',
      region: envMap[`${prefix}REGION`] || 'us-east-1'
    };
    minioConfigs[instance.toLowerCase()] = config;
  });

  // 如果没有配置任何实例，创建默认实例
  if (Object.keys(minioConfigs).length === 0) {
    minioConfigs['default'] = {
      endpoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: '',
      secretKey: '',
      region: 'us-east-1'
    };
  }

  return minioConfigs;
}

/**
 * 从 envMap 构建邮件配置
 */
function buildMailerConfig(envMap: Record<string, any>): MailerConfig {
  return {
    type: 'smtp',
    smtp: {
      host: envMap.SMTP_HOST || 'smtp.example.com',
      port: parseInt(envMap.SMTP_PORT || '587'),
      secure: envMap.SMTP_SECURE === true || envMap.SMTP_SECURE === 'true',
      auth: {
        user: envMap.SMTP_USER || '',
        pass: envMap.SMTP_PASS || ''
      }
    },
    defaultFrom: envMap.MAIL_FROM || 'noreply@example.com',
    defaultReplyTo: envMap.MAIL_REPLY_TO
  };
}

/**
 * 从 MongoDB 加载完整的环境配置
 *
 * @returns EnvConfig
 * @throws {Error} 如果 MongoDB 连接失败或配置缺失
 */
export async function loadEnvConfigFromMongo(): Promise<EnvConfig> {
  // 1. 从环境变量获取 BASE_DB
  const baseDbUri = process.env.BASE_DB;

  if (!baseDbUri) {
    throw new Error('BASE_DB environment variable is required');
  }

  // 2. 解析数据库连接信息
  // MongoDB URI 格式: mongodb://[username:password@]host[:port][/database][?options]
  const dbName = 'report_config'; // 固定使用 report_config 数据库

  // 移除数据库名（如果有的话），统一使用 report_config
  const dbUri = baseDbUri.replace(/\/[^/?]*$/, '') + '/' + dbName;

  // 3. 连接数据库并加载配置
  const db = await getDbClient(dbUri, dbName);

  // 4. 从 env collection 加载所有配置
  const envMap = await loadEnvConfigFromDb(db);

  // 5. 验证必需的配置存在
  const requiredConfigs = [];

  // 验证 MinIO 配置（至少需要一个实例）
  const minioConfigs = buildMinioConfig(envMap);
  if (Object.keys(minioConfigs).length === 0) {
    requiredConfigs.push('MinIO configuration (MINIO_*)');
  }

  // 验证 SMTP 配置
  if (!envMap.SMTP_HOST) {
    requiredConfigs.push('SMTP_HOST');
  }

  if (requiredConfigs.length > 0) {
    throw new Error(`Missing required configurations in env collection: ${requiredConfigs.join(', ')}`);
  }

  // 6. 构建完整的 EnvConfig
  const envConfig: EnvConfig = {
    minio: minioConfigs,
    userConfigDB: {
      uri: dbUri,
      database: dbName,
      collection: 'user_config'
    },
    mailer: buildMailerConfig(envMap),
    mailBackupDB: {
      uri: dbUri,
      database: dbName,
      collection: 'email_bak'
    }
  };

  console.log('[Config Loader] ✅ All required configurations loaded');

  return envConfig;
}
