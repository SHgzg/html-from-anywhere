/**
 * Test Database Storage Action Plugin
 *
 * 测试将报告保存到 MongoDB 的功能
 */

import { ActionRegistry } from '../packages/action-core/dist/registry';
import { executeActions } from '../packages/action-core/dist/executor';
import { saveToDatabasePlugin } from '../packages/action-core/dist/plugins/database-storage-plugins';
import { RuntimeContext, DataResult, ActionConfig } from '@report-tool/types';
import { MongoClient, Db } from 'mongodb';

/**
 * 创建测试数据
 */
function createTestData(): DataResult[] {
  return [
    {
      title: 'Sales Report - Daily Summary',
      tag: 'inline',
      data: [
        { date: '2025-01-15', product: 'Laptop', quantity: 10, revenue: 12000 },
        { date: '2025-01-15', product: 'Mouse', quantity: 50, revenue: 1250 }
      ],
      meta: {
        dataType: 'table',
        timestamp: new Date().toISOString()
      }
    }
  ];
}

/**
 * 创建测试渲染结果
 */
function createTestRenderResult() {
  return {
    renderMode: 'html' as const,
    content: `
<!DOCTYPE html>
<html>
<head><title>Sales Report - 2025-01-15</title></head>
<body>
  <h1>Sales Report - Daily Summary</h1>
  <table>
    <tr><th>Date</th><th>Product</th><th>Quantity</th><th>Revenue</th></tr>
    <tr><td>2025-01-15</td><td>Laptop</td><td>10</td><td>12000</td></tr>
    <tr><td>2025-01-15</td><td>Mouse</td><td>50</td><td>1250</td></tr>
  </table>
</body>
</html>
    `.trim(),
    meta: {
      generatedAt: new Date().toISOString(),
      dataCount: 1
    }
  };
}

/**
 * 创建运行时上下文
 */
function createRuntimeContext(): RuntimeContext {
  return {
    envConfig: {
      minio: {},
      userConfigDB: {
        uri: 'mongodb://localhost:27017',
        database: 'report_tool_test',
        collection: 'reports'
      },
      mailer: {
        type: 'smtp',
        smtp: {
          host: 'localhost',
          port: 25
        }
      }
    },
    dateContext: {
      rawDate: '2025-01-15',
      YYYY: '2025',
      YY: '25',
      MM: '01',
      DD: '15',
      YYYYMMDD: '20250115',
      YYMMDD: '250115',
      MMDD: '0115'
    },
    cliArgs: {},
    registries: {} as any
  };
}

/**
 * 测试数据库存储插件
 */
async function testDatabaseStoragePlugin(): Promise<void> {
  console.log('\n=== Testing Database Storage Plugin ===\n');

  const client = new MongoClient('mongodb://localhost:27017');
  let db: Db;

  try {
    // 连接数据库
    console.log('[Setup] Connecting to MongoDB...');
    await client.connect();
    db = client.db('report_tool_test');
    console.log('✅ Connected to MongoDB\n');

    // 清空测试集合
    const collection = db.collection('reports');
    await collection.deleteMany({});
    console.log('[Setup] Cleared test collection\n');

    // ==================== Phase 1: Register Plugin ====================
    console.log('[Phase 1] Registering action plugin...\n');

    const registry = new ActionRegistry('1.0.0');
    registry.register('saveToDatabase', saveToDatabasePlugin);
    console.log('  ✓ Registered: saveToDatabase\n');

    registry.lock();

    // ==================== Phase 2: Execute Actions ====================
    console.log('[Phase 2] Executing saveToDatabase action...\n');

    const actions: ActionConfig[] = [
      {
        type: 'saveToDatabase',
        on: 'report_ready',
        spec: {
          collection: 'reports',
          includeContent: true,
          identity: {
            userId: 'test-user-001',
            username: 'zhangsan',
            department: 'Sales Department'
          }
        }
      }
    ];

    const runtime = createRuntimeContext();
    const data = createTestData();
    const renderResult = createTestRenderResult();

    const executedActions = await executeActions(
      actions,
      'report_ready',
      registry,
      { runtime, data, renderResult }
    );

    console.log(`\n✅ Actions executed: ${executedActions.length}\n`);

    // ==================== Phase 3: Verify Storage ====================
    console.log('[Phase 3] Verifying data in MongoDB...\n');

    const storedDocs = await collection.find({}).toArray();
    console.log(`  Documents in collection: ${storedDocs.length}`);

    if (storedDocs.length === 0) {
      throw new Error('No documents found in collection');
    }

    const doc = storedDocs[0];
    console.log('\n  Stored document structure:');
    console.log(`    meta.title: ${doc.meta?.title}`);
    console.log(`    meta.renderMode: ${doc.meta?.renderMode}`);
    console.log(`    meta.reportDate: ${doc.meta?.reportDate}`);
    console.log(`    meta.storedAt: ${doc.meta?.storedAt}`);
    console.log(`    meta.contentLength: ${doc.meta?.contentLength}`);
    console.log(`    content: ${doc.content ? `${doc.content.length} chars` : 'N/A'}`);
    console.log(`    dataSources: ${doc.dataSources?.length} items`);
    console.log(`    identity.userId: ${doc.identity?.userId}`);
    console.log(`    identity.username: ${doc.identity?.username}`);
    console.log(`    identity.department: ${doc.identity?.department}`);
    console.log(`    environment.hostname: ${doc.environment?.hostname}`);
    console.log(`    environment.platform: ${doc.environment?.platform}`);

    // 验证必需字段
    if (!doc.meta?.title) {
      throw new Error('Missing meta.title');
    }
    console.log('\n  ✅ meta.title exists');

    if (!doc.meta?.storedAt) {
      throw new Error('Missing meta.storedAt');
    }
    console.log('  ✅ meta.storedAt exists');

    if (!doc.content) {
      throw new Error('Missing content');
    }
    console.log('  ✅ content exists');

    if (!doc.identity?.userId) {
      throw new Error('Missing identity.userId');
    }
    console.log('  ✅ identity.userId exists');

    if (!doc.environment) {
      throw new Error('Missing environment');
    }
    console.log('  ✅ environment exists');

    console.log('\n=== Database Storage Plugin Test PASSED ===\n');

  } catch (error) {
    console.error('\n❌ Database storage test FAILED!\n');
    console.error(error);
    throw error;
  } finally {
    await client.close();
    console.log('[Cleanup] Closed MongoDB connection\n');
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await testDatabaseStoragePlugin();
    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
main();
