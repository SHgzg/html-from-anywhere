# Enhance 配置存储与加载设计文档

## 1. 设计目标

本文档用于定义 **Enhance 配置的存储位置、加载方式和组织结构**。

目标是：
- 明确 enhance_config 存储在哪里
- 定义 enhance_config 的数据结构
- 规范 enhance 的加载和匹配逻辑
- 保证 enhance 机制的确定性和可扩展性

---

## 2. enhance_config 存储位置

### 2.1 MongoDB 存储方案

**数据库：** `report_config`

**Collection：** `enhance_collection`

### 2.2 存储位置选择理由

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| 存储在 user_config DB | 配置集中管理 | 混淆用户配置和系统配置 | ❌ |
| 存储在 report_config DB | 职责分离、统一管理 | 需要额外 DB 连接 | ✅ |
| 存储在本地文件系统 | 无需 DB | 部署复杂、版本控制困难 | ❌ |

---

## 3. enhance_config 数据结构

### 3.1 文档结构

每条 enhance_config 是一个独立的 MongoDB 文档：

```typescript
interface EnhanceDocument {
  _id: ObjectId;
  name: string;              // 唯一标识符
  version: string;           // 版本号 (semver)
  type: EnhanceType;         // Enhance 类型
  scope: EnhanceScope;       // 作用域
  config: Record<string, unknown>;  // 增强配置
  metadata?: {
    author?: string;
    createdAt: Date;
    updatedAt: Date;
    description?: string;
    tags?: string[];
  };
}

type EnhanceType =
  | 'source_http'      // HTTP 数据源增强
  | 'source_file'      // File 数据源增强
  | 'source_csv'       // CSV 数据源增强
  | 'source_inline'    // Inline JSON 数据源增强
  | 'source_glob'      // Glob 文件匹配增强
  | 'render_table'     // Table 渲染增强
  | 'render_chart'     // Chart 渲染增强
  | 'render_html'      // HTML 渲染增强
  | 'render_email'     // Email 渲染增强;

type EnhanceScope = 'global' | 'data_item' | 'action_item' | 'report';
```

### 3.2 name 字段规范

**格式：** `enhance_<scope>_<type>_<variant?>`

**示例：**
- `enhance_source_http_default` - HTTP 数据源默认增强
- `enhance_source_csv_parser` - CSV 解析器增强
- `enhance_render_html_inline` - HTML 内联样式增强
- `enhance_global_date_context` - 全局日期上下文增强

**约束：**
- 全局唯一
- 使用小写字母和下划线
- 描述性强，避免缩写

---

## 4. enhance_config 加载流程

### 4.1 加载时机

```
Bootstrap Phase
  ↓
Connect to report_config DB
  ↓
Load env collection
  ↓
Load enhance_collection  ← 在此加载所有 enhance_config
  ↓
Cache in memory
```

### 4.2 加载策略

- **全量加载**：启动时一次性加载所有 enhance_config
- **内存缓存**：加载后缓存在 RuntimeContext 中
- **懒加载禁用**：不支持运行时动态加载

**理由：**
- enhance_config 数量有限（预期 < 100 条）
- 全量加载可提前发现配置错误
- 避免运行时 DB 查询延迟

---

## 5. enhance_config 与 user_config 的关联

### 5.1 关联方式

user_config 中的 `enhance` 字段引用 enhance_config 的 `name`：

```json
// user_config
{
  "data": [
    {
      "title": "用户数据",
      "source": "https://api.example.com/users",
      "enhance": "enhance_source_http_default"
    }
  ]
}

// enhance_collection (MongoDB)
{
  "name": "enhance_source_http_default",
  "type": "source_http",
  "scope": "data_item",
  "config": {
    "timeout": 30000,
    "retries": 3,
    "headers": {
      "User-Agent": "report-cli/1.0"
    }
  }
}
```

### 5.2 关联规则

| user_config 字段 | enhance_config 匹配规则 |
|------------------|------------------------|
| data[].enhance | 按 name 精确匹配 |
| actions[].enhance | 按 name 精确匹配 |
| report.enhance | 按 name 精确匹配（全局增强） |

---

## 6. Enhance 执行与合并

### 6.1 执行顺序

```
1. Global Enhances (report.enhance)
   ↓
2. Data Item Enhances (data[].enhance)
   ↓
3. Action Item Enhances (actions[].enhance)
```

### 6.2 合并策略

**原则：** enhance_config 只能添加字段，不能覆盖 user_config

```typescript
function mergeEnhance(
  userConfig: Record<string, unknown>,
  enhanceConfig: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...userConfig };

  for (const [key, value] of Object.entries(enhanceConfig)) {
    // user_config 中已存在的字段，保留原值
    if (!(key in result)) {
      result[key] = value;
    }
  }

  return result;
}
```

### 6.3 合并示例

```json
// user_config
{
  "source": "https://api.example.com/users",
  "enhance": "enhance_source_http_default"
}

// enhance_config
{
  "timeout": 30000,
  "retries": 3,
  "headers": {
    "User-Agent": "report-cli/1.0"
  }
}

// 合并结果
{
  "source": "https://api.example.com/users",
  "timeout": 30000,
  "retries": 3,
  "headers": {
    "User-Agent": "report-cli/1.0"
  }
}
```

---

## 7. Enhance 未找到处理

### 7.1 错误级别

| 场景 | 错误级别 | 处理方式 |
|------|----------|----------|
| enhance 不存在 | ERROR | 立即终止执行 |
| enhance 类型不匹配 | ERROR | 立即终止执行 |
| enhance 作用域不匹配 | ERROR | 立即终止执行 |

### 7.2 错误信息格式

```
Error: Enhance not found: 'enhance_source_http_default'
  - Config: user_config.data[0]
  - Referenced by: data[].enhance
  - Available enhances: [enhance_source_http_custom, enhance_source_csv_parser]
```

---

## 8. enhance_config 版本管理

### 8.1 版本号格式

采用语义化版本（Semver）：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的 API 变更
- **MINOR**：向后兼容的功能新增
- **PATCH**：向后兼容的问题修复

### 8.2 版本选择策略

当存在多个版本的 enhance 时：

```typescript
// 1. user_config 可指定版本
{
  "enhance": "enhance_source_http_default@2.1.0"
}

// 2. 未指定版本时，使用最新版本
{
  "enhance": "enhance_source_http_default"  // 使用最新版本
}
```

### 8.3 版本废弃流程

```json
// enhance_config
{
  "name": "enhance_source_http_default",
  "version": "2.0.0",
  "deprecated": {
    "status": "deprecated",
    "replacedBy": "enhance_source_http_v2",
    "message": "This enhance is deprecated, please migrate to v2"
  }
}
```

---

## 9. RuntimeContext 中的 enhance_cache

### 9.1 数据结构

```typescript
interface EnhanceCache {
  byName: Map<string, EnhanceDocument>;
  byType: Map<EnhanceType, EnhanceDocument[]>;
  byScope: Map<EnhanceScope, EnhanceDocument[]>;
}

interface RuntimeContext {
  // ... 其他字段
  enhanceCache: EnhanceCache;
}
```

### 9.2 查询 API

```typescript
// 按名称查询
function getEnhanceByName(name: string): EnhanceDocument | undefined;

// 按类型查询
function getEnhancesByType(type: EnhanceType): EnhanceDocument[];

// 按作用域查询
function getEnhancesByScope(scope: EnhanceScope): EnhanceDocument[];

// 检查是否存在
function hasEnhance(name: string): boolean;
```

---

## 10. 内置 Enhance 示例

### 10.1 HTTP 数据源默认增强

```json
{
  "name": "enhance_source_http_default",
  "version": "1.0.0",
  "type": "source_http",
  "scope": "data_item",
  "config": {
    "timeout": 30000,
    "retries": 3,
    "headers": {
      "User-Agent": "report-cli/1.0",
      "Accept": "application/json"
    },
    "responseType": "json"
  },
  "metadata": {
    "author": "platform_team",
    "description": "HTTP 数据源默认增强配置",
    "tags": ["http", "source", "default"]
  }
}
```

### 10.2 CSV 解析器增强

```json
{
  "name": "enhance_source_csv_parser",
  "version": "1.0.0",
  "type": "source_csv",
  "scope": "data_item",
  "config": {
    "parser": {
      "delimiter": ",",
      "encoding": "utf-8",
      "columns": true,
      "skip_empty_lines": true
    }
  },
  "metadata": {
    "author": "platform_team",
    "description": "CSV 文件解析器增强配置",
    "tags": ["csv", "parser", "source"]
  }
}
```

### 10.3 Table 渲染增强

```json
{
  "name": "enhance_render_table_default",
  "version": "1.0.0",
  "type": "render_table",
  "scope": "data_item",
  "config": {
    "table": {
      "striped": true,
      "hover": true,
      "bordered": false,
      "size": "medium",
      "variant": "default"
    },
    "pagination": {
      "enabled": false,
      "pageSize": 20
    }
  },
  "metadata": {
    "author": "platform_team",
    "description": "Table 渲染默认样式增强",
    "tags": ["table", "render", "default"]
  }
}
```

---

## 11. Enhance 配置初始化

### 11.1 初始化脚本

```bash
# 从 JSON 文件导入 enhance_config
pnpm exec enhance-import ./enhances/*.json

# 导出 enhance_config 到 JSON
pnpm exec enhance-export --output ./enhances-backup/

# 验证 enhance_config
pnpm exec enhance-validate
```

### 11.2 示例初始化数据

参考附录：`RFC/enhances-initial-data.json`

---

## 12. 错误处理

### 12.1 加载失败

```
Error: Failed to load enhance_collection
  - Database: report_config
  - Collection: enhance_collection
  - Cause: Connection timeout
```

**处理方式：** 立即终止执行

### 12.2 重复的 name

```
Error: Duplicate enhance name: 'enhance_source_http_default'
  - Found 2 documents with the same name
  - Action: Please remove duplicates and retry
```

**处理方式：** 立即终止执行

### 12.3 版本冲突

```
Error: Enhance version conflict: 'enhance_source_http_default'
  - Requested: ^2.0.0
  - Available: 1.0.0, 1.5.0
  - Action: Update user_config or install newer enhance
```

**处理方式：** 立即终止执行

---

## 13. 本模块边界声明

本模块 **不负责**：
- Enhance 的具体实现逻辑（由 enhance-core 包负责）
- user_config 的解析（由 config 包负责）
- enhance_config 的创建和管理（由运维工具负责）

它只负责：
> **定义 enhance_config 的存储结构、加载方式和与 user_config 的关联规则**
