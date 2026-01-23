/**
 * Base processor class
 * All processors should extend this class
 */

import { DataProcessor, ProcessedData } from '../types';

export abstract class Processor implements DataProcessor {
  /**
   * Process raw data
   */
  abstract process(data: any): ProcessedData | Promise<ProcessedData>;

  /**
   * Create processed data object
   */
  protected createProcessedData(
    type: ProcessedData['type'],
    content: string | any,
    metadata?: Record<string, any>
  ): ProcessedData {
    return {
      type,
      content,
      metadata,
    };
  }
}
