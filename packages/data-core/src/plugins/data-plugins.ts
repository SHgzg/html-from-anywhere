/**
 * Real Data Plugins
 *
 * 真实的数据获取插件实现
 */

import { DataPlugin, DataItemConfig, RuntimeContext, DataResult, DataSourceType } from '@report-tool/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as glob from 'glob';

// ============================================================================
// File Type Helpers
// ============================================================================

/**
 * 获取文件扩展名（小写）
 */
function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

/**
 * 检查是否为图片文件
 */
function isImageFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];
  return imageExtensions.includes(ext);
}

/**
 * 检查是否为 CSV 文件
 */
function isCsvFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ext === 'csv';
}

/**
 * 解析 CSV 内容为二维数组
 */
function parseCsv(content: string, delimiter = ','): string[][] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 转义的引号
        currentLine += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentLine += '\0'; // 使用空字符作为字段分隔符
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // 跳过 \n
      }
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine || inQuotes) {
    lines.push(currentLine);
  }

  // 将每行按分隔符切分
  return lines.map(line => line.split('\0'));
}

/**
 * 将 CSV 二维数组转换为对象数组
 */
function csvToArray(csvData: string[][]): Record<string, unknown>[] {
  if (csvData.length === 0) {
    return [];
  }

  const headers = csvData[0];
  const rows = csvData.slice(1);

  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      let value: string | number = row[index] || '';

      // 尝试转换为数字
      if (value && !isNaN(Number(value))) {
        value = Number(value);
      }

      obj[header] = value;
    });
    return obj;
  });
}

/**
 * 将文件转换为 base64 编码
 */
async function fileToBase64(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return content.toString('base64');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make HTTPS request
 */
async function makeHttpsRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<string> {
  const { https } = await import('follow-redirects');

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      method,
      headers,
      maxRedirects: 5
    };

    const req = https.request({
      ...options,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : undefined),
      path: parsedUrl.pathname + parsedUrl.search
    }, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Make HTTP request
 */
async function makeHttpRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<string> {
  const { http } = await import('follow-redirects');

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      method,
      headers,
      maxRedirects: 5
    };

    const req = http.request({
      ...options,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'http:' ? 80 : undefined),
      path: parsedUrl.pathname + parsedUrl.search
    }, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Fetch data from MongoDB
 */
async function fetchFromMongoDB(
  sourceConfig: Record<string, unknown>,
  config: DataItemConfig,
  context: RuntimeContext
): Promise<DataResult> {
  const { MongoClient } = await import('mongodb');

  const uri = (sourceConfig.uri as string) ||
              (context.envConfig?.userConfigDB?.uri as string) ||
              'mongodb://localhost:27017';
  const database = sourceConfig.database as string;
  const collection = sourceConfig.collection as string;
  const query = sourceConfig.query as Record<string, unknown> || {};
  const options = sourceConfig.options as Record<string, unknown> || {};

  console.log(`  [DB Plugin] MongoDB: ${database}.${collection}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(database);
    const coll = db.collection(collection);

    const results = await coll.find(query, options).toArray();

    return {
      title: config.title,
      tag: `mongodb://${database}/${collection}`,
      data: results,
      meta: {
        timestamp: new Date().toISOString(),
        database,
        collection,
        count: results.length,
        dataType: 'table',
        rows: results.length,
        columns: results.length > 0 ? Object.keys(results[0]).length : 0
      }
    };
  } catch (error) {
    throw new Error(`MongoDB query failed: ${(error as Error).message}`);
  } finally {
    await client.close();
  }
}

// ============================================================================
// Data Plugins
// ============================================================================

/**
 * Inline Data Plugin
 *
 * 处理内联数据源，直接返回 source 中的数据
 */
export const inlineDataPlugin: DataPlugin = {
  name: 'inline-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'inline',

  validate(config: DataItemConfig): boolean {
    return true;
  },

  async fetch(config: DataItemConfig, _context: RuntimeContext): Promise<DataResult> {
    console.log(`  [Inline Plugin] Processing: ${config.title}`);

    let data: unknown;
    let meta: Record<string, unknown> = {
      timestamp: new Date().toISOString()
    };

    if (typeof config.source === 'object') {
      data = config.source;
      // 如果是数组，标记为表格数据
      if (Array.isArray(config.source)) {
        meta.dataType = 'table';
        meta.rows = config.source.length;
        if (config.source.length > 0 && typeof config.source[0] === 'object' && config.source[0] !== null) {
          meta.columns = Object.keys(config.source[0]).length;
        }
      } else {
        meta.dataType = 'object';
      }
    } else if (typeof config.source === 'string') {
      try {
        const parsed = JSON.parse(config.source);
        data = parsed;
        // 如果解析后是数组，标记为表格数据
        if (Array.isArray(parsed)) {
          meta.dataType = 'table';
          meta.rows = parsed.length;
          if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
            meta.columns = Object.keys(parsed[0]).length;
          }
        } else {
          meta.dataType = typeof parsed === 'object' ? 'object' : 'text';
        }
      } catch {
        data = config.source;
        meta.dataType = 'text';
      }
    } else {
      data = config.source;
      meta.dataType = 'text';
    }

    return {
      title: config.title,
      tag: 'inline',
      data,
      meta
    };
  }
};

/**
 * File Data Plugin
 *
 * 从本地文件系统读取数据
 */
export const fileDataPlugin: DataPlugin = {
  name: 'file-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'file',

  validate(config: DataItemConfig): boolean {
    if (typeof config.source !== 'string') {
      return false;
    }
    const filePath = config.source as string;
    return filePath.startsWith('/') || filePath.startsWith('./') || filePath.startsWith('../');
  },

  async fetch(config: DataItemConfig, _context: RuntimeContext): Promise<DataResult> {
    const filePath = config.source as string;
    console.log(`  [File Plugin] Reading: ${filePath}`);

    try {
      let resolvedPath = filePath;
      if (!path.isAbsolute(filePath)) {
        resolvedPath = path.resolve(process.cwd(), filePath);
      }

      const ext = getFileExtension(filePath);
      let data: unknown;
      let meta: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        path: resolvedPath,
        fileType: ext
      };

      // 1. 处理图片文件 - 转换为 base64
      if (isImageFile(filePath)) {
        console.log(`  [File Plugin] Detected image file, converting to base64...`);
        const base64 = await fileToBase64(resolvedPath);
        data = {
          format: ext,
          encoding: 'base64',
          data: base64
        };
        meta.dataType = 'image';
        meta.encoding = 'base64';
        meta.format = ext;
      }
      // 2. 处理 CSV 文件 - 解析为表格数据
      else if (isCsvFile(filePath)) {
        console.log(`  [File Plugin] Detected CSV file, parsing as table...`);
        const content = await fs.readFile(resolvedPath, 'utf-8');
        const csvData = parseCsv(content);
        data = csvToArray(csvData);
        meta.dataType = 'table';
        meta.format = 'csv';
        meta.rows = csvData.length;
        meta.columns = csvData[0]?.length || 0;
      }
      // 3. 处理 JSON 文件 - 尝试解析为表格数据
      else if (ext === 'json') {
        console.log(`  [File Plugin] Detected JSON file, parsing...`);
        const content = await fs.readFile(resolvedPath, 'utf-8');
        try {
          const jsonData = JSON.parse(content);

          // 如果是数组，作为表格数据处理
          if (Array.isArray(jsonData)) {
            console.log(`  [File Plugin] JSON is an array, treating as table data...`);
            data = jsonData;
            meta.dataType = 'table';
            meta.format = 'json';
            meta.rows = jsonData.length;

            // 获取列数（从第一个对象）
            if (jsonData.length > 0 && typeof jsonData[0] === 'object' && jsonData[0] !== null) {
              meta.columns = Object.keys(jsonData[0]).length;
            }
          } else {
            // 其他 JSON 类型作为普通对象处理
            data = jsonData;
            meta.dataType = 'object';
            meta.format = 'json';
          }
        } catch {
          // JSON 解析失败，作为文本返回
          data = content;
          meta.dataType = 'text';
          meta.format = 'text';
        }
      }
      // 4. 其他文件类型 - 作为文本读取
      else {
        const content = await fs.readFile(resolvedPath, 'utf-8');
        data = content;
        meta.dataType = 'text';
        meta.format = 'text';
      }

      return {
        title: config.title,
        tag: filePath,
        data,
        meta
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath} - ${(error as Error).message}`);
    }
  }
};

/**
 * HTTPS Data Plugin
 *
 * 通过 HTTPS 请求获取数据
 */
export const httpsDataPlugin: DataPlugin = {
  name: 'https-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'https',

  validate(config: DataItemConfig): boolean {
    if (typeof config.source === 'string') {
      return config.source.startsWith('https://');
    }
    if (typeof config.source === 'object' && config.source !== null) {
      const obj = config.source as Record<string, unknown>;
      return typeof obj.url === 'string' && obj.url.startsWith('https://');
    }
    return false;
  },

  async fetch(config: DataItemConfig, _context: RuntimeContext): Promise<DataResult> {
    let url: string;
    let method = 'GET';
    let headers: Record<string, string> = {};
    let body: string | undefined;

    if (typeof config.source === 'string') {
      url = config.source;
    } else {
      const obj = config.source as Record<string, unknown>;
      url = obj.url as string;
      method = (obj.method as string) || 'GET';
      headers = (obj.headers as Record<string, string>) || {};
      body = obj.body as string | undefined;
    }

    console.log(`  [HTTPS Plugin] Fetching: ${method} ${url}`);

    try {
      const result = await makeHttpsRequest(url, method, headers, body);

      let data: unknown;
      try {
        data = JSON.parse(result);
      } catch {
        data = result;
      }

      return {
        title: config.title,
        tag: url,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          url,
          method,
          status: 'success'
        }
      };
    } catch (error) {
      throw new Error(`HTTPS request failed: ${url} - ${(error as Error).message}`);
    }
  }
};

/**
 * HTTP Data Plugin
 *
 * 通过 HTTP 请求获取数据
 */
export const httpDataPlugin: DataPlugin = {
  name: 'http-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'http',

  validate(config: DataItemConfig): boolean {
    if (typeof config.source === 'string') {
      return config.source.startsWith('http://');
    }
    if (typeof config.source === 'object' && config.source !== null) {
      const obj = config.source as Record<string, unknown>;
      return typeof obj.url === 'string' && obj.url.startsWith('http://');
    }
    return false;
  },

  async fetch(config: DataItemConfig, _context: RuntimeContext): Promise<DataResult> {
    let url: string;
    let method = 'GET';
    let headers: Record<string, string> = {};
    let body: string | undefined;

    if (typeof config.source === 'string') {
      url = config.source;
    } else {
      const obj = config.source as Record<string, unknown>;
      url = obj.url as string;
      method = (obj.method as string) || 'GET';
      headers = (obj.headers as Record<string, string>) || {};
      body = obj.body as string | undefined;
    }

    console.log(`  [HTTP Plugin] Fetching: ${method} ${url}`);

    try {
      const result = await makeHttpRequest(url, method, headers, body);

      let data: unknown;
      try {
        data = JSON.parse(result);
      } catch {
        data = result;
      }

      return {
        title: config.title,
        tag: url,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          url,
          method,
          status: 'success'
        }
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${url} - ${(error as Error).message}`);
    }
  }
};

/**
 * Glob Data Plugin
 *
 * 使用 glob 模式匹配多个文件并读取数据
 */
export const globDataPlugin: DataPlugin = {
  name: 'glob-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'glob',

  validate(config: DataItemConfig): boolean {
    if (typeof config.source !== 'string') {
      return false;
    }
    const pattern = config.source as string;
    return pattern.includes('*') || pattern.includes('?') || pattern.includes('[');
  },

  async fetch(config: DataItemConfig, _context: RuntimeContext): Promise<DataResult> {
    const pattern = config.source as string;
    console.log(`  [Glob Plugin] Matching: ${pattern}`);

    try {
      const files = await glob.glob(pattern, {
        cwd: process.cwd(),
        absolute: false,
        nodir: true
      });

      console.log(`  [Glob Plugin] Found ${files.length} file(s)`);

      const results: Array<{ file: string; content: unknown }> = [];

      for (const file of files) {
        try {
          const resolvedPath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
          const content = await fs.readFile(resolvedPath, 'utf-8');

          let parsedContent: unknown;
          try {
            parsedContent = JSON.parse(content);
          } catch {
            parsedContent = content;
          }

          results.push({
            file,
            content: parsedContent
          });
        } catch (error) {
          console.warn(`  [Glob Plugin] Warning: Failed to read ${file}: ${(error as Error).message}`);
        }
      }

      return {
        title: config.title,
        tag: pattern,
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
          pattern,
          count: results.length,
          files: results.map(r => r.file)
        }
      };
    } catch (error) {
      throw new Error(`Glob pattern failed: ${pattern} - ${(error as Error).message}`);
    }
  }
};

/**
 * DB Data Plugin
 *
 * 从数据库查询数据（支持 MongoDB）
 */
export const dbDataPlugin: DataPlugin = {
  name: 'db-data',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'data',
  type: 'db',

  validate(config: DataItemConfig): boolean {
    if (typeof config.source !== 'object' || config.source === null) {
      return false;
    }
    const obj = config.source as Record<string, unknown>;
    return typeof obj.type === 'string' &&
           (obj.type === 'mongodb' || obj.type === 'mysql' || obj.type === 'postgres');
  },

  async fetch(config: DataItemConfig, context: RuntimeContext): Promise<DataResult> {
    const obj = config.source as Record<string, unknown>;
    const dbType = obj.type as string;
    console.log(`  [DB Plugin] Querying: ${dbType}`);

    if (dbType === 'mongodb') {
      return fetchFromMongoDB(obj, config, context);
    }

    throw new Error(`Unsupported database type: ${dbType}`);
  }
};

/**
 * 获取所有真实 Data 插件
 */
export function getAllDataPlugins(): Map<DataSourceType, DataPlugin> {
  return new Map([
    ['inline', inlineDataPlugin],
    ['file', fileDataPlugin],
    ['https', httpsDataPlugin],
    ['http', httpDataPlugin],
    ['glob', globDataPlugin],
    ['db', dbDataPlugin]
  ]);
}
