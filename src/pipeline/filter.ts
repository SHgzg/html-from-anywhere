/**
 * Filter class
 * Filters data based on configured rules
 */

import { FilterConfig, FilterRule } from './types';
import { ExpressionEvaluator } from '../utils/expression';

export class Filter {
  private config: FilterConfig;

  constructor(config: FilterConfig) {
    this.config = config;
  }

  /**
   * Apply filter to data
   */
  async apply(data: any): Promise<any> {
    switch (this.config.type) {
      case 'field':
        return this.filterByFields(data);
      case 'value':
        return this.filterByValues(data);
      case 'custom':
        return this.filterCustom(data);
      default:
        throw new Error(`Unknown filter type: ${this.config.type}`);
    }
  }

  /**
   * Filter by field rules
   */
  private filterByFields(data: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter((item) => this.matchesRules(item, this.config.rules));
  }

  /**
   * Filter by value rules
   */
  private filterByValues(data: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter((item) => {
      // Check if any rule matches the item's value
      return this.config.rules.some((rule) => this.matchesRule(item, rule));
    });
  }

  /**
   * Custom filter function
   */
  private filterCustom(data: any): any {
    const customFn = this.config.customFn;
    if (!customFn) {
      return data;
    }

    // Custom filtering would be implemented here
    // For now, return as-is
    return data;
  }

  /**
   * Check if item matches all rules
   */
  private matchesRules(item: any, rules: FilterRule[]): boolean {
    return rules.every((rule) => this.matchesRule(item, rule));
  }

  /**
   * Check if item matches a single rule
   */
  private matchesRule(item: any, rule: FilterRule): boolean {
    // Get field value if field is specified
    let value = item;
    if (rule.field) {
      value = ExpressionEvaluator.getByPath(item, rule.field);
    }

    return ExpressionEvaluator.matchesRule(value, rule);
  }
}
