/**
 * Config Package
 * 负责：解析 user_config、应用 enhances、生成 ExecutableConfig
 */

import { RuntimeContext, ExecutableConfig } from '@report-tool/types';
import { loadConfigFromFile, validateConfig, type UserConfig } from './loader';
import { replaceTemplateVariables } from './templating';

/**
 * 解析配置
 *
 * @param runtime - 运行时上下文
 * @returns ExecutableConfig
 */
export async function resolveConfig(runtime: RuntimeContext): Promise<ExecutableConfig> {
  console.log('[Config] Resolving config...');

  // 1. Load user_config (from file for now, DB support later)
  const configPath = runtime.cliArgs.configPath || './config.json';
  let userConfig: UserConfig;

  try {
    userConfig = loadConfigFromFile(configPath);
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }

  // 2. Apply template resolution (replace date variables)
  const configWithTemplates = replaceTemplateVariables(userConfig, runtime.dateContext);

  // 3. Validate config
  validateConfig(configWithTemplates);

  // 4. Apply enhances (TODO: not implemented yet)
  // const enhancedConfig = await applyEnhances(configWithTemplates, runtime);

  // 5. Build ExecutableConfig
  const executableConfig: ExecutableConfig = {
    report: {
      title: configWithTemplates.report?.title || 'Report',
      data: configWithTemplates.report?.data || []
    },
    data: configWithTemplates.data || [],
    actions: (configWithTemplates.actions || []).map(action => ({
      ...action,
      spec: action.spec || {}
    })),
    meta: configWithTemplates.meta as Record<string, unknown> | undefined,
    deprecated: configWithTemplates.deprecated as any
  };

  console.log(`[Config] Loaded ${executableConfig.data.length} data items and ${executableConfig.actions.length} actions`);
  console.log('[Config] Complete');

  return executableConfig;
}

export * from './loader';
