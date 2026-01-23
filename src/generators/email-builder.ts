/**
 * Email Builder
 * Builds email-compatible HTML from processed data
 */

import { writeFile } from 'fs/promises';
import { ProcessedData, EmailConfig } from '../types';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export class EmailBuilder {
  private subject?: string;
  private from?: string;
  private to: string[] = [];
  private cc: string[] = [];
  private bcc: string[] = [];
  private template?: string;
  private contentParts: string[] = [];
  private emailConfig: EmailConfig = {};

  /**
   * Set email subject
   */
  setSubject(subject: string): this {
    this.subject = subject;
    this.emailConfig.subject = subject;
    return this;
  }

  /**
   * Set from address
   */
  setFrom(from: string): this {
    this.from = from;
    this.emailConfig.from = from;
    return this;
  }

  /**
   * Add to recipient
   */
  addTo(email: string): this {
    this.to.push(email);
    this.emailConfig.to = this.to;
    return this;
  }

  /**
   * Add CC recipient
   */
  addCc(email: string): this {
    this.cc.push(email);
    this.emailConfig.cc = this.cc;
    return this;
  }

  /**
   * Add BCC recipient
   */
  addBcc(email: string): this {
    this.bcc.push(email);
    this.emailConfig.bcc = this.bcc;
    return this;
  }

  /**
   * Set template
   */
  setTemplate(template: string): this {
    this.template = template;
    this.emailConfig.template = template;
    return this;
  }

  /**
   * Add processed data content
   */
  addData(data: ProcessedData): this {
    const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    this.contentParts.push(content);
    return this;
  }

  /**
   * Add raw HTML content
   */
  addHtml(html: string): this {
    this.contentParts.push(html);
    return this;
  }

  /**
   * Add text content
   */
  addText(text: string): this {
    const escaped = this.escapeHtml(text);
    this.contentParts.push(`<p>${escaped}</p>`);
    return this;
  }

  /**
   * Build complete HTML email
   */
  build(): string {
    const template = this.loadTemplate();
    const compiledTemplate = Handlebars.compile(template);

    const content = this.contentParts.join('\n');

    const html = compiledTemplate({
      subject: this.subject || 'No Subject',
      content,
      year: new Date().getFullYear(),
      company: 'Your Company',
      from: this.from,
      to: this.to.join(', '),
    });

    return this.inlineStyles(html);
  }

  /**
   * Load email template
   */
  private loadTemplate(): string {
    if (this.template) {
      // Try to load from file
      const templatePath = path.join(process.cwd(), 'templates', `${this.template}.html`);
      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
      }
    }

    // Use default template
    const defaultTemplatePath = path.join(__dirname, '../../templates/default.html');
    if (fs.existsSync(defaultTemplatePath)) {
      return fs.readFileSync(defaultTemplatePath, 'utf-8');
    }

    // Fallback to simple template
    return this.getFallbackTemplate();
  }

  /**
   * Get fallback template
   */
  private getFallbackTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333;">{{subject}}</h1>
  {{content}}
</body>
</html>
    `;
  }

  /**
   * Inline CSS styles for email compatibility
   */
  private inlineStyles(html: string): string {
    // Styles are already inlined in the template
    // This method could be enhanced with a CSS inlining library like juice
    return html;
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
   * Save HTML to file
   */
  async save(filePath: string): Promise<void> {
    const html = this.build();
    await writeFile(filePath, html, 'utf-8');
  }

  /**
   * Reset builder state
   */
  reset(): this {
    this.subject = undefined;
    this.from = undefined;
    this.to = [];
    this.cc = [];
    this.bcc = [];
    this.template = undefined;
    this.contentParts = [];
    this.emailConfig = {};
    return this;
  }

  /**
   * Get email configuration
   */
  getConfig(): EmailConfig {
    return { ...this.emailConfig };
  }
}
