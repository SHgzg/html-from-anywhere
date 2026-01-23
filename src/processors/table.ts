/**
 * Table Processor
 * Converts data to HTML table format
 */

import { Processor } from './base';
import { ProcessedData, TableOptions } from '../types';

export class TableProcessor extends Processor {
  private options: TableOptions;

  constructor(options: TableOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Process data into HTML table
   */
  process(data: any): ProcessedData {
    // Ensure data is an array
    const items = Array.isArray(data) ? data : [data];

    if (items.length === 0) {
      return this.createProcessedData('table', '<p>No data available</p>');
    }

    // Get headers
    const headers = this.getHeaders(items);

    // Generate table HTML
    const html = this.generateTable(headers, items);

    return this.createProcessedData('table', html, {
      rowCount: items.length,
      columnCount: headers.length,
    });
  }

  /**
   * Get table headers
   */
  private getHeaders(items: any[]): string[] {
    if (this.options.headers) {
      return this.options.headers;
    }

    // Extract headers from first object
    const firstItem = items[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      return Object.keys(firstItem);
    }

    return ['Value'];
  }

  /**
   * Generate HTML table
   */
  private generateTable(headers: string[], items: any[]): string {
    const style = this.getTableStyle();
    let html = '<table style="' + style + '">';

    // Add header row
    if (this.options.includeHeaders !== false) {
      html += '<thead><tr>';
      for (const header of headers) {
        html += `<th style="${this.getHeaderStyle()}">${this.escapeHtml(header)}</th>`;
      }
      html += '</tr></thead>';
    }

    // Add data rows
    html += '<tbody>';
    for (const item of items) {
      html += '<tr>';
      for (const header of headers) {
        const value = this.getValue(item, header);
        html += `<td style="${this.getCellStyle()}">${this.escapeHtml(String(value ?? ''))}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';

    html += '</table>';
    return html;
  }

  /**
   * Get value from item by header
   */
  private getValue(item: any, header: string): any {
    if (typeof item === 'object' && item !== null) {
      return item[header];
    }
    return item;
  }

  /**
   * Get table style
   */
  private getTableStyle(): string {
    const baseStyle = 'width: 100%; border-collapse: collapse;';
    const styleMap = {
      default: 'border: 1px solid #ddd;',
      bordered: 'border: 2px solid #333;',
      striped: '',
      minimal: '',
    };

    return baseStyle + (styleMap[this.options.style || 'default'] || styleMap.default);
  }

  /**
   * Get header cell style
   */
  private getHeaderStyle(): string {
    return [
      'background-color: #f2f2f2;',
      'padding: 8px;',
      'text-align: left;',
      'font-weight: bold;',
      'border: 1px solid #ddd;',
    ].join(' ');
  }

  /**
   * Get data cell style
   */
  private getCellStyle(): string {
    const styles = [
      'padding: 8px;',
      'border: 1px solid #ddd;',
    ];

    // Add striped style
    if (this.options.style === 'striped') {
      styles.push('background-color: #f9f9f9;');
    }

    return styles.join(' ');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}
