/**
 * Test File Type Handling
 *
 * 测试文件类型处理：CSV 解析和图片转 base64
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
async function setupTestFiles(): Promise<void> {
  console.log('\n=== Setting up test files ===\n');

  const dataDir = path.join(process.cwd(), 'test-data');
  await fs.mkdir(dataDir, { recursive: true });

  // 1. 创建 CSV 文件
  const csvPath = path.join(dataDir, 'sales.csv');
  await fs.writeFile(csvPath, `Product,Category,Quantity,Price
Laptop,Electronics,5,1200
Mouse,Electronics,20,25
Keyboard,Electronics,15,45
Monitor,Electronics,8,300
Desk,Furniture,3,500`);
  console.log('✓ Created CSV file: test-data/sales.csv');

  // 1.5 创建表格 JSON 文件
  const tableJsonPath = path.join(dataDir, 'employees.json');
  await fs.writeFile(tableJsonPath, JSON.stringify([
    { id: 1, name: 'Alice', department: 'Engineering', salary: 80000 },
    { id: 2, name: 'Bob', department: 'Sales', salary: 65000 },
    { id: 3, name: 'Charlie', department: 'Marketing', salary: 70000 }
  ], null, 2));
  console.log('✓ Created table JSON file: test-data/employees.json');

  // 2. 创建简单的 PNG 图片（1x1 像素的红色 PNG）
  const pngPath = path.join(dataDir, 'chart.png');
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  await fs.writeFile(pngPath, Buffer.from(pngBase64, 'base64'));
  console.log('✓ Created PNG image: test-data/chart.png');

  // 3. 创建 JSON 文件（作为对比）
  const jsonPath = path.join(dataDir, 'data.json');
  await fs.writeFile(jsonPath, JSON.stringify({
    status: 'success',
    items: [1, 2, 3]
  }, null, 2));
  console.log('✓ Created JSON file: test-data/data.json');

  // 4. 创建普通文本文件
  const txtPath = path.join(dataDir, 'notes.txt');
  await fs.writeFile(txtPath, 'This is a plain text file.\nIt has multiple lines.');
  console.log('✓ Created text file: test-data/notes.txt');

  console.log('\n=== Test files setup complete ===\n');
}

/**
 * 清理测试数据
 */
async function cleanupTestFiles(): Promise<void> {
  console.log('\n=== Cleaning up test files ===\n');

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
      title: 'File Types Test Report',
      data: []
    },
    data: [
      // CSV 文件
      {
        title: 'Sales Data CSV',
        tag: 'file',
        source: './test-data/sales.csv'
      },
      // 表格 JSON 文件
      {
        title: 'Employees Table JSON',
        tag: 'file',
        source: './test-data/employees.json'
      },
      // PNG 图片
      {
        title: 'Chart Image',
        tag: 'file',
        source: './test-data/chart.png'
      },
      // 普通对象 JSON 文件
      {
        title: 'JSON Data',
        tag: 'file',
        source: './test-data/data.json'
      },
      // 文本文件
      {
        title: 'Notes',
        tag: 'file',
        source: './test-data/notes.txt'
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
 * 测试文件类型处理
 */
async function testFileTypes(): Promise<void> {
  console.log('\n=== Testing File Type Handling ===\n');

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
    console.log(`Total files processed: ${results.length}\n`);

    for (const result of results) {
      console.log(`📄 ${result.title}`);
      console.log(`   Tag: ${result.tag}`);
      console.log(`   File Type: ${(result.meta as any)?.fileType || 'unknown'}`);
      console.log(`   Data Type: ${(result.meta as any)?.dataType || 'raw'}`);
      console.log(`   Format: ${(result.meta as any)?.format || 'raw'}`);

      // 根据数据类型显示不同的信息
      if ((result.meta as any)?.dataType === 'table') {
        console.log(`   Rows: ${(result.meta as any)?.rows}`);
        console.log(`   Columns: ${(result.meta as any)?.columns}`);
        if ((result.meta as any)?.format === 'csv') {
          const dataArray = result.data as Record<string, unknown>[];
          console.log(`   Data: Array with ${dataArray.length} records`);
          console.log(`   Sample: ${JSON.stringify(dataArray[0])}`);
        } else if ((result.meta as any)?.format === 'json') {
          const dataArray = result.data as Record<string, unknown>[];
          console.log(`   Data: Table array with ${dataArray.length} records`);
          console.log(`   Sample: ${JSON.stringify(dataArray[0])}`);
        }
      } else if ((result.meta as any)?.dataType === 'image') {
        const imageData = result.data as { format: string; encoding: string; data: string };
        console.log(`   Encoding: ${imageData.encoding}`);
        console.log(`   Format: ${imageData.format}`);
        console.log(`   Data Length: ${imageData.data.length} characters`);
        console.log(`   Preview: ${imageData.data.substring(0, 50)}...`);
      } else if ((result.meta as any)?.dataType === 'object') {
        console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
      } else if ((result.meta as any)?.dataType === 'text') {
        const text = result.data as string;
        console.log(`   Data: ${text.substring(0, 80)}...`);
      } else {
        console.log(`   Data: ${JSON.stringify(result.data).substring(0, 80)}...`);
      }

      console.log('');
    }

    console.log('\n=== File type handling test PASSED ===\n');

  } catch (error) {
    console.error('\n❌ File type handling test FAILED!\n');
    console.error(error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 1. 设置测试文件
    await setupTestFiles();

    // 2. 测试文件类型处理
    await testFileTypes();

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // 清理测试文件
    await cleanupTestFiles();
  }
}

// 运行测试
main();
