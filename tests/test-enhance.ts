/**
 * Test Enhance Core
 *
 * 测试模板变量替换和 UserConfig 到 ExecutableConfig 的转换
 */

import { EnhanceRegistry } from '../packages/enhance-core/dist/registry';
import { applyEnhances } from '../packages/enhance-core/dist/enhancer';
import { templateEnhancePlugin } from '../packages/enhance-core/dist/plugins/template-enhance-plugin';
import { UserConfig, RuntimeContext } from '@report-tool/types';

/**
 * 创建测试用户配置（包含模板变量）
 */
function createTestUserConfig(): UserConfig {
  return {
    report: {
      title: 'Daily Sales Report - {{YYYY}}-{{MM}}-{{DD}}',
      data: []
    },
    data: [
      {
        title: 'Sales Data for {{YYYYMMDD}}',
        tag: 'inline',
        source: [
          { date: '{{rawDate}}', product: 'Laptop', quantity: 10, revenue: 12000 },
          { date: '{{rawDate}}', product: 'Mouse', quantity: 50, revenue: 1250 }
        ]
      },
      {
        title: 'Monthly Summary - {{YYYY}}-{{MM}}',
        tag: 'file',
        source: './data/monthly/{{YYYY}}/{{MM}}/summary.json'
      }
    ],
    actions: [
      {
        type: 'file_output',
        on: 'report_ready',
        spec: {
          path: './output/reports/sales-{{YYYY}}{{MM}}{{DD}}.html',
          overwrite: true
        }
      },
      {
        type: 'file_output',
        on: 'report_ready',
        spec: {
          path: './output/reports/sales-{{YYYYMMDD}}.md',
          overwrite: true
        }
      },
      {
        type: 'log',
        on: 'data_ready',
        spec: {
          message: 'Report generated for {{YYYYMMDD}}'
        }
      }
    ],
    meta: {
      author: 'Sales Team',
      version: '1.0.0',
      generatedDate: '{{rawDate}}'
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
 * 测试 Enhance 插件
 */
async function testEnhancePlugins(): Promise<void> {
  console.log('\n=== Testing Enhance Plugins ===\n');

  try {
    // ==================== Phase 1: Create Registry ====================
    console.log('[Phase 1] Creating Enhance Registry...\n');

    const registry = new EnhanceRegistry();

    console.log('Registering enhance plugins:');
    registry.register(templateEnhancePlugin);
    console.log('  ✓ Registered: template-enhance');
    console.log('');

    // 锁定 registry
    registry.lock();

    // ==================== Phase 2: Apply Enhances ====================
    console.log('[Phase 2] Applying enhances to user config...\n');

    const userConfig = createTestUserConfig();
    const runtime = createRuntimeContext();

    console.log('Original user config:');
    console.log(`  Report Title: ${userConfig.report?.title}`);
    console.log(`  Data Items: ${(userConfig.data as any[])?.length || 0}`);
    console.log(`  Actions: ${(userConfig.actions as any[])?.length || 0}`);
    console.log('');

    const executableConfig = applyEnhances(userConfig, registry, runtime);

    console.log('Enhanced config:');
    console.log(`  Report Title: ${executableConfig.report.title}`);
    console.log(`  Data Items: ${executableConfig.data.length}`);
    console.log(`  Actions: ${executableConfig.actions.length}`);
    console.log('');

    // ==================== Phase 3: Verify Template Replacement ====================
    console.log('[Phase 3] Verifying template replacement...\n');

    // 验证 report title
    if (executableConfig.report.title === 'Daily Sales Report - 2025-01-15') {
      console.log('  ✅ Report title template replaced correctly');
    } else {
      throw new Error(`Report title not replaced: ${executableConfig.report.title}`);
    }

    // 验证 data items
    const firstDataItem = executableConfig.data[0];
    if (firstDataItem.title === 'Sales Data for 20250115') {
      console.log('  ✅ Data title template replaced correctly');
    } else {
      throw new Error(`Data title not replaced: ${firstDataItem.title}`);
    }

    // 验证数据中的模板变量
    const firstDataSource = firstDataItem.source as any[];
    if (firstDataSource[0].date === '2025-01-15') {
      console.log('  ✅ Data content template replaced correctly');
    } else {
      throw new Error(`Data content not replaced: ${firstDataSource[0].date}`);
    }

    // 验证 file path 中的模板变量
    const secondDataItem = executableConfig.data[1];
    if ((secondDataItem.source as string).includes('2025/01')) {
      console.log('  ✅ File path template replaced correctly');
    } else {
      throw new Error(`File path not replaced: ${secondDataItem.source}`);
    }

    // 验证 action spec 中的模板变量
    const firstAction = executableConfig.actions[0];
    const firstActionPath = (firstAction.spec as any).path;
    if (firstActionPath === './output/reports/sales-20250115.html') {
      console.log('  ✅ Action path template replaced correctly');
    } else {
      throw new Error(`Action path not replaced: ${firstActionPath}`);
    }

    const secondActionPath = (executableConfig.actions[1].spec as any).path;
    if (secondActionPath === './output/reports/sales-20250115.md') {
      console.log('  ✅ Second action path template replaced correctly');
    } else {
      throw new Error(`Second action path not replaced: ${secondActionPath}`);
    }

    // 验证 meta 中的模板变量
    if ((executableConfig.meta?.generatedDate as string) === '2025-01-15') {
      console.log('  ✅ Meta template replaced correctly');
    } else {
      throw new Error(`Meta not replaced: ${executableConfig.meta?.generatedDate}`);
    }

    console.log('');

    // ==================== Phase 4: Verify ExecutableConfig Structure ====================
    console.log('[Phase 4] Verifying ExecutableConfig structure...\n');

    if (!executableConfig.report) {
      throw new Error('Missing report config');
    }
    console.log('  ✅ Has report config');

    if (!Array.isArray(executableConfig.data)) {
      throw new Error('Data is not an array');
    }
    console.log('  ✅ Data is an array');

    if (!Array.isArray(executableConfig.actions)) {
      throw new Error('Actions is not an array');
    }
    console.log('  ✅ Actions is an array');

    console.log('');

    // ==================== Summary ====================
    console.log('=== Enhance Plugins Test PASSED ===\n');
    console.log('Summary:');
    console.log(`  Template variables replaced successfully`);
    console.log(`  UserConfig transformed to ExecutableConfig`);
    console.log(`  All config fields validated`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Enhance plugins test FAILED!\n');
    console.error(error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await testEnhancePlugins();
    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
main();
