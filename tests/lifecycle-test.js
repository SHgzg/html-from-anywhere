/**
 * Lifecycle Test Script (JavaScript version)
 *
 * 验证各个生命周期的输入、输出和 Action 执行
 */

const { bootstrap } = require('../packages/bootstrap/dist/bootstrap');
const { resolveConfig } = require('../packages/config/dist/index');
const { fetchAllData } = require('../packages/data-core/dist/fetcher');
const { renderReports } = require('../packages/render-core/dist/renderer');
const { executeActions } = require('../packages/action-core/dist/executor');

class LifecycleTester {
  constructor() {
    this.results = [];
    this.runtime = null;
    this.config = null;
    this.dataResults = null;
    this.renderResults = null;
  }

  /**
   * 运行完整测试
   */
  async runTest(configPath = './config.test.json') {
    console.log('========================================');
    console.log('Lifecycle Test Suite');
    console.log('========================================\n');

    const startTime = Date.now();

    try {
      // Phase 1: Bootstrap
      await this.testBootstrap();

      // Phase 2: Config
      await this.testConfig(configPath);

      // Phase 3: Data
      await this.testData();

      // Phase 4: Render
      await this.testRender();

      // Phase 5: Action - data_ready
      await this.testAction('data_ready');

      // Phase 6: Action - report_ready
      await this.testAction('report_ready');

      // Summary
      return this.generateReport(Date.now() - startTime);
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * 测试 Bootstrap 阶段
   */
  async testBootstrap() {
    const startTime = Date.now();
    console.log('\n--- Phase 1: Bootstrap ---');

    try {
      this.runtime = await bootstrap();

      this.results.push({
        phase: 'Bootstrap',
        success: true,
        output: {
          hasRegistries: !!this.runtime.registries,
          hasDateContext: !!this.runtime.dateContext,
          hasCliArgs: !!this.runtime.cliArgs,
          hasEnvConfig: !!this.runtime.envConfig,
          date: this.runtime.dateContext.rawDate,
          configPath: this.runtime.cliArgs.configPath
        },
        duration: Date.now() - startTime
      });

      console.log('✅ Bootstrap passed');
      this.printValidation('RuntimeContext', {
        registries: Object.keys(this.runtime.registries).length,
        dateContext: this.runtime.dateContext.rawDate,
        cliArgs: Object.keys(this.runtime.cliArgs).length
      });
    } catch (error) {
      this.results.push({
        phase: 'Bootstrap',
        success: false,
        errors: [String(error)],
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * 测试 Config 阶段
   */
  async testConfig(configPath) {
    const startTime = Date.now();
    console.log('\n--- Phase 2: Config ---');

    try {
      // 临时覆盖 configPath
      const originalConfigPath = this.runtime.cliArgs.configPath;
      this.runtime.cliArgs.configPath = configPath;

      this.config = await resolveConfig(this.runtime);

      // 恢复原始 configPath
      this.runtime.cliArgs.configPath = originalConfigPath;

      this.results.push({
        phase: 'Config',
        success: true,
        input: { configPath },
        output: {
          hasReport: !!this.config.report,
          reportTitle: this.config.report.title,
          dataItemCount: this.config.data.length,
          actionCount: this.config.actions.length,
          actions: this.config.actions.map(a => ({ type: a.type, on: a.on }))
        },
        duration: Date.now() - startTime
      });

      console.log('✅ Config passed');
      this.printValidation('ExecutableConfig', {
        report: this.config.report.title,
        dataItems: this.config.data.length,
        actions: this.config.actions.length
      });
    } catch (error) {
      this.results.push({
        phase: 'Config',
        success: false,
        input: { configPath },
        errors: [String(error)],
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * 测试 Data 阶段
   */
  async testData() {
    const startTime = Date.now();
    console.log('\n--- Phase 3: Data ---');

    try {
      this.dataResults = await fetchAllData(
        this.config,
        this.runtime.registries.dataRegistry,
        this.runtime
      );

      const validation = {
        itemCount: this.dataResults.length,
        hasTitles: this.dataResults.every(r => !!r.title),
        hasTags: this.dataResults.every(r => !!r.tag),
        hasData: this.dataResults.every(r => r.data !== undefined),
        items: this.dataResults.map(r => ({ title: r.title, tag: r.tag, hasData: !!r.data }))
      };

      this.results.push({
        phase: 'Data',
        success: true,
        input: {
          dataItemCount: this.config.data.length,
          dataItems: this.config.data.map(d => ({ title: d.title, tag: d.tag }))
        },
        output: validation,
        duration: Date.now() - startTime
      });

      console.log('✅ Data passed');
      this.printValidation('DataResults', validation);
    } catch (error) {
      this.results.push({
        phase: 'Data',
        success: false,
        errors: [String(error)],
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * 测试 Render 阶段
   */
  async testRender() {
    const startTime = Date.now();
    console.log('\n--- Phase 4: Render ---');

    try {
      const hasReportReadyActions = this.config.actions.some(a => a.on === 'report_ready');

      if (!hasReportReadyActions) {
        console.log('⏭️  Render skipped (no report_ready actions)');
        this.results.push({
          phase: 'Render',
          success: true,
          output: { skipped: true, reason: 'No report_ready actions' },
          duration: Date.now() - startTime
        });
        return;
      }

      this.renderResults = await renderReports(
        this.config,
        this.dataResults,
        this.runtime.registries.renderRegistry,
        this.runtime,
        ['html']
      );

      const validation = {
        renderCount: this.renderResults.size,
        modes: Array.from(this.renderResults.keys()),
        hasContent: this.renderResults.get('html')?.content ? true : false,
        contentLength: this.renderResults.get('html')?.content.length || 0,
        hasMeta: this.renderResults.get('html')?.meta ? true : false
      };

      this.results.push({
        phase: 'Render',
        success: true,
        input: {
          dataItemCount: this.dataResults.length,
          renderModes: ['html']
        },
        output: validation,
        duration: Date.now() - startTime
      });

      console.log('✅ Render passed');
      this.printValidation('RenderResults', validation);
    } catch (error) {
      this.results.push({
        phase: 'Render',
        success: false,
        errors: [String(error)],
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * 测试 Action 阶段
   */
  async testAction(event) {
    const startTime = Date.now();
    console.log(`\n--- Phase 5: Action (${event}) ---`);

    try {
      const eventActions = this.config.actions.filter(a => a.on === event);

      if (eventActions.length === 0) {
        console.log(`⏭️  Action (${event}) skipped (no actions)`);
        this.results.push({
          phase: `Action-${event}`,
          success: true,
          output: { skipped: true, reason: `No ${event} actions` },
          duration: Date.now() - startTime
        });
        return;
      }

      await executeActions(
        this.config.actions,
        event,
        this.runtime.registries.actionRegistry,
        {
          runtime: this.runtime,
          data: this.dataResults,
          renderResult: this.renderResults?.get('html')
        }
      );

      this.results.push({
        phase: `Action-${event}`,
        success: true,
        input: {
          event,
          actionCount: eventActions.length,
          actions: eventActions.map(a => ({ type: a.type })),
          hasData: !!this.dataResults,
          dataCount: this.dataResults?.length || 0,
          hasRenderResult: !!this.renderResults?.get('html')
        },
        output: {
          executed: true,
          actionCount: eventActions.length
        },
        duration: Date.now() - startTime
      });

      console.log(`✅ Action (${event}) passed`);
      this.printValidation(`Action-${event}`, {
        actionCount: eventActions.length,
        actions: eventActions.map(a => a.type)
      });
    } catch (error) {
      this.results.push({
        phase: `Action-${event}`,
        success: false,
        input: { event },
        errors: [String(error)],
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * 生成测试报告
   */
  generateReport(totalDuration) {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        total: this.results.length,
        passed,
        failed,
        totalDuration
      }
    };

    // 打印总结
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Total: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`Duration: ${report.summary.totalDuration}ms`);
    console.log('========================================\n');

    // 保存报告
    this.saveReport(report);

    return report;
  }

  /**
   * 保存测试报告到文件
   */
  saveReport(report) {
    const fs = require('fs');
    const path = require('path');

    const reportsDir = path.resolve(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `lifecycle-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Test report saved to: ${reportPath}\n`);
  }

  /**
   * 打印验证信息
   */
  printValidation(label, data) {
    console.log(`  ${label}:`);
    console.log(`  ${JSON.stringify(data, null, 2).split('\n').join('\n  ')}`);
  }
}

// 主函数
async function main() {
  const tester = new LifecycleTester();

  try {
    const configPath = process.argv[2] || './config.test.json';
    await tester.runTest(configPath);
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }
}

// 运行
main();
