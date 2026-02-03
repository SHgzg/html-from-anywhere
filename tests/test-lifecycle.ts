/**
 * Lifecycle Integration Test
 *
 * 测试完整的报告生成流程：Data → Render → Action
 */

import { DataRegistry } from '../packages/data-core/dist/registry';
import { fetchAllData } from '../packages/data-core/dist/fetcher';
import { getAllDataPlugins } from '../packages/data-core/dist/plugins/data-plugins';
import { RenderRegistry } from '../packages/render-core/dist/registry';
import { renderReports } from '../packages/render-core/dist/renderer';
import { getAllRenderPlugins } from '../packages/render-core/dist/plugins/markdown-render-plugin';
import { ActionRegistry } from '../packages/action-core/dist/registry';
import { executeActions } from '../packages/action-core/dist/executor';
import { fileOutputPlugin } from '../packages/action-core/dist/plugins/output-plugins';
import { logActionPlugin } from '../packages/action-core/dist/plugins/mock-action-plugins';
import { ExecutableConfig, RuntimeContext, RenderMode } from '@report-tool/types';
import * as fs from 'fs/promises';

/**
 * 创建测试配置（模拟真实场景）
 */
function createTestConfig(): ExecutableConfig {
  return {
    report: {
      title: 'Daily Sales Report - {{YYYY}}-{{MM}}-{{DD}}',
      data: []
    },
    data: [
      // 1. 销售数据（内联表格）
      {
        title: 'Sales Summary',
        tag: 'inline',
        source: [
          { date: '2025-01-15', product: 'Laptop', quantity: 12, revenue: 14400 },
          { date: '2025-01-15', product: 'Mouse', quantity: 45, revenue: 1125 },
          { date: '2025-01-15', product: 'Keyboard', quantity: 23, revenue: 1035 }
        ]
      },
      // 2. 报告元数据（对象）
      {
        title: 'Report Metadata',
        tag: 'inline',
        source: {
          author: 'Sales Team',
          department: 'Sales Operations',
          period: '{{YYYY}}-{{MM}}',
          version: '1.2.0'
        }
      },
      // 3. 说明文本
      {
        title: 'Notes',
        tag: 'inline',
        source: 'This is an automated daily sales report. Data is collected from the sales system and represents the confirmed sales for the day.'
      }
    ],
    actions: [
      // 1. 数据就绪时记录日志
      {
        type: 'log',
        on: 'data_ready'
      },
      // 2. HTML 报告保存
      {
        type: 'file_output',
        on: 'report_ready',
        spec: {
          path: './output/sales-report-{{YYYY}}{{MM}}{{DD}}.html',
          overwrite: true
        }
      },
      // 3. Markdown 报告保存
      {
        type: 'file_output',
        on: 'report_ready',
        spec: {
          path: './output/sales-report-{{YYYY}}{{MM}}{{DD}}.md',
          overwrite: true
        }
      }
    ]
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
 * 测试完整生命周期
 */
async function testLifecycle(): Promise<void> {
  console.log('\n=== Testing Report Lifecycle ===\n');
  console.log('Phase: Data → Render → Action\n');

  try {
    // ==================== Phase 1: Bootstrap ====================
    console.log('[Phase 1] Bootstrap - Initializing registries...\n');

    const dataRegistry = new DataRegistry('1.0.0');
    const renderRegistry = new RenderRegistry('1.0.0');
    const actionRegistry = new ActionRegistry('1.0.0');

    // 注册所有插件
    console.log('Registering plugins...\n');

    // Data plugins
    const dataPlugins = getAllDataPlugins();
    for (const [type, plugin] of dataPlugins) {
      dataRegistry.register(type, plugin);
      console.log(`  ✓ Data: ${plugin.name} (${type})`);
    }

    // Render plugins
    const renderPlugins = getAllRenderPlugins();
    for (const [mode, plugin] of renderPlugins) {
      renderRegistry.register(mode, plugin);
      console.log(`  ✓ Render: ${plugin.name} (${mode})`);
    }

    // Action plugins
    actionRegistry.register('log', logActionPlugin);
    console.log(`  ✓ Action: ${logActionPlugin.name} (log)`);
    actionRegistry.register('file_output', fileOutputPlugin);
    console.log(`  ✓ Action: ${fileOutputPlugin.name} (file_output)`);

    console.log('');

    // ==================== Phase 2: Data ====================
    console.log('[Phase 2] Data - Fetching data...\n');

    const config = createTestConfig();
    const runtime = createRuntimeContext();

    // 获取数据
    const dataResults = await fetchAllData(config, dataRegistry, runtime);

    console.log(`\n✅ Data phase complete: ${dataResults.length} data items fetched\n`);

    // ==================== Phase 3: Trigger data_ready actions ====================
    console.log('[Phase 3] Actions - data_ready event\n');

    const dataReadyActions = await executeActions(
      config.actions,
      'data_ready',
      actionRegistry,
      { runtime, data: dataResults }
    );

    console.log(`✅ data_ready actions complete: ${dataReadyActions.length} actions executed\n`);

    // ==================== Phase 4: Render ====================
    console.log('[Phase 4] Render - Generating reports...\n');

    const renderModes: RenderMode[] = ['html', 'markdown'];
    const renderResults = await renderReports(config, dataResults, renderRegistry, runtime, renderModes);

    console.log('\nRender results:');
    for (const [mode, result] of renderResults) {
      console.log(`  ✓ ${mode.toUpperCase()}: ${result.content.length} chars`);
    }
    console.log(`\n✅ Render phase complete: ${renderResults.size} reports generated\n`);

    // ==================== Phase 5: Trigger report_ready actions ====================
    console.log('[Phase 5] Actions - report_ready event\n');

    for (const [mode, renderResult] of renderResults) {
      console.log(`Executing actions for ${mode} mode...\n`);

      const reportReadyActions = await executeActions(
        config.actions,
        'report_ready',
        actionRegistry,
        { runtime, data: dataResults, renderResult }
      );

      console.log(`  ✅ ${mode}: ${reportReadyActions.length} actions executed\n`);
    }

    console.log('✅ All actions complete\n');

    // ==================== Summary ====================
    console.log('=== Report Generation Summary ===\n');
    console.log(`Data Items: ${dataResults.length}`);
    console.log(`Render Modes: ${Array.from(renderResults.keys()).join(', ')}`);
    console.log(`Total Actions: ${config.actions.length}`);
    console.log('');
    console.log('✅ Lifecycle test PASSED\n');

  } catch (error) {
    console.error('\n❌ Lifecycle test FAILED!\n');
    console.error(error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await testLifecycle();
    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
main();
