/**
 * UserConfig - 原始用户配置（不做强 schema 约束）
 * ExecutableConfig - Enhance 完成后的可执行配置
 */

import type { RenderMode } from './render';

export type UserConfig = Record<string, unknown>;
export type { RenderMode };

export interface ReportConfig {
  title: string;
  data: unknown[];
}

export interface ExecutableConfig {
  report: ReportConfig;
  data: DataItemConfig[];
  actions: ActionConfig[];
  meta?: Record<string, unknown>;
  deprecated?: DeprecatedConfig;
}

export interface DataItemConfig {
  title: string;
  tag: string;
  source: unknown;
  enhance?: string;
}

export interface ActionConfig {
  type: string;
  on: 'data_ready' | 'report_ready' | 'report_archived';
  renderMode?: RenderMode;
  spec: Record<string, unknown>;
}

export interface DeprecatedConfig {
  status: 'redirect' | 'deprecated';
  redirectTo?: string;
  message?: string;
}
