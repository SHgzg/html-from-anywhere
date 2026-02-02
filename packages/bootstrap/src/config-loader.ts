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

  // 查询所有配置，按更新时间降序排序
  const configs = await collection
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  console.log('[Config Loader] Found configs:', configs.length);

  const envMap: Record<string, any> = {};

  if (configs.length > 0) {
    const latestConfig = configs[0];

    // 检查是否是结构化配置格式（包含 minio, smtp, mail 等字段）
    if ('minio' in latestConfig || 'smtp' in latestConfig || 'mail' in latestConfig) {
      console.log('[Config Loader] Using structured config format');
      // 直接使用结构化配置
      if (latestConfig.minio) {
        envMap.minio = latestConfig.minio;
        console.log(`  ✓ Loaded minio config`);
      }
      if (latestConfig.smtp) {
        envMap.smtp = latestConfig.smtp;
        console.log(`  ✓ Loaded smtp config`);
      }
      if (latestConfig.mail) {
        envMap.mail = latestConfig.mail;
        console.log(`  ✓ Loaded mail config`);
      }
    } else {
      // 使用 key-value 格式（旧格式）
      console.log('[Config Loader] Using key-value config format');
      for (const config of configs) {
        const doc = config as unknown as EnvConfigDocument;
        envMap[doc.key] = doc.value;
        console.log(`  ✓ Loaded: ${doc.key}`);
      }
    }
  }

  console.log(`[Config Loader] Loaded ${Object.keys(envMap).length} system configs`);

  // 打印读取后的配置
  console.log('[Config Loader] Loaded envMap:', JSON.stringify(envMap, null, 2));

  return envMap;
}

/**
 * 从 envMap 构建 MinIO 配置
 * 优先使用结构化配置（envMap.minio），回退到扁平化环境变量格式
 */
function buildMinioConfig(envMap: Record<string, any>): Record<string, MinioConfig> {
  const minioConfigs: Record<string, MinioConfig> = {};

  // 优先使用结构化配置
  if (envMap.minio && typeof envMap.minio === 'object') {
    console.log('[Config Loader] Building MinIO config from structured data');

    Object.entries(envMap.minio).forEach(([instanceName, instanceConfig]: [string, any]) => {
      minioConfigs[instanceName] = {
        endpoint: instanceConfig.endpoint || 'localhost',
        port: parseInt(instanceConfig.port || '9000'),
        useSSL: instanceConfig.useSSL === true || instanceConfig.useSSL === 'true',
        accessKey: instanceConfig.accessKey || '',
        secretKey: instanceConfig.secretKey || '',
        region: instanceConfig.region || 'us-east-1'
      };
      console.log(`  ✓ Built MinIO instance: ${instanceName}`);
    });
  } else {
    // 回退到扁平化环境变量格式（向后兼容）
    console.log('[Config Loader] Building MinIO config from env vars (legacy)');

    const minioKeys = Object.keys(envMap).filter(k => k.startsWith('MINIO_'));
    const instances = new Set<string>();

    minioKeys.forEach(key => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        instances.add(parts[1].toLowerCase());
      }
    });

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
      minioConfigs[instance] = config;
    });
  }

  // 如果没有配置任何实例，创建默认实例
  if (Object.keys(minioConfigs).length === 0) {
    console.log('[Config Loader] No MinIO config found, using defaults');
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
 * 优先使用结构化配置（envMap.smtp, envMap.mail），回退到扁平化环境变量格式
 */
function buildMailerConfig(envMap: Record<string, any>): MailerConfig {
  // 优先使用结构化配置
  if (envMap.smtp && envMap.mail) {
    console.log('[Config Loader] Building mailer config from structured data');

    return {
      type: 'smtp',
      smtp: {
        host: envMap.smtp.host || 'smtp.example.com',
        port: parseInt(envMap.smtp.port || '587'),
        secure: envMap.smtp.secure === true || envMap.smtp.secure === 'true',
        auth: {
          user: envMap.smtp.auth?.user || '',
          pass: envMap.smtp.auth?.pass || ''
        }
      },
      defaultFrom: envMap.mail.from || 'noreply@example.com',
      defaultReplyTo: envMap.mail.replyTo
    };
  }

  // 回退到扁平化环境变量格式（向后兼容）
  console.log('[Config Loader] Building mailer config from env vars (legacy)');

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
  let dbUri = baseDbUri;

  // 检查是否有数据库路径或查询参数
  const hasPathOrQuery = /\/[^?]/.test(baseDbUri);

  if (hasPathOrQuery) {
    // 移除路径和查询参数，保留到主机端口部分
    const url = new URL(baseDbUri);
    // 重建 URI，移除 pathname 和 search
    dbUri = `${url.protocol}//${url.host}${url.username || url.password ? `${url.username}:${url.password}@` : ''}`;
  }

  // 添加数据库名
  dbUri = dbUri.endsWith('/') ? dbUri + dbName : dbUri + '/' + dbName;

  // 3. 连接数据库并加载配置
  const db = await getDbClient(dbUri, dbName);

  // 4. 从 env collection 加载所有配置
  const envMap = await loadEnvConfigFromDb(db);

  // 5. 验证必需的配置存在
  const requiredConfigs = [];

  // 验证 SMTP 配置（支持结构化和扁平化格式）
  if (!envMap.smtp?.host && !envMap.SMTP_HOST) {
    requiredConfigs.push('SMTP configuration (smtp.host or SMTP_HOST)');
  }

  // 验证 MinIO 配置（至少需要一个实例）
  const minioConfigs = buildMinioConfig(envMap);
  if (Object.keys(minioConfigs).length === 0) {
    requiredConfigs.push('MinIO configuration (minio.* or MINIO_*)');
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

/**
 * User Config 文档结构
 */
export interface UserConfigDocument {
  _id?: string;
  name: string;
  config: {
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
  };
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 从 MongoDB 加载 User Config
 *
 * @param configName - 配置名称（可选，默认加载活跃配置）
 * @returns UserConfigDocument
 * @throws {Error} 如果 MongoDB 连接失败或配置不存在
 */
export async function loadUserConfigFromMongo(configName?: string): Promise<UserConfigDocument> {
  const baseDbUri = process.env.BASE_DB;

  if (!baseDbUri) {
    throw new Error('BASE_DB environment variable is required');
  }

  const dbName = 'report_config';
  const dbUri = baseDbUri.replace(/\/[^/?]*$/, '') + '/' + dbName;

  console.log('[User Config Loader] Connecting to MongoDB...');
  const client = new MongoClient(dbUri);
  await client.connect();
  console.log('[User Config Loader] Connected to MongoDB successfully');

  const db = client.db(dbName);
  const collection = db.collection('user_config');

  let query: Record<string, unknown> = {};

  if (configName) {
    query.name = configName;
    console.log(`[User Config Loader] Loading config: ${configName}`);
  } else {
    // 加载活跃的配置
    query.active = true;
    console.log('[User Config Loader] Loading active config...');
  }

  const configDoc = await collection.findOne(query as any);

  if (!configDoc) {
    await client.close();
    throw new Error(configName
      ? `User config "${configName}" not found`
      : 'No active user config found');
  }

  await client.close();

  console.log('[User Config Loader] ✅ Config loaded successfully');

  return configDoc as unknown as UserConfigDocument;
}
