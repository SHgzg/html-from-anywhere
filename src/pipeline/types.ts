/**
 * Pipeline type definitions
 * Defines the configuration and types for the data pipeline system
 */

/**
 * Authentication configuration for HTTP requests
 */
export interface AuthConfig {
  type: 'basic' | 'bearer' | 'apikey' | 'oauth2';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
}

/**
 * Data source configuration
 */
export interface SourceConfig {
  type: 'http' | 'file' | 'database' | 'string';
  // HTTP/HTTPS
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  auth?: AuthConfig;
  body?: any;
  timeout?: number;
  // File
  path?: string;
  encoding?: BufferEncoding;
  // Database
  query?: string;
  connection?: string;
  params?: any[];
  // String
  data?: any;
}

/**
 * Filter rule definition
 */
export interface FilterRule {
  field?: string;                  // Field path (supports dot notation: 'user.name')
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'contains' | 'regex' | 'exists';
  value?: any;
  values?: any[];                  // For 'in' operator
  pattern?: string;                // For 'regex' operator
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  type: 'field' | 'value' | 'custom';
  rules: FilterRule[];
  customFn?: string;               // Function name for custom filter
}

/**
 * Formatter configuration
 */
export interface FormatterConfig {
  type: 'json' | 'csv' | 'xml' | 'html' | 'custom';
  options?: {
    // JSON options
    arrayPath?: string;            // JSONPath to extract array
    reviver?: (key: string, value: any) => any;

    // CSV options
    delimiter?: string;
    headers?: boolean | string[];
    from_line?: number;

    // XML options
    xpath?: string;

    // Custom options
    transformFn?: string;
    [key: string]: any;
  };
}

/**
 * Error handling configuration
 */
export interface ErrorConfig {
  strategy: 'throw' | 'skip' | 'default' | 'retry';
  defaultValue?: any;
  maxRetries?: number;
  logError?: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  backoff: number;                 // Backoff time in milliseconds
  exponentialBackoff?: boolean;    // Use exponential backoff
}

/**
 * Condition configuration for conditional fetching
 */
export interface ConditionConfig {
  when?: string;                   // Expression to evaluate
  filter?: FilterConfig;           // Pre-fetch filter
  transform?: TransformConfig;     // Pre-fetch transform
}

/**
 * Transform configuration
 */
export interface TransformConfig {
  type: 'map' | 'reduce' | 'pick' | 'omit' | 'custom';
  options?: any;
}

/**
 * Process configuration
 */
export interface ProcessConfig {
  formatter: FormatterConfig;
  filter?: FilterConfig;
  error: ErrorConfig;
}

/**
 * Fetcher configuration
 */
export interface FetcherConfig {
  id: string;                      // Unique identifier for the fetcher
  source: SourceConfig;
  condition?: ConditionConfig;
  process: ProcessConfig;
  retry?: RetryConfig;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Post-process configuration for aggregation
 */
export interface PostProcessConfig {
  filter?: FilterConfig;
  formatter?: FormatterConfig;
  sort?: SortConfig;
  limit?: number;
  offset?: number;
  error?: ErrorConfig;
}

/**
 * Aggregate configuration
 */
export interface AggregateConfig {
  fetchers: string[];              // List of fetcher IDs to execute
  strategy: 'merge' | 'concat' | 'custom';
  postProcess?: PostProcessConfig;
  parallel?: boolean;              // Execute fetchers in parallel
  maxParallel?: number;            // Maximum number of parallel fetchers
}

/**
 * Pipeline result metadata
 */
export interface PipelineResultMetadata {
  fetcherId: string;
  timestamp: number;
  duration: number;
  success: boolean;
  cached?: boolean;
}

/**
 * Pipeline result
 */
export interface PipelineResult {
  success: boolean;
  data: any;
  errors: Error[];
  metadata: PipelineResultMetadata;
}

/**
 * Pipeline execution context
 */
export interface PipelineContext {
  variables: Record<string, any>;  // Variables that can be used in expressions
  results: Map<string, PipelineResult>; // Results from previous fetchers
  timestamp: number;
}

/**
 * Expression evaluation context
 */
export interface ExpressionContext {
  data: any;
  variables: Record<string, any>;
  result?: PipelineResult;
}
