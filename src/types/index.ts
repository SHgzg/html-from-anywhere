/**
 * Global type definitions for HTML Email Generator
 */

/**
 * Raw data from any source
 */
export type RawData = any;

/**
 * Processed data ready for email generation
 */
export interface ProcessedData {
  type: 'table' | 'image' | 'text' | 'markdown' | 'custom';
  content: string | any;
  metadata?: Record<string, any>;
}

/**
 * Data processor interface
 */
export interface DataProcessor {
  process(data: RawData): ProcessedData | Promise<ProcessedData>;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  subject?: string;
  from?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  template?: string;
}

/**
 * Table processing options
 */
export interface TableOptions {
  headers?: string[];
  style?: 'default' | 'bordered' | 'striped' | 'minimal';
  includeHeaders?: boolean;
  sortable?: boolean;
  pageSize?: number;
}

/**
 * Image processing options
 */
export interface ImageOptions {
  format: 'base64' | 'cid' | 'url';
  width?: number;
  height?: number;
  quality?: number;
  imageFormat?: 'png' | 'jpg' | 'webp';
  watermark?: WatermarkConfig;
  border?: BorderConfig;
}

export interface WatermarkConfig {
  text: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
}

export interface BorderConfig {
  width?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Text processing options
 */
export interface TextOptions {
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontFamily?: string;
  lineHeight?: number;
  maxLength?: number;
  truncate?: boolean;
  autoLink?: boolean;
}

/**
 * Markdown processing options
 */
export interface MarkdownOptions {
  highlight?: boolean;
  tables?: boolean;
  breaks?: boolean;
  sanitize?: boolean;
}
