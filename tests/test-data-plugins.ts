/**
 * Test Data Plugins
 *
 * 测试真实的数据插件功能
 */

import { DataRegistry } from '../packages/data-core/dist/registry';
import { fetchAllData } from '../packages/data-core/dist/fetcher';
import { getAllDataPlugins } from '../packages/data-core/dist/plugins/data-plugins';
import { ExecutableConfig, RuntimeContext } from '../packages/types/dist/index';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 创建测试数据文件
 */
async function setupTestData(): Promise<void> {
  console.log('\n=== Setting up test data ===\n');

  const dataDir = path.join(process.cwd(), 'test-data');
  await fs.mkdir(dataDir, { recursive: true });

  // 创建测试 JSON 文件
  const testJsonPath = path.join(dataDir, 'sales.json');
  await fs.writeFile(testJsonPath, JSON.stringify({
    period: '2025-01',
    total: 100000,
    items: [
      { product: 'A', sales: 30000 },
      { product: 'B', sales: 40000 },
      { product: 'C', sales: 30000 }
    ]
  }, null, 2));
  console.log('✓ Created test JSON file: test-data/sales.json');

  // 创建多个 JSON 文件用于 glob 测试
  for (let i = 1; i <= 3; i++) {
    const filePath = path.join(dataDir, `metric-${i}.json`);
    await fs.writeFile(filePath, JSON.stringify({
      id: i,
      name: `Metric ${i}`,
      value: i * 100
    }, null, 2));
  }
  console.log('✓ Created test files for glob pattern: test-data/metric-*.json');

  console.log('\n=== Test data setup complete ===\n');
}

/**
 * 清理测试数据
 */
async function cleanupTestData(): Promise<void> {
  console.log('\n=== Cleaning up test data ===\n');

  const dataDir = path.join(process.cwd(), 'test-data');
  try {
    await fs.rm(dataDir, { recursive: true, force: true });
    console.log('✓ Removed test data directory');
  } catch {
    // Ignore errors
  }

  console.log('\n=== Cleanup complete ===\n');
}

/**
 * 创建测试配置
 */
function createTestConfig(): ExecutableConfig {
  return {
    report: {
      title: 'Test Report',
      data: []
    },
    data: [
      // 1. Inline 数据源
      {
        title: 'Inline Sales Data',
        tag: 'inline',
        source: {
          period: '2025-Q1',
          total: 150000,
          products: ['A', 'B', 'C']
        }
      },
      // 2. File 数据源
      {
        title: 'File Sales Data',
        tag: 'file',
        source: './test-data/sales.json'
      },
      // 3. Glob 数据源
      {
        title: 'Glob Metrics Data',
        tag: 'glob',
        source: './test-data/metric-*.json'
      },
      // 4. HTTPS 数据源 (使用一个公开的测试 API)
      {
        title: 'HTTPS API Data',
        tag: 'https',
        source: 'https://jsonplaceholder.typicode.com/posts/1'
      }
    ],
    actions: []
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
        database: 'report_config',
        collection: 'user_config'
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
 * 测试数据插件
 */
async function testDataPlugins(): Promise<void> {
  console.log('\n=== Testing Data Plugins ===\n');

  try {
    // 创建 Data Registry 并注册所有插件
    const registry = new DataRegistry('1.0.0');
    const plugins = getAllDataPlugins();

    console.log('Registering data plugins:');
    for (const [type, plugin] of plugins) {
      registry.register(type, plugin);
      console.log(`  ✓ Registered: ${plugin.name} (${type})`);
    }
    console.log('');

    // 创建测试配置和运行时上下文
    const config = createTestConfig();
    const runtime = createRuntimeContext();

    // 执行数据获取
    console.log('Fetching data...\n');
    const results = await fetchAllData(config, registry, runtime);

    // 显示结果
    console.log('\n=== Results ===\n');
    console.log(`Total data items fetched: ${results.length}\n`);

    for (const result of results) {
      console.log(`📊 ${result.title}`);
      console.log(`   Tag: ${result.tag}`);
      console.log(`   Timestamp: ${result.meta?.timestamp || 'N/A'}`);

      // 显示数据摘要
      if (typeof result.data === 'object' && result.data !== null) {
        if (Array.isArray(result.data)) {
          console.log(`   Data: Array with ${result.data.length} items`);
        } else {
          const keys = Object.keys(result.data).slice(0, 5);
          console.log(`   Data: Object with keys: ${keys.join(', ')}`);
        }
      } else {
        const preview = String(result.data).slice(0, 50);
        console.log(`   Data: ${preview}${preview.length >= 50 ? '...' : ''}`);
      }

      // 显示特定元数据
      if (result.meta?.path) {
        console.log(`   Path: ${result.meta.path}`);
      }
      if (result.meta?.count !== undefined) {
        console.log(`   Count: ${result.meta.count}`);
      }
      if (result.meta?.files) {
        console.log(`   Files: ${(result.meta.files as string[]).join(', ')}`);
      }

      console.log('');
    }

    console.log('\n=== Data plugins test PASSED ===\n');

  } catch (error) {
    console.error('\n❌ Data plugins test FAILED!\n');
    console.error(error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 1. 设置测试数据
    await setupTestData();

    // 2. 测试数据插件
    await testDataPlugins();

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // 清理测试数据
    await cleanupTestData();
  }
}

// 运行测试
main();
