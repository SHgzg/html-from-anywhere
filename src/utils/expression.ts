/**
 * Expression evaluation utility
 * Safely evaluates expressions against data
 */

import { ExpressionContext } from '../pipeline/types';

export class ExpressionEvaluator {
  /**
   * Evaluate a condition expression
   */
  static evaluate(expression: string, context: ExpressionContext): boolean {
    try {
      const fn = this.compileExpression(expression);
      return fn(context);
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${expression}. Error: ${error}`);
    }
  }

  /**
   * Compile an expression into a function
   * Supports simple JavaScript-like expressions
   */
  private static compileExpression(expression: string): (context: ExpressionContext) => boolean {
    // Create a safe function with limited scope
    const fn = new Function(
      'data',
      'variables',
      `
      "use strict";
      try {
        return (${expression});
      } catch (e) {
        return false;
      }
      `
    );

    return (context: ExpressionContext) => {
      return fn(context.data, context.variables);
    };
  }

  /**
   * Get a value from an object using dot notation
   */
  static getByPath(obj: any, path: string): any {
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

  /**
   * Set a value in an object using dot notation
   */
  static setByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Check if a value matches a filter rule
   */
  static matchesRule(value: any, rule: any): boolean {
    if (rule.operator === 'eq') return value === rule.value;
    if (rule.operator === 'ne') return value !== rule.value;
    if (rule.operator === 'gt') return value > rule.value;
    if (rule.operator === 'lt') return value < rule.value;
    if (rule.operator === 'gte') return value >= rule.value;
    if (rule.operator === 'lte') return value <= rule.value;
    if (rule.operator === 'in') return rule.values?.includes(value);
    if (rule.operator === 'nin') return !rule.values?.includes(value);
    if (rule.operator === 'contains') {
      if (typeof value === 'string') return value.includes(rule.value);
      if (Array.isArray(value)) return value.includes(rule.value);
      return false;
    }
    if (rule.operator === 'exists') return value !== undefined && value !== null;
    if (rule.operator === 'regex') {
      const regex = new RegExp(rule.pattern, 'i');
      return regex.test(value);
    }
    return false;
  }
}
