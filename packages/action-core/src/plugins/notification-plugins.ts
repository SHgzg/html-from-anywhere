/**
 * Notification Action Plugins
 *
 * 提供：sendEmail（发送报告邮件）、sendNotice（发送通知）
 */

import { ActionPlugin, ActionPayload, ActionContext } from '@report-tool/types';
import { getTransporter } from '../mailer/transporter-factory';
import { getMailBackupService, type MailBackupRecord } from '../mailer/mail-backup';

/**
 * Email 配置接口
 */
interface EmailConfig {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  from?: string;
  replyTo?: string;
}

/**
 * Notice 配置接口
 */
interface NoticeConfig {
  to: string | string[];
  subject: string;
  message: string;
  from?: string;
  replyTo?: string;
  reportUrl?: string;  // 报告链接（可选）
}

/**
 * sendEmail Action Plugin
 *
 * 将生成的报告作为邮件内容发送
 * 要求：必须存在 renderResult
 */
export const sendEmailPlugin: ActionPlugin = {
  name: 'send-email-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'sendEmail',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    const config = payload as unknown as EmailConfig;
    const { renderResult, runtime } = context;

    // 验证必需参数
    if (!config.to || !config.subject) {
      throw new Error('sendEmail requires "to" and "subject" in payload');
    }

    // 验证 renderResult 存在
    if (!renderResult) {
      throw new Error('sendEmail requires a render result (report content)');
    }

    // 从环境配置获取邮件配置
    const mailerConfig = runtime.envConfig.mailer;

    console.log('');
    console.log('  ========================================');
    console.log('  [sendEmail] Sending Report Email');
    console.log('  ========================================');
    console.log(`  Mailer Type: ${mailerConfig.type}`);
    console.log(`  From: ${config.from || mailerConfig.defaultFrom || 'noreply@domain.com'}`);
    console.log(`  To: ${Array.isArray(config.to) ? config.to.join(', ') : config.to}`);
    if (config.cc) {
      console.log(`  Cc: ${Array.isArray(config.cc) ? config.cc.join(', ') : config.cc}`);
    }
    console.log(`  Subject: ${config.subject}`);
    console.log(`  Render Mode: ${renderResult.renderMode}`);
    console.log(`  Content Length: ${renderResult.content.length} chars`);

    // 获取 transporter
    const transporter = getTransporter(mailerConfig);

    // 构建邮件选项
    const mailOptions = {
      from: config.from || mailerConfig.defaultFrom || 'noreply@domain.com',
      to: config.to,
      cc: config.cc,
      bcc: config.bcc,
      replyTo: config.replyTo || mailerConfig.defaultReplyTo,
      subject: config.subject,
      html: renderResult.content,
    };

    // 发送邮件
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`  Status: ✅ Email sent successfully`);
      console.log(`  Message ID: ${info.messageId}`);

      // 发送成功后备份邮件
      const backupService = getMailBackupService(runtime.envConfig.mailBackupDB);
      if (backupService) {
        const backupRecord: MailBackupRecord = {
          messageId: info.messageId,
          sentAt: new Date(),
          to: config.to,
          cc: config.cc,
          bcc: config.bcc,
          subject: config.subject,
          from: config.from || mailerConfig.defaultFrom || 'noreply@domain.com',
          content: renderResult.content,
          contentType: 'html',
          reportDate: runtime.dateContext.rawDate,
          success: true
        };
        await backupService.backup(backupRecord);
      }

      console.log('  ========================================');
      console.log('');
    } catch (error) {
      console.error('  Status: ❌ Failed to send email');
      console.error(`  Error: ${(error as Error).message}`);
      console.log('  ========================================');
      console.log('');
      throw error;
    }
  }
};

/**
 * sendNotice Action Plugin
 *
 * 发送通知，不包含报告内容
 * 用于：报告生成完成后的通知，可附带报告链接
 */
export const sendNoticePlugin: ActionPlugin = {
  name: 'send-notice-action',
  version: '1.0.0',
  compatibleContracts: '^1.0.0',
  phase: 'action',
  type: 'sendNotice',

  async execute(payload: ActionPayload, context: ActionContext): Promise<void> {
    const config = payload as unknown as NoticeConfig;
    const { runtime } = context;

    // 验证必需参数
    if (!config.to || !config.subject || !config.message) {
      throw new Error('sendNotice requires "to", "subject" and "message" in payload');
    }

    // 从环境配置获取邮件配置
    const mailerConfig = runtime.envConfig.mailer;

    console.log('');
    console.log('  ========================================');
    console.log('  [sendNotice] Sending Notification');
    console.log('  ========================================');
    console.log(`  Mailer Type: ${mailerConfig.type}`);
    console.log(`  From: ${config.from || mailerConfig.defaultFrom || 'noreply@domain.com'}`);
    console.log(`  To: ${Array.isArray(config.to) ? config.to.join(', ') : config.to}`);
    console.log(`  Subject: ${config.subject}`);
    console.log(`  Message: ${config.message}`);

    if (config.reportUrl) {
      console.log(`  Report URL: ${config.reportUrl}`);
    }

    // 构建通知内容（纯文本，不包含报告）
    const noticeBody = `
${config.message}

---
Generated at: ${new Date().toISOString()}
${config.reportUrl ? `Report available at: ${config.reportUrl}` : ''}
    `.trim();

    // 获取 transporter
    const transporter = getTransporter(mailerConfig);

    // 构建邮件选项
    const mailOptions = {
      from: config.from || mailerConfig.defaultFrom || 'noreply@domain.com',
      to: config.to,
      replyTo: config.replyTo || mailerConfig.defaultReplyTo,
      subject: config.subject,
      text: noticeBody,
    };

    // 发送邮件
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`  Status: ✅ Notice sent successfully`);
      console.log(`  Message ID: ${info.messageId}`);
      console.log('  ========================================');
      console.log('');
    } catch (error) {
      console.error('  Status: ❌ Failed to send notice');
      console.error(`  Error: ${(error as Error).message}`);
      console.log('  ========================================');
      console.log('');
      throw error;
    }
  }
};

/**
 * 获取通知相关插件
 */
export function getNotificationPlugins(): Map<string, ActionPlugin> {
  return new Map([
    ['sendEmail', sendEmailPlugin],
    ['sendNotice', sendNoticePlugin]
  ]);
}
