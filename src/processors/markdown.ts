/**
 * Markdown Processor
 * Converts Markdown to HTML
 */

import { Processor } from './base';
import { ProcessedData, MarkdownOptions } from '../types';
import { marked } from 'marked';

export class MarkdownProcessor extends Processor {
  private options: MarkdownOptions;

  constructor(options: MarkdownOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Process Markdown to HTML
   */
  async process(data: any): Promise<ProcessedData> {
    // Convert data to string
    const markdown = this.convertToString(data);

    // Configure marked options
    this.configureMarked();

    // Convert to HTML
    const html = await marked.parse(markdown);

    // Wrap in div with inline styles for email compatibility
    const styledHtml = this.wrapWithStyles(html);

    return this.createProcessedData('markdown', styledHtml, {
      length: markdown.length,
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
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  }

  /**
   * Configure marked options
   */
  private configureMarked(): void {
    marked.setOptions({
      breaks: this.options.breaks ?? false,
      gfm: true,
    });
  }

  /**
   * Wrap HTML with email-compatible inline styles
   */
  private wrapWithStyles(html: string): string {
    // Add base styles for markdown elements
    const styles = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        ${this.applyInlineStyles(html)}
      </div>
    `;

    return styles;
  }

  /**
   * Apply inline styles to markdown HTML elements
   */
  private applyInlineStyles(html: string): string {
    // Style headings
    html = html.replace(/<h1([^>]*)>/g, '<h1$1 style="font-size: 24px; font-weight: bold; margin: 20px 0 10px;">');
    html = html.replace(/<h2([^>]*)>/g, '<h2$1 style="font-size: 20px; font-weight: bold; margin: 18px 0 8px;">');
    html = html.replace(/<h3([^>]*)>/g, '<h3$1 style="font-size: 18px; font-weight: bold; margin: 16px 0 6px;">');
    html = html.replace(/<h4([^>]*)>/g, '<h4$1 style="font-size: 16px; font-weight: bold; margin: 14px 0 4px;">');
    html = html.replace(/<h5([^>]*)>/g, '<h5$1 style="font-size: 14px; font-weight: bold; margin: 12px 0 2px;">');
    html = html.replace(/<h6([^>]*)>/g, '<h6$1 style="font-size: 12px; font-weight: bold; margin: 10px 0;">');

    // Style paragraphs
    html = html.replace(/<p>/g, '<p style="margin: 10px 0;">');

    // Style links
    html = html.replace(/<a /g, '<a style="color: #0066cc; text-decoration: underline;" ');

    // Style bold and italic
    html = html.replace(/<strong>/g, '<strong style="font-weight: bold;">');
    html = html.replace(/<em>/g, '<em style="font-style: italic;">');

    // Style lists
    html = html.replace(/<ul>/g, '<ul style="margin: 10px 0; padding-left: 20px;">');
    html = html.replace(/<ol>/g, '<ol style="margin: 10px 0; padding-left: 20px;">');
    html = html.replace(/<li>/g, '<li style="margin: 5px 0;">');

    // Style code blocks
    html = html.replace(/<pre>/g, '<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto;">');
    html = html.replace(/<code>/g, '<code style="background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;">');

    // Style blockquotes
    html = html.replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #ddd; padding-left: 10px; margin: 10px 0; color: #666;">');

    // Style tables
    html = html.replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">');
    html = html.replace(/<th>/g, '<th style="background-color: #f2f2f2; padding: 8px; border: 1px solid #ddd; text-align: left;">');
    html = html.replace(/<td>/g, '<td style="padding: 8px; border: 1px solid #ddd;">');

    // Style horizontal rules
    html = html.replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">');

    return html;
  }
}
