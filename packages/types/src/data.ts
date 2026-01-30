/**
 * DataResult - 数据处理完成后的标准化结果
 */

export interface DataResult {
  title: string;
  tag: string;
  data: unknown;
  meta?: Record<string, unknown>;
}
