/**
 * Config Package
 * 负责：解析 user_config、应用 enhances、生成 ExecutableConfig
 *
 * SKELETON: 当前为桩代码，返回模拟数据
 */

import { RuntimeContext, ExecutableConfig } from '@report-tool/types';

export async function resolveConfig(runtime: RuntimeContext): Promise<ExecutableConfig> {
  console.log('[Config] Resolving config...');

  // TODO: Implement real config resolution
  // 1. Load user_config (DB or local file)
  // 2. Apply template resolution
  // 3. Check deprecated
  // 4. Apply enhances
  // 5. Build ExecutableConfig

  const mockExecutableConfig: ExecutableConfig = {
    report: {
      title: 'Demo Report',
      data: []
    },
    data: [
      {
        title: 'Sales Data',
        tag: 'inline',
        source: 'inline:demo'
      },
      {
        title: 'API Metrics',
        tag: 'https',
        source: 'https://api.example.com/metrics'
      }
    ],
    actions: [
      {
        type: 'log',
        on: 'data_ready',
        spec: {}
      },
      {
        type: 'email',
        on: 'report_ready',
        spec: {
          to: 'user@example.com',
          subject: 'Daily Report',
          template: 'default'
        }
      }
    ]
  };

  console.log('[Config] Complete (SKELETON)');
  return mockExecutableConfig;
}
