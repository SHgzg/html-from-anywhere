# Report CLI 设计文档

> Report CLI 是一个灵活的报告生成工具，支持从多种数据源获取数据并生成 HTML/Email 报告。

---

## 📚 文档导航

### 🎯 快速开始

- [项目基本结构](overview/项目基本就结构.md) - 了解项目的整体架构和模块划分

### 🏗️ 架构设计

| 文档 | 说明 |
|------|------|
| [核心 TypeScript 接口与模块边界](architecture/核心%20Type%20Script%20接口与模块边界设计文档.md) | 类型定义、模块接口、数据契约 |
| [基础配置与启动模块](architecture/基础配置与启动模块设计文档.md) | .env、MongoDB、user_config 解析 |
| [执行生命周期与 Action 事件模型](architecture/执行生命周期与%20Action%20事件模型设计文档.md) | 完整的执行流程和事件驱动机制 |

### 📦 核心模块

| 模块 | 文档 | 说明 |
|------|------|------|
| **Enhance** | [Enhance 机制与配置合并](modules/Enhance%20机制与配置合并设计文档.md) | 配置增强策略 |
|  | [Enhance 配置存储与加载](modules/Enhance配置存储与加载设计文档.md) | MongoDB 存储方案 |
| **Data** | [数据源适配器规范](modules/数据源适配器规范文档.md) | HTTP/File/DB/Inline 数据源 |
| **Render** | [报告渲染与模板生成器](modules/报告渲染与模板生成器设计文档.md) | HTML/Email 渲染 |
| **Action** | [Action 类型与执行器](modules/Action%20类型与执行器设计文档.md) | Email/Storage/Notification |

### 🔌 API 接口

- [CLI 命令接口设计](api/CLI命令接口设计文档.md) - 命令行参数、退出码、输出格式

### 📖 实现指南

| 文档 | 说明 |
|------|------|
| [日志与监控设计](guides/日志与监控设计文档.md) | 日志级别、格式、关键埋点 |
| [错误处理与重试策略](guides/错误处理与重试策略文档.md) | 错误分类、重试机制、恢复策略 |

### 📄 示例

- [配置示例](examples/config-example.json) - 完整的配置文件示例

---

## 🚀 快速导航

### 按角色查看

**新手入门**
1. 先读 [项目基本结构](overview/项目基本就结构.md)
2. 再读 [执行生命周期](architecture/执行生命周期与%20Action%20事件模型设计文档.md)
3. 查看 [配置示例](examples/config-example.json)

**开发者**
1. [核心接口](architecture/核心%20Type%20Script%20接口与模块边界设计文档.md)
2. 各模块设计文档（见上方表格）
3. 实现指南文档

**运维人员**
1. [CLI 命令接口](api/CLI命令接口设计文档.md)
2. [日志与监控](guides/日志与监控设计文档.md)
3. [错误处理](guides/错误处理与重试策略文档.md)

### 按主题查看

**配置相关**
- [基础配置与启动模块](architecture/基础配置与启动模块设计文档.md)
- [Enhance 机制与配置合并](modules/Enhance%20机制与配置合并设计文档.md)
- [Enhance 配置存储与加载](modules/Enhance配置存储与加载设计文档.md)
- [配置示例](examples/config-example.json)

**数据流程**
- [数据源适配器规范](modules/数据源适配器规范文档.md)
- [报告渲染与模板生成器](modules/报告渲染与模板生成器设计文档.md)
- [Action 类型与执行器](modules/Action%20类型与执行器设计文档.md)

**运行支撑**
- [CLI 命令接口设计](api/CLI命令接口设计文档.md)
- [日志与监控设计](guides/日志与监控设计文档.md)
- [错误处理与重试策略](guides/错误处理与重试策略文档.md)

---

## 🎯 设计原则

### 1. 配置分层

```
.env
  ↓
report_config.env_collection
  ↓
user_config（DB | local file）
  ↓
CLI 参数（覆盖层）
```

### 2. 事件驱动

- **data_ready**: 数据获取完成
- **report_ready**: 报告渲染完成
- **report_archived**: 报告已持久化

### 3. Fail-Fast 策略

| Phase | 错误处理 |
|-------|----------|
| Bootstrap | 任何失败立即退出 |
| Config | 配置错误立即退出 |
| Data | 单个数据源失败终止流程 |
| Render | 单个模式失败不影响其他模式 |
| Action | 单个失败不影响其他 Action |

### 4. 模块边界清晰

每个模块只负责自己的职责，通过接口通信。

---

## 📊 模块依赖关系

```
types (无依赖)
  ↓
bootstrap (依赖 types)
  ↓
config (依赖 types, bootstrap)
  ↓
enhance-core (依赖 types, config)
  ↓
data-core (依赖 types, config)
  ↓
render-core (依赖 types, config, data-core)
  ↓
action-core (依赖 types, config, data-core, render-core)
  ↓
lifecycle (依赖所有核心包)
  ↓
report-cli (依赖 lifecycle)
```

---

## 🔍 常见问题

### Q: 配置文件放在哪里？
A: 支持两种方式：
1. MongoDB: `--report-id <id>`
2. 本地文件: `--config-path <path>`

### Q: 如何添加新的数据源？
A: 参考 [数据源适配器规范](modules/数据源适配器规范文档.md) 中的"扩展新数据源"章节。

### Q: 如何自定义模板？
A: 实现 `TemplateGenerator` 接口，参考 [报告渲染与模板生成器](modules/报告渲染与模板生成器设计文档.md)。

### Q: 如何调试问题？
A: 使用 `--log-level debug` 参数，参考 [日志与监控设计](guides/日志与监控设计文档.md)。

---

## 📝 文档维护

### 文档状态

| 分类 | 状态 | 文档数 |
|------|------|--------|
| 概览 | ✅ 完整 | 1 |
| 架构 | ✅ 完整 | 3 |
| 模块 | ✅ 完整 | 5 |
| API | ✅ 完整 | 1 |
| 指南 | ✅ 完整 | 2 |
| 示例 | ✅ 完整 | 1 |

### 贡献指南

1. 新增功能前先更新设计文档
2. 保持文档与代码同步
3. 使用清晰的 Markdown 格式
4. 提供示例和图表

---

## 🔗 外部资源

- [项目仓库](https://github.com/your-org/report-cli)
- [问题反馈](https://github.com/your-org/report-cli/issues)
- [更新日志](./CHANGELOG.md)

---

**最后更新**: 2025-01-30
**文档版本**: 1.0.0
**维护者**: Platform Team
