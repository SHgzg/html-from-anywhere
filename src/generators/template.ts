/**
 * Template Engine
 * Manages email templates using Handlebars
 */

import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export class TemplateEngine {
  private templatesDir: string;
  private cache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(templatesDir: string = 'templates') {
    this.templatesDir = templatesDir;
    this.registerHelpers();
  }

  /**
   * Load and compile template
   */
  loadTemplate(name: string): HandlebarsTemplateDelegate {
    // Check cache first
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    // Load template file
    const templatePath = path.join(this.templatesDir, `${name}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(source);

    // Cache template
    this.cache.set(name, template);

    return template;
  }

  /**
   * Render template with data
   */
  render(name: string, data: Record<string, any>): string {
    const template = this.loadTemplate(name);
    return template(data);
  }

  /**
   * Render template string with data
   */
  renderString(templateString: string, data: Record<string, any>): string {
    const template = Handlebars.compile(templateString);
    return template(data);
  }

  /**
   * Register custom helpers
   */
  private registerHelpers(): void {
    // Date format helper
    Handlebars.registerHelper('dateFormat', (date: Date, format: string) => {
      // Simple date formatting
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    });

    // JSON stringify helper
    Handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj);
    });

    // Equals helper
    Handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // Not equals helper
    Handlebars.registerHelper('ne', (a: any, b: any) => {
      return a !== b;
    });

    // If helper
    Handlebars.registerHelper('if', function (this: any, conditional: any, options: any) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Unless helper
    Handlebars.registerHelper('unless', function (this: any, conditional: any, options: any) {
      if (!conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Each helper (built-in to Handlebars, but ensuring it works)
    Handlebars.registerHelper('each', function (context: any, options: any) {
      let ret = '';
      if (Array.isArray(context)) {
        for (let i = 0; i < context.length; i++) {
          ret += options.fn(context[i], {
            data: {
              index: i,
              first: i === 0,
              last: i === context.length - 1,
            },
          });
        }
      } else if (typeof context === 'object') {
        const keys = Object.keys(context);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          ret += options.fn({ key, value: context[key] }, {
            data: {
              index: i,
              first: i === 0,
              last: i === keys.length - 1,
              key,
            },
          });
        }
      }
      return ret;
    });
  }

  /**
   * Register custom helper
   */
  registerHelper(name: string, fn: (...args: any[]) => string): void {
    Handlebars.registerHelper(name, fn);
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
