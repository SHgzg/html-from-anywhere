/**
 * Render - 报告渲染相关类型
 */

export type RenderMode = 'html' | 'email';

export interface RenderResult {
  renderMode: RenderMode;
  content: string;
  meta?: Record<string, unknown>;
}

export interface TemplateGenerator {
  renderMode: RenderMode;
  render(params: {
    data: import('./data').DataResult[];
    config: import('./config').ExecutableConfig;
    runtime: import('./runtime').RuntimeContext;
  }): RenderResult;
}
