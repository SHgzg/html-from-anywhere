/**
 * CLI Parser
 *
 * 负责解析命令行参数
 */

import { CliArgs } from '@report-tool/types';

interface ParseResult {
  args: CliArgs;
  showHelp: boolean;
  showVersion: boolean;
  errors: string[];
}

/**
 * 解析命令行参数
 *
 * 支持的参数：
 * --config-path <path>    配置文件路径
 * --date <YYYY-MM-DD>     报告日期
 * --log-level <level>     日志级别
 * --verbose, -v           详细输出
 * --quiet, -q             静默模式
 * --help, -h              显示帮助
 * --version, -V           显示版本
 *
 * @returns ParseResult
 */
export function parseCliArgs(): ParseResult {
  const args = process.argv.slice(2);
  const result: ParseResult = {
    args: {
      configPath: './config.json'
    },
    showHelp: false,
    showVersion: false,
    errors: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        result.showHelp = true;
        break;

      case '--version':
      case '-V':
        result.showVersion = true;
        break;

      case '--config-path':
        if (i + 1 < args.length) {
          result.args.configPath = args[++i];
        } else {
          result.errors.push('--config-path requires a value');
        }
        break;

      case '--date':
        if (i + 1 < args.length) {
          const dateValue = args[++i];
          // 验证日期格式 YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            result.args.date = dateValue;
          } else {
            result.errors.push(`Invalid date format: ${dateValue} (expected YYYY-MM-DD)`);
          }
        } else {
          result.errors.push('--date requires a value');
        }
        break;

      case '--log-level':
        if (i + 1 < args.length) {
          const level = args[++i];
          const validLevels = ['debug', 'info', 'warn', 'error'];
          if (validLevels.includes(level)) {
            result.args.logLevel = level as any;
          } else {
            result.errors.push(`Invalid log level: ${level} (valid: ${validLevels.join(', ')})`);
          }
        } else {
          result.errors.push('--log-level requires a value');
        }
        break;

      case '--verbose':
      case '-v':
        result.args.verbose = true;
        break;

      case '--quiet':
      case '-q':
        result.args.quiet = true;
        break;

      default:
        // 未知参数
        if (arg.startsWith('--')) {
          result.errors.push(`Unknown option: ${arg}`);
        } else {
          result.errors.push(`Unexpected argument: ${arg}`);
        }
        break;
    }
  }

  return result;
}

/**
 * 显示帮助信息
 */
export function showHelp(): void {
  console.log(`
Report CLI - 灵活的报告生成工具

用法:
  report-cli [OPTIONS]

选项:
  --config-path <path>      从本地文件加载配置 (默认: ./config.json)
  --date <YYYY-MM-DD>       指定报告日期 (默认: 当天)
  --log-level <level>       日志级别 (默认: info)
                            [debug, info, warn, error]
  --verbose, -v             详细输出
  --quiet, -q               静默模式
  --help, -h                显示帮助信息
  --version, -V             显示版本信息

示例:
  # 使用默认配置文件
  report-cli

  # 指定配置文件
  report-cli --config-path ./my-config.json

  # 指定日期
  report-cli --date 2025-01-30

  # 详细输出
  report-cli --verbose

  # 组合使用
  report-cli --config-path ./config.json --date 2025-01-30 --verbose
`);
}

/**
 * 显示版本信息
 */
export function showVersion(): void {
  console.log('Report CLI v0.1.0');
}
