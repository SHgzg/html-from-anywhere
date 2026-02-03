/**
 * MongoDB Client Factory for Report Storage
 *
 * 负责：管理和复用 MongoDB 连接
 */

import { Db, MongoClient } from 'mongodb';

/**
 * MongoDB 连接缓存项
 */
interface CacheItem {
  client: MongoClient;
  connected: boolean;
}

/**
 * MongoDB 连接缓存
 */
const clientCache = new Map<string, CacheItem>();

/**
 * 获取或创建 MongoDB 客户端
 *
 * @param name - 连接名称（用于缓存）
 * @param config - MongoDB 配置
 * @returns MongoDB 客户端
 */
export function getMongoClient(
  name: string,
  config: { uri: string; database: string }
): MongoClient {
  const cacheKey = `${name}:${config.uri}:${config.database}`;

  let item = clientCache.get(cacheKey);

  if (!item) {
    const client = new MongoClient(config.uri);
    item = { client, connected: false };
    clientCache.set(cacheKey, item);
  }

  return item.client;
}

/**
 * 获取 MongoDB 数据库实例
 *
 * @param name - 连接名称
 * @param config - MongoDB 配置
 * @returns 数据库实例
 */
export async function getDatabase(
  name: string,
  config: { uri: string; database: string }
): Promise<Db> {
  // 先获取或创建客户端（确保缓存项存在）
  const client = getMongoClient(name, config);

  const cacheKey = `${name}:${config.uri}:${config.database}`;
  const item = clientCache.get(cacheKey)!;

  // 确保客户端已连接
  if (!item.connected) {
    await item.client.connect();
    item.connected = true;
  }

  return item.client.db(config.database);
}

/**
 * 保存报告到 MongoDB
 *
 * @param name - 连接名称
 * @param config - MongoDB 配置
 * @param collection - 集合名称
 * @param document - 要保存的文档
 * @returns 插入结果
 */
export async function saveReportToDatabase(
  name: string,
  config: { uri: string; database: string },
  collection: string,
  document: Record<string, unknown>
): Promise<{ insertedId: unknown }> {
  const db = await getDatabase(name, config);
  const result = await db.collection(collection).insertOne(document);

  return {
    insertedId: result.insertedId
  };
}

/**
 * 关闭所有缓存的 MongoDB 连接
 *
 * 用于程序退出时清理资源
 */
export async function closeAllMongoClients(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const [key, item] of clientCache.entries()) {
    if (item.connected) {
      closePromises.push(
        item.client.close().then(() => {
          clientCache.delete(key);
        })
      );
    }
  }

  await Promise.all(closePromises);
}
