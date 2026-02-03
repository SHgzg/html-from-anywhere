/**
 * Test Render Plugins
 *
 * 测试 HTML、Email、Markdown 三种渲染模式
 */

import { RenderRegistry } from '../packages/render-core/dist/registry';
import { renderReports } from '../packages/render-core/dist/renderer';
import { htmlRenderPlugin } from '../packages/render-core/dist/plugins/html-render-plugin';
import { emailRenderPlugin } from '../packages/render-core/dist/plugins/email-render-plugin';
import { markdownRenderPlugin } from '../packages/render-core/dist/plugins/markdown-render-plugin';
import { ExecutableConfig, RuntimeContext, DataResult } from '@report-tool/types';
import * as fs from 'fs/promises';

/**
 * 创建测试数据
 */
function createTestData(): DataResult[] {
  return [
    // 1. 表格数据
    {
      title: 'Sales Data',
      tag: 'inline',
      data: [
        { product: 'Laptop', category: 'Electronics', quantity: 5, price: 1200 },
        { product: 'Mouse', category: 'Electronics', quantity: 20, price: 25 },
        { product: 'Keyboard', category: 'Electronics', quantity: 15, price: 45 },
        { product: 'Monitor', category: 'Electronics', quantity: 8, price: 300 }
      ],
      meta: {
        dataType: 'table',
        rows: 4,
        columns: 4,
        timestamp: new Date().toISOString()
      }
    },
    // 2. 图片数据（小图）
    {
      title: 'Chart Image',
      tag: 'file',
      data: {
        format: 'png',
        encoding: 'base64',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
      },
      meta: {
        dataType: 'image',
        format: 'png',
        encoding: 'base64',
        timestamp: new Date().toISOString()
      }
    },
    // 3. 对象数据
    {
      title: 'Report Metadata',
      tag: 'inline',
      data: {
        author: 'Zhang San',
        version: '1.0.0',
        createdAt: '2025-01-15',
        tags: ['sales', 'quarterly', '2025'],
        settings: {
          autoRefresh: true,
          interval: 3600
        }
      },
      meta: {
        dataType: 'object',
        timestamp: new Date().toISOString()
      }
    },
    // 4. 文本数据
    {
      title: 'Notes',
      tag: 'inline',
      data: 'This is a sample text note.\nIt can contain multiple lines.\nUse it for additional information.',
      meta: {
        dataType: 'text',
        timestamp: new Date().toISOString()
      }
    }
  ];
}

/**
 * 创建测试配置
 */
function createTestConfig(): ExecutableConfig {
  return {
    report: {
      title: 'Quarterly Sales Report',
      data: []
    },
    data: [],
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
 * 测试渲染插件
 */
async function testRenderPlugins(): Promise<void> {
  console.log('\n=== Testing Render Plugins ===\n');

  try {
    // 创建 Render Registry 并注册所有插件
    const registry = new RenderRegistry('1.0.0');

    console.log('Registering render plugins:');
    registry.register('html', htmlRenderPlugin);
    console.log('  ✓ Registered: html-render (html)');

    registry.register('email', emailRenderPlugin);
    console.log('  ✓ Registered: email-render (email)');

    registry.register('markdown', markdownRenderPlugin);
    console.log('  ✓ Registered: markdown-render (markdown)');
    console.log('');

    // 创建测试数据
    const config = createTestConfig();
    const runtime = createRuntimeContext();
    const data = createTestData();

    // 测试所有渲染模式
    const renderModes: Array<'html' | 'email' | 'markdown'> = ['html', 'email', 'markdown'];

    console.log('Rendering reports in all modes...\n');
    const results = await renderReports(config, data, registry, runtime, renderModes);

    // 显示结果
    console.log('\n=== Render Results ===\n');

    for (const [mode, result] of results) {
      console.log(`📄 ${mode.toUpperCase()} Render`);
      console.log(`   Content Length: ${result.content.length} characters`);
      console.log(`   Generated At: ${result.meta?.generatedAt || 'N/A'}`);
      console.log(`   Data Count: ${(result.meta as any)?.dataCount || data.length}`);
      console.log('');
    }

    // 保存渲染结果到文件
    const outputDir = 'test-output';
    await fs.mkdir(outputDir, { recursive: true });

    for (const [mode, result] of results) {
      const ext = mode === 'html' ? 'html' : mode === 'email' ? 'html' : 'md';
      const filename = `${outputDir}/report.${ext}`;
      await fs.writeFile(filename, result.content, 'utf-8');
      console.log(`✓ Saved: ${filename}`);
    }

    console.log('\n=== Render Plugins Test PASSED ===\n');

  } catch (error) {
    console.error('\n❌ Render plugins test FAILED!\n');
    console.error(error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await testRenderPlugins();
    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
main();
