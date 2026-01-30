/**
 * Lifecycle - 生命周期编排相关类型
 */

export interface LifecycleOrchestrator {
  run(): Promise<void>;
}
