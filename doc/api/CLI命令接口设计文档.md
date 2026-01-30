# CLI 命令接口设计文档

## 1. 设计目标

本文档用于定义 **Report CLI 的命令行接口规范**。

目标是：
- 提供清晰、直观的命令行参数
- 保证参数互斥规则的强制执行
- 提供友好的帮助信息和错误提示
- 规范退出码

---

## 2. 命令基本结构

### 2.1 命令格式

```bash
report-cli [OPTIONS]
```

### 2.2 必需参数（二选一）

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `--report-id <id>` | string | 从 MongoDB 加载配置 | `--report-id daily_report` |
| `--config-path <path>` | string | 从本地文件加载配置 | `--config-path ./config.json` |

**互斥规则：** 两个参数必须且只能提供一个

---

## 3. 可选参数

### 3.1 日期参数

| 参数 | 类型 | 默认值 | 说明 | 示例 |
|------|------|--------|------|------|
| `--date <YYYY-MM-DD>` | string | 当天日期 | 指定报告日期 | `--date 2025-01-30` |

**用途：** 用于模板占位符替换

### 3.2 输出控制参数

| 参数 | 类型 | 默认值 | 说明 | 示例 |
|------|------|--------|------|------|
| `--log-level <level>` | string | `info` | 日志级别 | `--log-level debug` |
| `--output-format <format>` | string | `text` | 输出格式 | `--output-format json` |
| `--verbose` / `-v` | flag | false | 详细输出 | `--verbose` |
| `--quiet` / `-q` | flag | false | 静默模式 | `--quiet` |

**log-level 可选值：** `debug` | `info` | `warn` | `error`

### 3.3 配置覆盖参数（预留）

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `--override <key=value>` | key=value | 覆盖配置项 | `--override report.title=Test` |

**注意：** 此参数不参与 Enhance，只影响最终可执行配置

---

## 4. 帮助信息

### 4.1 帮助命令

```bash
report-cli --help
report-cli -h
```

### 4.2 帮助信息格式

```
Report CLI - 灵活的报告生成工具

用法:
  report-cli [OPTIONS]

选项:
  --report-id <id>              从 MongoDB 加载配置 (ID)
  --config-path <path>          从本地文件加载配置
  --date <YYYY-MM-DD>           指定报告日期 (默认: 当天)
  --log-level <level>           日志级别 (默认: info)
                                [debug, info, warn, error]
  --output-format <format>      输出格式 (默认: text)
                                [text, json]
  --verbose, -v                 详细输出
  --quiet, -q                   静默模式
  --help, -h                    显示帮助信息
  --version, -V                 显示版本信息

示例:
  # 从数据库加载配置
  report-cli --report-id daily_report

  # 从本地文件加载配置
  report-cli --config-path ./config.json

  # 指定日期
  report-cli --report-id daily_report --date 2025-01-30

  # 调试模式
  report-cli --config-path ./config.json --log-level debug

更多信息请访问: https://github.com/your-org/report-cli
```

### 4.3 版本信息

```bash
report-cli --version
report-cli -V
```

**输出格式：**
```
report-cli v0.1.0
```

---

## 5. 参数校验规则

### 5.1 互斥参数校验

**规则：** `--report-id` 与 `--config-path` 必须互斥

**错误提示：**
```
错误: 不能同时提供 --report-id 和 --config-path

用法:
  report-cli --report-id <id>      # 从数据库加载
  report-cli --config-path <path>  # 从本地文件加载
```

### 5.2 必需参数校验

**规则：** `--report-id` 和 `--config-path` 必须提供其中一个

**错误提示：**
```
错误: 必须提供 --report-id 或 --config-path

用法:
  report-cli --report-id <id>
  report-cli --config-path <path>
```

### 5.3 日期格式校验

**规则：** `--date` 必须符合 `YYYY-MM-DD` 格式

**错误提示：**
```
错误: 无效的日期格式 '2025/01/30'

期望格式: YYYY-MM-DD
示例: 2025-01-30
```

### 5.4 配置文件存在性校验

**规则：** `--config-path` 指定的文件必须存在

**错误提示：**
```
错误: 配置文件不存在: './config.json'

请检查文件路径是否正确
```

---

## 6. 退出码规范

### 6.1 退出码定义

| 退出码 | 含义 | 说明 |
|--------|------|------|
| 0 | 成功 | 正常执行完成 |
| 1 | 一般错误 | 配置错误、参数错误等 |
| 2 | 参数错误 | CLI 参数校验失败 |
| 3 | 配置错误 | 配置文件解析失败 |
| 4 | 数据错误 | 数据获取失败 |
| 5 | 渲染错误 | 报告渲染失败 |
| 6 | Action 错误 | Action 执行失败 |
| 130 | 用户中断 | Ctrl+C |
| 255 | 未知错误 | 未预期的错误 |

### 6.2 退出码使用示例

```bash
# 执行成功
report-cli --config-path ./config.json
echo $?  # 输出: 0

# 参数错误
report-cli
echo $?  # 输出: 2

# 配置文件不存在
report-cli --config-path ./not-found.json
echo $?  # 输出: 3
```

### 6.3 错误输出格式

**文本格式：**
```
错误: 配置文件不存在: './not-found.json'

请检查:
  1. 文件路径是否正确
  2. 文件是否存在
  3. 是否有读取权限

使用 --help 查看帮助信息
```

**JSON 格�式（--output-format json）：**
```json
{
  "success": false,
  "error": {
    "code": "CONFIG_FILE_NOT_FOUND",
    "message": "配置文件不存在",
    "details": {
      "path": "./not-found.json"
    }
  },
  "exitCode": 3
}
```

---

## 7. 日志输出规范

### 7.1 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| debug | 调试信息 | 配置详情、中间状态 |
| info | 一般信息 | 阶段开始/完成、关键操作 |
| warn | 警告信息 | 非致命错误、降级处理 |
| error | 错误信息 | 阶段失败、执行错误 |

### 7.2 输出格式

**默认模式（text）：**
```
[INFO] 2025-01-30 10:30:00 - Phase 1: Bootstrap
[DEBUG] 2025-01-30 10:30:01 - Loading .env file
[INFO] 2025-01-30 10:30:02 - Connected to MongoDB
[INFO] 2025-01-30 10:30:03 - Bootstrap complete
```

**静默模式（--quiet）：**
```
✓ Bootstrap
✓ Config
✓ Data
✗ Render: Template not found
```

**JSON 模式（--output-format json）：**
```json
{
  "phase": "bootstrap",
  "status": "success",
  "duration": 1234,
  "timestamp": "2025-01-30T10:30:00.000Z"
}
```

---

## 8. 执行摘要输出

### 8.1 成功执行摘要

```
========================================
Report CLI 执行摘要
========================================

报告ID: daily_report
日期: 2025-01-30
执行时间: 2025-01-30 10:30:00

执行阶段:
  ✓ Bootstrap (1.2s)
  ✓ Config (0.5s)
  ✓ Data (3.4s)
  ✓ Render (2.1s)
  ✓ Action (5.6s)

数据源: 3 个
  ✓ 用户数据 (2.3s)
  ✓ 订单数据 (1.1s)
  ✓ 产品数据 (0.0s) [cached]

渲染模式:
  ✓ HTML (2.1s)

Action 执行: 2 个
  ✓ Email 发送 (3.2s)
  ✓ Storage 上传 (2.4s)

总耗时: 12.8s
状态: 成功 ✓
```

### 8.2 失败执行摘要

```
========================================
Report CLI 执行摘要
========================================

报告ID: daily_report
日期: 2025-01-30
执行时间: 2025-01-30 10:30:00

执行阶段:
  ✓ Bootstrap (1.2s)
  ✓ Config (0.5s)
  ✗ Data (3.4s)
  - Render (skipped)
  - Action (skipped)

错误:
  ✗ 数据源失败: "用户数据"
    原因: HTTP timeout
    详情: 超过 30 秒未响应

状态: 失败 ✗
退出码: 4
```

---

## 9. 环境变量

### 9.1 支持的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `REPORT_CLI_LOG_LEVEL` | 默认日志级别 | `info` |
| `REPORT_CLI_CONFIG_DIR` | 配置文件目录 | `./` |
| `REPORT_CLI_TIMEOUT` | 全局超时（秒） | `300` |
| `REPORT_CLI_NO_COLOR` | 禁用彩色输出 | `false` |

### 9.2 环境变量优先级

```
CLI 参数 > 环境变量 > 默认值
```

**示例：**
```bash
export REPORT_CLI_LOG_LEVEL=debug
report-cli --config-path ./config.json
# 日志级别为 debug

report-cli --config-path ./config.json --log-level warn
# CLI 参数优先，日志级别为 warn
```

---

## 10. 配置文件支持

### 10.1 配置文件位置

**优先级（从高到低）：**
1. `./report-cli.config.json`
2. `./.report-clirc`
3. `$HOME/.report-cli/config.json`

### 10.2 配置文件格式

```json
{
  "defaultLogLevel": "info",
  "defaultOutputFormat": "text",
  "timeout": 300,
  "verbose": false,
  "aliases": {
    "daily": "--report-id daily_report",
    "weekly": "--report-id weekly_report"
  }
}
```

---

## 11. 使用示例

### 11.1 基本用法

```bash
# 从数据库加载配置
report-cli --report-id daily_report

# 从本地文件加载配置
report-cli --config-path ./config.json

# 指定日期
report-cli --report-id daily_report --date 2025-01-30
```

### 11.2 调试模式

```bash
# 详细日志
report-cli --config-path ./config.json --verbose

# Debug 级别
report-cli --config-path ./config.json --log-level debug
```

### 11.3 输出控制

```bash
# JSON 格式输出
report-cli --config-path ./config.json --output-format json

# 静默模式
report-cli --config-path ./config.json --quiet
```

### 11.4 脚本集成

```bash
#!/bin/bash
# 在脚本中使用

if report-cli --report-id daily_report; then
  echo "报告生成成功"
  # 发送成功通知
else
  exit_code=$?
  echo "报告生成失败，退出码: $exit_code"
  # 发送失败通知
  exit $exit_code
fi
```

---

## 12. 实现建议

### 12.1 推荐库

- **命令行解析**: `commander` 或 `yargs`
- **日志输出**: `pino` 或 `winston`
- **彩色输出**: `chalk`
- **进度条**: `cli-progress`

### 12.2 代码结构

```typescript
// src/cli/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('report-cli')
  .description('灵活的报告生成工具')
  .version('0.1.0');

program
  .option('--report-id <id>', '从 MongoDB 加载配置')
  .option('--config-path <path>', '从本地文件加载配置')
  .option('--date <YYYY-MM-DD>', '指定报告日期', new Date().toISOString().split('T')[0])
  .option('--log-level <level>', '日志级别', 'info')
  .option('--output-format <format>', '输出格式', 'text')
  .option('--verbose, -v', '详细输出')
  .option('--quiet, -q', '静默模式')
  .action(main);

program.parse();
```

---

## 13. 本文档边界声明

本文档 **不负责**：
- 具体的命令行库选择
- 命令行的具体实现细节

它只负责：
> **定义 CLI 的接口规范、参数规则、输出格式和错误处理方式**
