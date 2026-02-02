/**
 * Test MongoDB Configuration Loading
 *
 * 用于测试从本地 MongoDB 加载系统配置
 */

import { MongoClient, Db } from 'mongodb';
import { loadEnvConfigFromMongo } from '../packages/bootstrap/src/config-loader';
import * as dotenv from 'dotenv';

// 加载 .env
dotenv.config();

const LOCAL_DB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'report_config';

/**
 * 初始化测试数据到 MongoDB
 */
async function setupTestData(): Promise<void> {
  console.log('\n=== Setting up test data in MongoDB ===\n');

  const client = new MongoClient(LOCAL_DB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection('env');

    // 清空现有数据
    await collection.deleteMany({});
    console.log('✓ Cleared existing data from env collection');

    // 插入测试配置数据
    const testConfigs = [
      // MinIO 默认实例
      {
        key: 'MINIO_DEFAULT_ENDPOINT',
        value: 'localhost',
        type: 'string',
        description: 'MinIO default instance endpoint',
        updatedAt: new Date()
      },
      {
        key: 'MINIO_DEFAULT_PORT',
        value: 9000,
        type: 'number',
        description: 'MinIO default instance port',
        updatedAt: new Date()
      },
      {
        key: 'MINIO_DEFAULT_USE_SSL',
        value: false,
        type: 'boolean',
        description: 'MinIO default instance SSL',
        updatedAt: new Date()
      },
      {
        key: 'MINIO_DEFAULT_ACCESS_KEY',
        value: 'minioadmin',
        type: 'string',
        description: 'MinIO default instance access key',
        updatedAt: new Date()
      },
      {
        key: 'MINIO_DEFAULT_SECRET_KEY',
        value: 'minioadmin',
        type: 'string',
        description: 'MinIO default instance secret key',
        updatedAt: new Date()
      },
      {
        key: 'MINIO_DEFAULT_REGION',
        value: 'us-east-1',
        type: 'string',
        description: 'MinIO default instance region',
        updatedAt: new Date()
      },

      // SMTP 配置
      {
        key: 'SMTP_HOST',
        value: 'smtp.example.com',
        type: 'string',
        description: 'SMTP server host',
        updatedAt: new Date()
      },
      {
        key: 'SMTP_PORT',
        value: 587,
        type: 'number',
        description: 'SMTP server port',
        updatedAt: new Date()
      },
      {
        key: 'SMTP_SECURE',
        value: false,
        type: 'boolean',
        description: 'SMTP secure connection',
        updatedAt: new Date()
      },
      {
        key: 'SMTP_USER',
        value: 'test@example.com',
        type: 'string',
        description: 'SMTP username',
        updatedAt: new Date()
      },
      {
        key: 'SMTP_PASS',
        value: 'testpass123',
        type: 'string',
        description: 'SMTP password',
        updatedAt: new Date()
      },

      // 邮件配置
      {
        key: 'MAIL_FROM',
        value: 'noreply@example.com',
        type: 'string',
        description: 'Default from address',
        updatedAt: new Date()
      },
      {
        key: 'MAIL_REPLY_TO',
        value: 'support@example.com',
        type: 'string',
        description: 'Default reply-to address',
        updatedAt: new Date()
      }
    ];

    await collection.insertMany(testConfigs);
    console.log(`✓ Inserted ${testConfigs.length} test configurations`);

    // 验证数据
    const count = await collection.countDocuments();
    console.log(`✓ Total documents in env collection: ${count}`);

    console.log('\n=== Test data setup complete ===\n');

  } finally {
    await client.close();
  }
}

/**
 * 测试配置加载
 */
async function testConfigLoading(): Promise<void> {
  console.log('\n=== Testing configuration loading ===\n');

  try {
    // 临时设置环境变量指向本地 MongoDB
    const originalBaseDb = process.env.BASE_DB;
    process.env.BASE_DB = LOCAL_DB_URI;

    const config = await loadEnvConfigFromMongo();

    console.log('\n✅ Configuration loaded successfully!\n');

    // 显示加载的配置
    console.log('=== Loaded Configuration ===\n');

    console.log('MinIO Configs:');
    Object.entries(config.minio).forEach(([name, minio]: [string, any]) => {
      console.log(`  [${name}]`);
      console.log(`    endpoint: ${minio.endpoint}`);
      console.log(`    port: ${minio.port}`);
      console.log(`    useSSL: ${minio.useSSL}`);
      console.log(`    accessKey: ${minio.accessKey}`);
      console.log(`    region: ${minio.region}`);
    });

    console.log('\nMailer Config:');
    console.log(`  type: ${config.mailer.type}`);
    console.log(`  smtp.host: ${config.mailer.smtp?.host || 'N/A'}`);
    console.log(`  smtp.port: ${config.mailer.smtp?.port || 'N/A'}`);
    console.log(`  smtp.secure: ${config.mailer.smtp?.secure || 'N/A'}`);
    console.log(`  smtp.user: ${config.mailer.smtp?.auth?.user || 'N/A'}`);
    console.log(`  defaultFrom: ${config.mailer.defaultFrom || 'N/A'}`);
    console.log(`  defaultReplyTo: ${config.mailer.defaultReplyTo || 'N/A'}`);

    console.log('\nUser Config DB:');
    console.log(`  uri: ${config.userConfigDB?.uri || 'N/A'}`);
    console.log(`  database: ${config.userConfigDB?.database || 'N/A'}`);
    console.log(`  collection: ${config.userConfigDB?.collection || 'N/A'}`);

    console.log('\nMail Backup DB:');
    console.log(`  uri: ${config.mailBackupDB?.uri || 'N/A'}`);
    console.log(`  database: ${config.mailBackupDB?.database || 'N/A'}`);
    console.log(`  collection: ${config.mailBackupDB?.collection || 'N/A'}`);

    console.log('\n=== Configuration loading test PASSED ===\n');

    // 恢复原始环境变量
    if (originalBaseDb) {
      process.env.BASE_DB = originalBaseDb;
    } else {
      delete process.env.BASE_DB;
    }

  } catch (error) {
    console.error('\n❌ Configuration loading FAILED!\n');
    console.error(error);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 1. 设置测试数据
    await setupTestData();

    // 2. 测试配置加载
    await testConfigLoading();

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
main();
