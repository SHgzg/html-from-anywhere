/**
 * Lifecycle Package
 * 负责：编排整个执行生命周期
 *
 * SKELETON: 当前为桩代码，演示完整流程
 */

import { LifecycleOrchestrator } from '@report-cli/types';
import { bootstrap } from '@report-cli/bootstrap';
import { resolveConfig } from '@report-cli/config';
import { fetchAllData } from '@report-cli/data-core';
import { renderReports } from '@report-cli/render-core';
import { executeActions } from '@report-cli/action-core';

export class Orchestrator implements LifecycleOrchestrator {
  async run(): Promise<void> {
    console.log('========================================');
    console.log('Report CLI - Skeleton Version');
    console.log('========================================\n');

    try {
      // Phase 1: Bootstrap
      console.log('Phase 1: Bootstrap');
      console.log('----------------------------------------');
      const runtime = await bootstrap();
      console.log('');

      // Phase 2: Config
      console.log('Phase 2: Config');
      console.log('----------------------------------------');
      const config = await resolveConfig(runtime);
      console.log('');

      // Phase 3: Data
      console.log('Phase 3: Data');
      console.log('----------------------------------------');
      const dataResults = await fetchAllData(
        config,
        runtime.registries.dataRegistry,
        runtime
      );
      console.log('');

      // Phase 4: Render (conditional)
      console.log('Phase 4: Render (conditional)');
      console.log('----------------------------------------');
      const hasReportReadyActions = config.actions.some(a => a.on === 'report_ready');
      let renderResults = new Map();

      if (hasReportReadyActions) {
        renderResults = await renderReports(
          config,
          dataResults,
          runtime.registries.renderRegistry,
          runtime,
          ['html'] // TODO: determine from actions
        );
      } else {
        console.log('[Render] Skipped - no report_ready actions');
      }
      console.log('');

      // Phase 5: Action
      console.log('Phase 5: Action');
      console.log('----------------------------------------');

      // data_ready 事件
      await executeActions(
        config.actions,
        'data_ready',
        runtime.registries.actionRegistry,
        {
          runtime,
          data: dataResults,
          renderResult: undefined
        }
      );

      // report_ready 事件
      if (hasReportReadyActions) {
        await executeActions(
          config.actions,
          'report_ready',
          runtime.registries.actionRegistry,
          {
            runtime,
            data: dataResults,
            renderResult: renderResults.get('html')
          }
        );
      }

      console.log('');

      console.log('========================================');
      console.log('Execution complete!');
      console.log('========================================');

    } catch (error) {
      console.error('[Lifecycle] Error:', error);
      throw error;
    }
  }
}
