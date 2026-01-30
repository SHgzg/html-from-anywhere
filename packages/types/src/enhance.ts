/**
 * Enhance - 配置增强机制相关类型
 */

export interface EnhanceContext {
  runtime: import('./runtime').RuntimeContext;
}

export interface Enhance {
  name: string;
  apply(
    config: import('./config').ExecutableConfig,
    context: EnhanceContext
  ): import('./config').ExecutableConfig;
}
