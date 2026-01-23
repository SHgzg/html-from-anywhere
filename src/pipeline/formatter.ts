/**
 * Formatter class
 * Formats data from various sources
 */

import { FormatterConfig } from './types';

export class Formatter {
  private config: FormatterConfig;

  constructor(config: FormatterConfig) {
    this.config = config;
  }

  /**
   * Format data based on configuration
   */
  async format(data: any): Promise<any> {
    switch (this.config.type) {
      case 'json':
        return this.formatJson(data);
      case 'csv':
        return this.formatCsv(data);
      case 'xml':
        return this.formatXml(data);
      case 'html':
        return this.formatHtml(data);
      case 'custom':
        return this.formatCustom(data);
      default:
        throw new Error(`Unknown formatter type: ${this.config.type}`);
    }
  }

  /**
   * Format JSON data
   */
  private formatJson(data: any): any {
    const options = this.config.options || {};

    // If data is already an object, return it
    if (typeof data === 'object') {
      // Extract array using JSONPath if specified
      if (options.arrayPath) {
        return this.extractByPath(data, options.arrayPath);
      }
      return data;
    }

    // Parse JSON string
    try {
      const parsed = JSON.parse(data);
      if (options.arrayPath) {
        return this.extractByPath(parsed, options.arrayPath);
      }
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  /**
   * Format CSV data
   */
  private async formatCsv(data: any): Promise<any[]> {
    const { parse } = await import('csv-parse/sync');
    const options = this.config.options || {};

    if (typeof data !== 'string') {
      data = String(data);
    }

    const records = parse(data, {
      columns: options.headers ?? true,
      delimiter: options.delimiter || ',',
      from_line: options.from_line || 1,
      skip_empty_lines: true,
    });

    return records;
  }

  /**
   * Format XML data
   */
  private formatXml(data: any): any {
    // XML parsing would be implemented here
    // For now, return as-is
    // In production, use xml2js or similar library
    return data;
  }

  /**
   * Format HTML data
   */
  private formatHtml(data: any): any {
    // Return HTML as-is
    // Could extract specific elements using Cheerio if needed
    return data;
  }

  /**
   * Format using custom function
   */
  private formatCustom(data: any): any {
    const options = this.config.options || {};
    const transformFn = options.transformFn;

    if (!transformFn) {
      return data;
    }

    // Custom transformation would be implemented here
    // For now, return as-is
    // In production, could load custom functions from a file
    return data;
  }

  /**
   * Extract data from object using path
   */
  private extractByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current == null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }
}
