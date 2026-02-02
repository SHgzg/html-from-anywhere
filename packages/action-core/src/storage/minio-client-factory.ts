/**
 * MinIO Client Factory
 *
 * 负责：根据配置创建 MinIO 客户端
 */

import * as Minio from 'minio';
import { MinioConnectionConfig } from '@report-tool/types';

/**
 * MinIO 客户端缓存
 */
const clientCache = new Map<string, Minio.Client>();

/**
 * 获取或创建 MinIO 客户端
 *
 * @param name - MinIO 配置名称
 * @param config - MinIO 连接配置
 * @returns Minio.Client
 */
export function getMinioClient(name: string, config: MinioConnectionConfig): Minio.Client {
  // 检查缓存
  if (clientCache.has(name)) {
    return clientCache.get(name)!;
  }

  // 创建新客户端
  const client = new Minio.Client({
    endPoint: config.endpoint,
    port: config.port,
    useSSL: config.useSSL ?? false,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region
  });

  // 缓存客户端
  clientCache.set(name, client);

  return client;
}

/**
 * 检查 bucket 是否存在
 *
 * @param client - MinIO 客户端
 * @param bucket - bucket 名称
 * @returns 是否存在
 */
export async function ensureBucketExists(
  client: Minio.Client,
  bucket: string
): Promise<boolean> {
  try {
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      // 可以选择自动创建 bucket，或抛出错误
      // 这里选择抛出错误，要求 bucket 必须预先存在
      throw new Error(`Bucket "${bucket}" does not exist`);
    }
    return true;
  } catch (error) {
    throw new Error(`Failed to check bucket "${bucket}": ${(error as Error).message}`);
  }
}

/**
 * 上传内容到 MinIO
 *
 * @param client - MinIO 客户端
 * @param bucket - bucket 名称
 * @param objectName - 对象名称（包含路径）
 * @param content - 内容
 * @param contentType - 内容类型
 * @returns 上传结果
 */
export async function uploadToMinio(
  client: Minio.Client,
  bucket: string,
  objectName: string,
  content: string | Buffer,
  contentType: string = 'application/octet-stream'
): Promise<{ etag: string; versionId?: string }> {
  try {
    const result = await client.putObject(bucket, objectName, content, undefined, {
      'Content-Type': contentType
    });
    // 转换 versionId: null -> undefined
    return {
      etag: result.etag,
      versionId: result.versionId || undefined
    };
  } catch (error) {
    throw new Error(`Failed to upload to MinIO: ${(error as Error).message}`);
  }
}

/**
 * 清除客户端缓存
 *
 * 用于测试或配置更新
 */
export function clearClientCache(): void {
  clientCache.clear();
}
