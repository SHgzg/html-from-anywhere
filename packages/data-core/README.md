# Data Core - 数据源配置文档

本文档详细说明所有数据源类型的配置格式和使用方法。

## 目录

- [数据源类型概览](#数据源类型概览)
- [Inline 数据源](#inline-数据源)
- [File 数据源](#file-数据源)
- [HTTP/HTTPS 数据源](#httphttps-数据源)
- [Glob 数据源](#glob-数据源)
- [DB 数据源](#db-数据源)
- [数据类型标识](#数据类型标识)
- [完整配置示例](#完整配置示例)

---

## 数据源类型概览

| 数据源类型 | tag | 说明 | 适用场景 |
|-----------|-----|------|---------|
| **inline** | `inline` | 内联数据，直接在配置中定义 | 静态数据、测试数据 |
| **file** | `file` | 从本地文件系统读取 | 本地数据文件 |
| **https** | `https` | 通过 HTTPS 请求获取 | 外部 API |
| **http** | `http` | 通过 HTTP 请求获取 | 内网 API |
| **glob** | `glob` | 使用通配符匹配多个文件 | 批量文件处理 |
| **db** | `db` | 从数据库查询数据 | MongoDB 等数据库 |

---

## Inline 数据源

### 基本格式

直接在配置中定义数据，支持对象、数组、字符串等类型。

```typescript
{
  title: "数据项标题",
  tag: "inline",
  source: <数据>
}
```

### 配置示例

#### 1. 表格数据（对象数组）

```typescript
{
  title: "销售数据",
  tag: "inline",
  source: [
    { product: "Laptop", sales: 120, amount: 120000 },
    { product: "Mouse", sales: 500, amount: 15000 },
    { product: "Keyboard", sales: 300, amount: 13500 }
  ]
}
```

**返回结果：**
```typescript
{
  title: "销售数据",
  tag: "inline",
  data: [...],
  meta: {
    dataType: "table",
    rows: 3,
    columns: 3,
    timestamp: "2025-01-15T..."
  }
}
```

#### 2. 单个对象

```typescript
{
  title: "报告元数据",
  tag: "inline",
  source: {
    author: "张三",
    version: "1.0.0",
    createdAt: "2025-01-15"
  }
}
```

**返回结果：**
```typescript
{
  meta: {
    dataType: "object"
  }
}
```

#### 3. 内联 JSON 字符串

```typescript
{
  title: "配置数据",
  tag: "inline",
  source: '{"status": "active", "count": 42}'
}
```

#### 4. 纯文本

```typescript
{
  title: "备注信息",
  tag: "inline",
  source: "这是一段备注文本"
}
```

---

## File 数据源

### 基本格式

从本地文件系统读取数据，根据文件扩展名自动识别类型并处理。

```typescript
{
  title: "数据项标题",
  tag: "file",
  source: "<文件路径>"
}
```

### 支持的文件类型

| 文件类型 | 扩展名 | 处理方式 | dataType |
|---------|--------|---------|----------|
| **CSV** | `.csv` | 解析为对象数组 | `table` |
| **JSON** | `.json` | 解析 JSON | `table` / `object` |
| **图片** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.svg`, `.ico` | 转换为 base64 | `image` |
| **文本** | 其他 | 读取为文本 | `text` |

### 配置示例

#### 1. CSV 文件

**文件内容** (`./data/sales.csv`):
```csv
Product,Category,Quantity,Price
Laptop,Electronics,5,1200
Mouse,Electronics,20,25
```

**配置**:
```typescript
{
  title: "销售数据",
  tag: "file",
  source: "./data/sales.csv"
}
```

**返回结果**:
```typescript
{
  data: [
    { Product: "Laptop", Category: "Electronics", Quantity: 5, Price: 1200 },
    { Product: "Mouse", Category: "Electronics", Quantity: 20, Price: 25 }
  ],
  meta: {
    dataType: "table",
    format: "csv",
    rows: 3,
    columns: 4
  }
}
```

#### 2. JSON 表格文件

**文件内容** (`./data/employees.json`):
```json
[
  { "id": 1, "name": "Alice", "dept": "Engineering" },
  { "id": 2, "name": "Bob", "dept": "Sales" }
]
```

**配置**:
```typescript
{
  title: "员工列表",
  tag: "file",
  source: "./data/employees.json"
}
```

**返回结果**:
```typescript
{
  data: [...],
  meta: {
    dataType: "table",
    format: "json",
    rows: 2,
    columns: 3
  }
}
```

#### 3. JSON 对象文件

**文件内容** (`./data/config.json`):
```json
{
  "status": "success",
  "total": 100
}
```

**返回结果**:
```typescript
{
  meta: {
    dataType: "object",
    format: "json"
  }
}
```

#### 4. 图片文件

**配置**:
```typescript
{
  title: "销售图表",
  tag: "file",
  source: "./data/chart.png"
}
```

**返回结果**:
```typescript
{
  data: {
    format: "png",
    encoding: "base64",
    data: "iVBORw0KGgoAAAANS..."
  },
  meta: {
    dataType: "image",
    encoding: "base64",
    format: "png"
  }
}
```

#### 5. 文本文件

**配置**:
```typescript
{
  title: "日志文件",
  tag: "file",
  source: "./logs/app.log"
}
```

**返回结果**:
```typescript
{
  meta: {
    dataType: "text",
    format: "text"
  }
}
```

### 路径格式

- 相对路径：`./data/file.json`、`../config/data.json`
- 绝对路径：`/etc/config/data.json`

---

## HTTP/HTTPS 数据源

### 基本格式（字符串）

```typescript
{
  title: "数据项标题",
  tag: "https",  // 或 "http"
  source: "<URL>"
}
```

### 高级格式（对象）

```typescript
{
  title: "数据项标题",
  tag: "https",
  source: {
    url: "<URL>",
    method: "GET",     // 可选：GET, POST, PUT, DELETE
    headers: {         // 可选：请求头
      "Authorization": "Bearer xxx"
    },
    body: "..."        // 可选：请求体（POST/PUT）
  }
}
```

### 配置示例

#### 1. 简单 GET 请求

```typescript
{
  title: "用户数据",
  tag: "https",
  source: "https://api.example.com/users"
}
```

#### 2. 带查询参数的 GET 请求

```typescript
{
  title: "今日销售",
  tag: "https",
  source: "https://api.example.com/sales?date=20250115"
}
```

#### 3. POST 请求

```typescript
{
  title: "创建订单",
  tag: "https",
  source: {
    url: "https://api.example.com/orders",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer token123"
    },
    body: '{"productId": 123, "quantity": 2}'
  }
}
```

#### 4. 使用模板变量

```typescript
{
  title: "指定日期的销售数据",
  tag: "https",
  source: "https://api.example.com/sales?date={{YYYY}}{{MM}}{{DD}}"
}
```

**实际请求 URL**（假设日期为 2025-01-15）:
```
https://api.example.com/sales?date=20250115
```

### 返回结果

```typescript
{
  title: "用户数据",
  tag: "https://api.example.com/users",
  data: <解析后的JSON或原始文本>,
  meta: {
    timestamp: "...",
    url: "...",
    method: "GET",
    status: "success"
  }
}
```

---

## Glob 数据源

### 基本格式

使用通配符匹配多个文件，批量读取数据。

```typescript
{
  title: "数据项标题",
  tag: "glob",
  source: "<glob模式>"
}
```

### Glob 模式语法

| 通配符 | 说明 | 示例 |
|--------|------|------|
| `*` | 匹配任意字符（不含路径分隔符） | `*.json` 匹配所有 JSON 文件 |
| `**` | 匹配任意字符（含路径分隔符） | `**/*.json` 匹配所有子目录的 JSON 文件 |
| `?` | 匹配单个字符 | `file?.json` |
| `[]` | 匹配指定范围内的字符 | `file[0-9].json` |

### 配置示例

#### 1. 匹配单个目录的所有 JSON 文件

```typescript
{
  title: "所有日报数据",
  tag: "glob",
  source: "./data/reports/*.json"
}
```

#### 2. 匹配所有子目录的 CSV 文件

```typescript
{
  title: "所有部门的销售数据",
  tag: "glob",
  source: "./data/**/sales/*.csv"
}
```

#### 3. 匹配特定命名格式的文件

```typescript
{
  title: "月度报表",
  tag: "glob",
  source: "./reports/report-{{YYYY}}-{{MM}}-*.json"
}
```

### 返回结果

```typescript
{
  title: "所有日报数据",
  tag: "./data/reports/*.json",
  data: [
    { file: "data/reports/report-01.json", content: {...} },
    { file: "data/reports/report-02.json", content: {...} },
    { file: "data/reports/report-03.json", content: {...} }
  ],
  meta: {
    timestamp: "...",
    pattern: "./data/reports/*.json",
    count: 3,
    files: ["data/reports/report-01.json", "data/reports/report-02.json", ...]
  }
}
```

---

## DB 数据源

### 基本格式

从数据库查询数据，目前支持 MongoDB。

```typescript
{
  title: "数据项标题",
  tag: "db",
  source: {
    type: "mongodb",
    uri: "<连接URI>",           // 可选，默认使用环境配置
    database: "<数据库名>",
    collection: "<集合名>",
    query: <查询条件>,          // 可选
    options: <查询选项>         // 可选
  }
}
```

### 配置示例

#### 1. 基本查询

```typescript
{
  title: "用户列表",
  tag: "db",
  source: {
    type: "mongodb",
    database: "app_db",
    collection: "users",
    query: { status: "active" }
  }
}
```

#### 2. 使用默认连接

不指定 `uri` 时，自动使用环境配置中的 MongoDB 连接。

```typescript
{
  title: "今日订单",
  tag: "db",
  source: {
    type: "mongodb",
    database: "ecommerce",
    collection: "orders",
    query: {
      createdAt: { $gte: "2025-01-15" }
    }
  }
}
```

#### 3. 带查询选项

```typescript
{
  title: "最新产品",
  tag: "db",
  source: {
    type: "mongodb",
    database: "inventory",
    collection: "products",
    query: { category: "Electronics" },
    options: {
      sort: { price: -1 },
      limit: 10
    }
  }
}
```

#### 4. 聚合查询

```typescript
{
  title: "销售统计",
  tag: "db",
  source: {
    type: "mongodb",
    database: "analytics",
    collection: "sales",
    query: {},  // 空查询匹配所有文档
    options: {
      aggregation: [
        { $group: { _id: "$category", total: { $sum: "$amount" } } }
      ]
    }
  }
}
```

### 返回结果

```typescript
{
  title: "用户列表",
  tag: "mongodb://app_db/users",
  data: [
    { _id: "...", name: "Alice", email: "alice@example.com" },
    { _id: "...", name: "Bob", email: "bob@example.com" }
  ],
  meta: {
    timestamp: "...",
    database: "app_db",
    collection: "users",
    dataType: "table",
    rows: 2,
    columns: 3,
    count: 2
  }
}
```

---

## 数据类型标识

每个数据源的返回结果都包含 `meta.dataType` 字段，用于标识数据类型，方便 render 阶段处理。

| dataType | 说明 | 数据结构示例 |
|----------|------|-------------|
| **table** | 表格数据 | `[{col1: val1, col2: val2}, ...]` |
| **image** | 图片数据 | `{format: "png", encoding: "base64", data: "..."}` |
| **object** | 单个对象 | `{key1: val1, key2: val2}` |
| **text** | 纯文本 | `"文本内容"` |

### dataType 生成规则

#### Inline 数据源
- 数组 → `table`
- 对象 → `object`
- 字符串/其他 → `text`

#### File 数据源
- `.csv` 文件 → `table`
- `.json` 文件（数组） → `table`
- `.json` 文件（对象） → `object`
- 图片文件 → `image`
- 其他文件 → `text`

#### HTTP/HTTPS 数据源
- JSON 数组 → `table`
- JSON 对象 → `object`
- 其他 → `text`

#### Glob 数据源
- 始终返回包含多个文件结果的数组

#### DB 数据源
- MongoDB 查询结果 → `table`

---

## 完整配置示例

### 示例 1：销售报告

```typescript
{
  report: {
    title: "每日销售报告",
    data: []
  },
  data: [
    // 1. 内联的配置信息
    {
      title: "报告配置",
      tag: "inline",
      source: {
        author: "销售部",
        version: "1.0.0",
        refreshInterval: "daily"
      }
    },
    // 2. 从 CSV 文件读取销售明细
    {
      title: "销售明细",
      tag: "file",
      source: "./data/sales-{{YYYY}}{{MM}}{{DD}}.csv"
    },
    // 3. 从数据库获取客户信息
    {
      title: "VIP 客户",
      tag: "db",
      source: {
        type: "mongodb",
        database: "crm",
        collection: "customers",
        query: { level: "VIP", status: "active" }
      }
    },
    // 4. 从 API 获取实时汇率
    {
      title: "实时汇率",
      tag: "https",
      source: "https://api.example.com/rates?base=CNY"
    },
    // 5. 批量读取多个历史报告
    {
      title: "历史报告",
      tag: "glob",
      source: "./archive/reports-{{YYYY}}-{{MM}}-*.json"
    },
    // 6. 报告中的图表
    {
      title: "销售趋势图",
      tag: "file",
      source: "./charts/trend-{{YYYY}}{{MM}}{{DD}}.png"
    }
  ],
  actions: [
    {
      type: "file_output",
      on: "report_ready",
      spec: {
        path: "./output/sales-report-{{YYYY}}{{MM}}{{DD}}.html"
      }
    }
  ]
}
```

### 示例 2：系统监控报告

```typescript
{
  report: {
    title: "系统状态监控",
    data: []
  },
  data: [
    {
      title: "系统信息",
      tag: "inline",
      source: {
        environment: "production",
        region: "cn-north-1",
        version: "2.5.1"
      }
    },
    {
      title: "服务器状态",
      tag: "https",
      source: {
        url: "https://internal.api/health/status",
        headers: {
          "Authorization": "Bearer {{HEALTH_CHECK_TOKEN}}"
        }
      }
    },
    {
      title: "错误日志摘要",
      tag: "file",
      source: "./logs/error-summary-{{YYYY}}{{MM}}{{DD}}.json"
    },
    {
      title: "所有服务日志",
      tag: "glob",
      source: "./logs/services/*-{{YYYY}}{{MM}}{{DD}}.log"
    }
  ],
  actions: [
    {
      type: "sendEmail",
      on: "report_ready",
      spec: {
        to: "ops-team@example.com",
        subject: "系统状态报告 - {{YYYY}}-{{MM}}-{{DD}}"
      }
    }
  ]
}
```

---

## 模板变量

在数据源配置中可以使用以下模板变量：

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `{{YYYY}}` | 四位年份 | 2025 |
| `{{YY}}` | 两位年份 | 25 |
| `{{MM}}` | 月份（补零） | 01 |
| `{{DD}}` | 日期（补零） | 15 |
| `{{YYYYMMDD}}` | 完整日期 | 20250115 |
| `{{YYMMDD}}` | 短日期 | 250115 |
| `{{MMDD}}` | 月日 | 0115 |

### 使用示例

```typescript
{
  // 文件路径中使用日期
  source: "./data/sales-{{YYYY}}{{MM}}{{DD}}.csv"

  // URL 查询参数中使用日期
  source: "https://api.example.com/data?date={{YYYY}}-{{MM}}-{{DD}}"

  // 数据库查询中使用日期
  source: {
    type: "mongodb",
    database: "logs",
    collection: "access_logs",
    query: { date: "{{YYYYMMDD}}" }
  }
}
```

---

## 错误处理

### 常见错误及解决方法

| 错误类型 | 可能原因 | 解决方法 |
|---------|---------|---------|
| `Cannot detect data source type` | source 配置格式错误 | 检查 source 是否为有效的字符串或对象 |
| `Failed to read file` | 文件不存在或无权限 | 检查文件路径是否正确 |
| `HTTP request failed` | 网络错误或 API 不可用 | 检查网络连接和 API 状态 |
| `MongoDB query failed` | 数据库连接或查询错误 | 检查数据库连接配置和查询语法 |
| `CSV parse error` | CSV 格式不正确 | 检查 CSV 文件格式 |

### 错误处理策略

默认情况下，任何单个数据源获取失败都会终止整个报告生成流程。

如需自定义错误处理，可以在后续的 action-core 中实现错误恢复逻辑。
