/**
 * Text Processor
 * Processes text content with styling
 */

import { Processor } from './base';
import { ProcessedData, TextOptions } from '../types';

export class TextProcessor extends Processor {
  private options: TextOptions;

  constructor(options: TextOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Process text with styling
   */
  process(data: any): ProcessedData {
    // Convert data to string
    let text = this.convertToString(data);

    // Apply truncation
    if (this.options.maxLength && this.options.truncate) {
      text = this.truncate(text, this.options.maxLength);
    }

    // Escape HTML
    text = this.escapeHtml(text);

    // Auto-link URLs
    if (this.options.autoLink) {
      text = this.autoLink(text);
    }

    // Wrap in styled span
    const html = this.wrapWithStyle(text);

    return this.createProcessedData('text', html, {
      length: text.length,
      truncated: this.options.truncate && text.length >= (this.options.maxLength || 0),
    });
  }

  /**
   * Convert data to string
   */
  private convertToString(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    if (data === null || data === undefined) {
      return '';
    }
    if (typeof data === 'object') {
      return JSON.stringify(data);
    }
    return String(data);
  }

  /**
   * Truncate text to max length
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
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

  /**
   * Auto-link URLs in text
   */
  private autoLink(text: string): string {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return text.replace(urlRegex, '<a href="$1" style="color: #0066cc;">$1</a>');
  }

  /**
   * Wrap text with style
   */
  private wrapWithStyle(text: string): string {
    const styles: string[] = [];

    if (this.options.align) {
      styles.push(`text-align: ${this.options.align};`);
    }
    if (this.options.color) {
      styles.push(`color: ${this.options.color};`);
    }
    if (this.options.fontSize) {
      styles.push(`font-size: ${this.options.fontSize}px;`);
    }
    if (this.options.fontWeight) {
      styles.push(`font-weight: ${this.options.fontWeight};`);
    }
    if (this.options.fontFamily) {
      styles.push(`font-family: ${this.options.fontFamily};`);
    }
    if (this.options.lineHeight) {
      styles.push(`line-height: ${this.options.lineHeight};`);
    }

    const styleAttr = styles.length > 0 ? ` style="${styles.join(' ')}"` : '';
    return `<span${styleAttr}>${text}</span>`;
  }
}
