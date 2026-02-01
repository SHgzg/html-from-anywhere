/**
 * Storage Action Plugins
 *
 * 提供：syncToMinio（将报告同步到 MinIO）
 */

import { ActionPlugin, ActionPayload, ActionContext } from '@report-tool/types';
import { getMinioClient, ensureBucketExists, uploadToMinio } from '../storage/minio-client-factory';

/**
 * MinIO 同步配置接口
 */
interface MinioSyncConfig {
  /** MinIO 配置名称（来自系统配置） */
  minioName: string;
  /** Bucket 名称 */
  bucket: string;
  /** 文件夹路径（可选，不以 / 开头） */
  folder?: string;
  /** 文件名（可选，默认使用日期 + UUID） */
  filename?: string;
}

/**
 * syncToMinio Action Plugin
 *
 * 将报告同步到指定的 MinIO
 * 约束：必须使用系统配置中的 MinIO，用户只能指定 bucket 和 folder
 */
export const syncToMinioPlugin: ActionPlugin = {
  name: 'sync-to-minio-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'syncToMinio',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    const config = payload as unknown as MinioSyncConfig;
    const { renderResult, runtime } = context;

    // 验证必需参数
    if (!config.minioName || !config.bucket) {
      throw new Error('syncToMinio requires "minioName" and "bucket" in payload');
    }

    // 验证 renderResult 存在
    if (!renderResult) {
      throw new Error('syncToMinio requires a render result (report content)');
    }

    // 从环境配置获取 MinIO 配置
    const minioConfig = runtime.envConfig.minio[config.minioName];
    if (!minioConfig) {
      const availableNames = Object.keys(runtime.envConfig.minio).join(', ');
      throw new Error(
        `MinIO configuration "${config.minioName}" not found. ` +
        `Available: ${availableNames || 'none'}`
      );
    }

    console.log('');
    console.log('  ========================================');
    console.log('  [syncToMinio] Syncing Report to MinIO');
    console.log('  ========================================');
    console.log(`  MinIO Config: ${config.minioName}`);
    console.log(`  Endpoint: ${minioConfig.endpoint}`);
    console.log(`  Bucket: ${config.bucket}`);
    if (config.folder) {
      console.log(`  Folder: ${config.folder}`);
    }

    // 获取 MinIO 客户端
    const client = getMinioClient(config.minioName, minioConfig);

    // 检查 bucket 是否存在
    try {
      await ensureBucketExists(client, config.bucket);
      console.log(`  Bucket Check: ✅ OK`);
    } catch (error) {
      console.error(`  Bucket Check: ❌ Failed`);
      console.error(`  Error: ${(error as Error).message}`);
      console.log('  ========================================');
      console.log('');
      throw error;
    }

    // 构建对象名称
    const filename = config.filename || `${runtime.dateContext.YYYYMMDD}.html`;
    const objectName = config.folder
      ? `${config.folder}/${filename}`
      : filename;

    console.log(`  Object Name: ${objectName}`);
    console.log(`  Content Type: ${renderResult.renderMode === 'html' ? 'text/html' : 'text/plain'}`);

    // 上传报告
    try {
      const contentType = renderResult.renderMode === 'html' ? 'text/html' : 'text/plain';
      const result = await uploadToMinio(
        client,
        config.bucket,
        objectName,
        renderResult.content,
        contentType
      );

      console.log(`  Status: ✅ Upload successful`);
      console.log(`  ETag: ${result.etag}`);
      if (result.versionId) {
        console.log(`  Version ID: ${result.versionId}`);
      }

      // 生成公开访问 URL（假设 bucket 是公开的）
      const publicUrl = generatePublicUrl(minioConfig, config.bucket, objectName);
      console.log(`  Public URL: ${publicUrl}`);

      console.log('  ========================================');
      console.log('');
    } catch (error) {
      console.error(`  Status: ❌ Upload failed`);
      console.error(`  Error: ${(error as Error).message}`);
      console.log('  ========================================');
      console.log('');
      throw error;
    }
  }
};

/**
 * 生成公开访问 URL
 *
 * @param config - MinIO 配置
 * @param bucket - bucket 名称
 * @param objectName - 对象名称
 * @returns 公开 URL
 */
function generatePublicUrl(
  config: { endpoint: string; port?: number; useSSL?: boolean },
  bucket: string,
  objectName: string
): string {
  const protocol = config.useSSL ? 'https' : 'http';
  const port = config.port ? (config.useSSL ? 443 : 80) : (config.useSSL ? 443 : 80);
  const portStr = (config.port && config.port !== port) ? `:${config.port}` : '';
  return `${protocol}://${config.endpoint}${portStr}/${bucket}/${objectName}`;
}

/**
 * 获取存储相关插件
 */
export function getStoragePlugins(): Map<string, ActionPlugin> {
  return new Map([
    ['syncToMinio', syncToMinioPlugin]
  ]);
}
