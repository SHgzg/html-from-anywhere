/**
 * Mailer Transporter Factory
 *
 * 负责：根据配置创建 nodemailer transporter
 */

import nodemailer from 'nodemailer';
import { MailerConfig } from '@report-tool/types';

/**
 * Transporter 缓存
 */
const transporterCache = new Map<string, nodemailer.Transporter>();

/**
 * 创建或获取缓存的 Transporter
 *
 * @param config - 邮件配置
 * @returns nodemailer.Transporter
 */
export function getTransporter(config: MailerConfig): nodemailer.Transporter {
  // 生成缓存键
  const cacheKey = getCacheKey(config);

  // 检查缓存
  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey)!;
  }

  // 创建新的 transporter
  const transporter = createTransporter(config);

  // 缓存
  transporterCache.set(cacheKey, transporter);

  return transporter;
}

/**
 * 创建 Transporter
 *
 * @param config - 邮件配置
 * @returns nodemailer.Transporter
 */
function createTransporter(config: MailerConfig): nodemailer.Transporter {
  switch (config.type) {
    case 'smtp':
      if (!config.smtp) {
        throw new Error('SMTP mailer requires smtp configuration');
      }
      return nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure ?? false,
        auth: config.smtp.auth ? {
          user: config.smtp.auth.user,
          pass: config.smtp.auth.pass,
        } : undefined,
      });

    case 'sendmail':
      return nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail',
      });

    case 'ses':
      // 需要安装 @aws-sdk/client-ses
      throw new Error('SES transport not implemented yet');

    case 'mailgun':
      // 需要安装 nodemailer-mailgun-transport
      throw new Error('Mailgun transport not implemented yet');

    case 'sparkpost':
      // 需要安装 nodemailer-sparkpost-transport
      throw new Error('SparkPost transport not implemented yet');

    default:
      throw new Error(`Unknown mailer type: ${(config as any).type}`);
  }
}

/**
 * 生成缓存键
 *
 * @param config - 邮件配置
 * @returns 缓存键
 */
function getCacheKey(config: MailerConfig): string {
  if (config.type === 'smtp' && config.smtp) {
    return `${config.type}:${config.smtp.host}:${config.smtp.port}:${config.smtp.auth?.user}`;
  }
  return config.type;
}

/**
 * 验证邮件配置
 *
 * @param config - 邮件配置
 * @returns 是否有效
 */
export function validateMailerConfig(config: MailerConfig): boolean {
  switch (config.type) {
    case 'smtp':
      return !!(config.smtp?.host && config.smtp?.port);

    case 'sendmail':
      return true;

    default:
      return false;
  }
}

/**
 * 清除缓存的 Transporter
 *
 * 用于测试或配置更新
 */
export function clearTransporterCache(): void {
  transporterCache.clear();
}
