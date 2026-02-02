/**
 * Test MongoDB User Config Loading
 *
 * 测试从 MongoDB user_config collection 加载配置
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// 加载 .env
dotenv.config();

const LOCAL_DB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'report_config';

/**
 * 初始化测试用户配置到 MongoDB
 */
async function setupTestUserConfig(): Promise<void> {
  console.log('\n=== Setting up test user config in MongoDB ===\n');

  const client = new MongoClient(LOCAL_DB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection('user_config');

    // 清空现有数据
    await collection.deleteMany({});
    console.log('✓ Cleared existing data from user_config collection');

    // 插入测试用户配置
    const testUserConfig = {
      name: 'test-report',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {
        report: {
          title: 'Test Report - {{YYYY}}-{{MM}}-{{DD}}',
          data: {
            author: 'Test User',
            version: '1.0.0'
          }
        },
        data: [
          {
            title: 'Sales Data',
            tag: 'inline',
            source: {
              data: [
                { id: 1, product: 'Product A', sales: 1000 },
                { id: 2, product: 'Product B', sales: 1500 },
                { id: 3, product: 'Product C', sales: 2000 }
              ]
            }
          },
          {
            title: 'User Metrics',
            tag: 'https',
            source: {
              url: 'https://api.example.com/metrics?date={{YYYY}}{{MM}}{{DD}}',
              method: 'GET'
            }
          },
          {
            title: 'Local File',
            tag: 'file',
            source: {
              path: './data/sample.json'
            }
          }
        ],
        actions: [
          {
            type: 'log',
            on: 'data_ready',
            spec: {
              level: 'info'
            }
          },
          {
            type: 'file_output',
            on: 'report_ready',
            spec: {
              path: './output/report-{{YYYY}}{{MM}}{{DD}}.html'
            }
          },
          {
            type: 'syncToMinio',
            on: 'report_ready',
            spec: {
              instance: 'tsd_check',
              bucket: 'reports',
              key: 'reports/{{YYYY}}/{{MM}}/{{DD}}/report.html'
            }
          },
          {
            type: 'sendEmail',
            on: 'report_ready',
            renderMode: 'html',
            spec: {
              to: 'test@example.com',
              subject: 'Test Report for {{YYYY}}{{MM}}{{DD}}'
            }
          }
        ]
      }
    };

    await collection.insertOne(testUserConfig);
    console.log('✓ Inserted test user config: test-report');

    // 验证数据
    const count = await collection.countDocuments();
    console.log(`✓ Total documents in user_config collection: ${count}`);

    console.log('\n=== Test user config setup complete ===\n');

  } finally {
    await client.close();
  }
}

/**
 * 测试配置加载
 */
async function testConfigLoading(): Promise<void> {
  console.log('\n=== Testing user config loading ===\n');

  try {
    // 动态导入
    const { loadUserConfigFromMongo } = await import('../packages/bootstrap/dist/config-loader');

    // 加载活跃配置
    const configDoc = await loadUserConfigFromMongo();

    console.log('\n✅ User config loaded successfully!\n');

    // 显示加载的配置
    console.log('=== Loaded User Config ===\n');
    console.log('Config Name:', configDoc.name);
    console.log('Active:', configDoc.active);
    console.log('Report Title:', configDoc.config.report?.title);
    console.log('Data Items:', configDoc.config.data?.length);
    console.log('Actions:', configDoc.config.actions?.length);

    console.log('\nData Items:');
    configDoc.config.data?.forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item.title} (${item.tag})`);
    });

    console.log('\nActions:');
    configDoc.config.actions?.forEach((action: any, index: number) => {
      console.log(`  ${index + 1}. ${action.type} on ${action.on}`);
    });

    console.log('\n=== User config loading test PASSED ===\n');

  } catch (error) {
    console.error('\n❌ User config loading FAILED!\n');
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
    await setupTestUserConfig();

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
