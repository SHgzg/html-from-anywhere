/**
 * Registry 集合类型
 *
 * 注意：使用 any 避免循环依赖
 * 具体类型在运行时由各 core 包提供
 */

/**
 * Registry 集合
 *
 * 包含所有子系统的 Registry 实例
 */
export interface Registries {
  actionRegistry: any; // ActionRegistry from @report-cli/action-core
  dataRegistry: any;  // DataRegistry from @report-cli/data-core
  renderRegistry: any; // RenderRegistry from @report-cli/render-core
  enhanceRegistry: any; // EnhanceRegistry from @report-cli/enhance-core
}
