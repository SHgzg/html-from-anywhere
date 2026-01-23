# HTML From Anywhere

一个强大的 TypeScript 命令行工具，可以从多种数据源获取数据，处理成指定格式，并生成兼容主流邮件客户端的 HTML 文件。

## 功能特性

- 🔌 **多数据源支持**
  - HTTP/HTTPS API
  - 本地文件（JSON、CSV、Markdown）
  - 数据库（MySQL、PostgreSQL、MongoDB）
  - 直接字符串输入

- 🔄 **数据管道架构**
  - 条件采集（when 表达式）
  - 格式化器（JSON、CSV、XML、自定义）
  - 过滤器（字段过滤、值过滤）
  - 错误处理策略（throw、skip、default、retry）
  - 数据聚合（merge、concat、custom）
  - 聚合后处理（filter、formatter、sort、limit）

- 📊 **多种输出格式**
  - HTML 表格
  - 图片嵌入（Base64、CID、URL）
  - 文字内容（带样式）
  - Markdown 转 HTML

- 📧 **邮件客户端兼容**
  - 兼容 Gmail、Outlook、Apple Mail
  - 使用内联样式
  - 表格布局

## 安装

```bash
npm install -g html-from-anywhere
```

或从源码安装：

```bash
git clone <repository-url>
cd html-from-anywhere
npm install
npm run build
npm link
```

## 快速开始

### 从 URL 获取数据并生成表格邮件

```bash
html-from-anywhere fetch \
  --url="https://jsonplaceholder.typicode.com/users" \
  --output=email.html \
  --format=table \
  --subject="用户列表"
```

### 从本地文件读取数据

```bash
html-from-anywhere file \
  --path="./data.csv" \
  --output=email.html \
  --format=table
```

### 处理图片

```bash
html-from-anywhere image \
  --url="https://example.com/photo.jpg" \
  --width=800 \
  --format=base64 \
  --output=email.html
```

### 处理文本

```bash
html-from-anywhere text \
  --content="Hello World" \
  --align=center \
  --color="#FF0000" \
  --output=email.html
```

### 转换 Markdown

```bash
html-from-anywhere markdown \
  --file="README.md" \
  --output=email.html \
  --subject="项目文档"
```

## 数据管道配置

创建管道配置文件来处理多个数据源：

### 配置示例

```typescript
// configs/pipeline.config.ts
import { FetcherConfig } from './src/pipeline/types';

export const fetchers: FetcherConfig[] = [
  {
    id: 'users',
    source: {
      type: 'http',
      url: 'https://api.example.com/users',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
      },
    },
    condition: {
      when: 'data.active === true',
    },
    process: {
      formatter: { type: 'json' },
      filter: {
        type: 'field',
        rules: [
          { field: 'age', operator: 'gt', value: 18 },
        ],
      },
      error: { strategy: 'retry', maxRetries: 3 },
    },
  },
  {
    id: 'products',
    source: {
      type: 'file',
      path: './data/products.csv',
    },
    process: {
      formatter: { type: 'csv' },
      error: { strategy: 'skip' },
    },
  },
];

export const aggregate = {
  strategy: 'merge' as const,
  parallel: true,
  postProcess: {
    sort: { field: 'createdAt', order: 'desc' as const },
    limit: 100,
  },
};
```

### 使用管道配置

```bash
html-from-anywhere pipeline \
  --config="./configs/pipeline.config.ts" \
  --output=email.html \
  --subject="数据报告"
```

## 命令参考

### 全局选项

- `-V, --version` - 输出版本号
- `-h, --help` - 显示帮助信息

### fetch 命令

从 HTTP/HTTPS URL 获取数据

```bash
html-from-anywhere fetch [options]
```

**选项：**
- `-u, --url <url>` - 数据源 URL（必需）
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-f, --format <type>` - 输出格式：table、image、text、markdown（默认：table）
- `-s, --subject <subject>` - 邮件主题
- `-t, --template <name>` - 邮件模板名称（默认：default）
- `-m, --method <method>` - HTTP 方法（默认：GET）
- `-H, --header <header>` - HTTP 请求头（key:value 格式）

### file 命令

从本地文件读取数据

```bash
html-from-anywhere file [options]
```

**选项：**
- `-p, --path <path>` - 文件路径（必需）
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-f, --format <type>` - 输出格式：table、image、text、markdown（默认：table）
- `-s, --subject <subject>` - 邮件主题
- `-t, --template <name>` - 邮件模板名称（默认：default）

### db 命令

从数据库查询数据

```bash
html-from-anywhere db [options]
```

**选项：**
- `-c, --connection <connection>` - 数据库连接字符串（必需）
- `-q, --query <query>` - SQL 查询（必需）
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-f, --format <type>` - 输出格式（默认：table）
- `-s, --subject <subject>` - 邮件主题
- `-t, --template <name>` - 邮件模板名称（默认：default）
- `-p, --params <params>` - 查询参数（JSON 数组格式）

### string 命令

处理字符串数据

```bash
html-from-anywhere string [options]
```

**选项：**
- `-d, --data <data>` - 字符串数据（JSON、CSV 等，必需）
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-f, --format <type>` - 输出格式：table、text、markdown（默认：table）
- `-s, --subject <subject>` - 邮件主题
- `-t, --template <name>` - 邮件模板名称（默认：default）

### pipeline 命令

执行数据管道

```bash
html-from-anywhere pipeline [options]
```

**选项：**
- `-c, --config <path>` - 管道配置文件路径（必需）
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-s, --subject <subject>` - 邮件主题
- `-t, --template <name>` - 邮件模板名称（默认：default）
- `-f, --fetcher <ids>` - 要执行的采集器 ID（逗号分隔）

### image 命令

处理图片

```bash
html-from-anywhere image [options]
```

**选项：**
- `-u, --url <url>` - 图片 URL 或文件路径（必需）
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-f, --format <type>` - 嵌入格式：base64、cid、url（默认：base64）
- `-W, --width <number>` - 图片宽度
- `-H, --height <number>` - 图片高度
- `-q, --quality <number>` - 图片质量（1-100）

### text 命令

处理文本内容

```bash
html-from-anywhere text [options]
```

**选项：**
- `-c, --content <content>` - 文本内容（必需）
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-s, --subject <subject>` - 邮件主题
- `-a, --align <align>` - 文本对齐：left、center、right、justify
- `--color <color>` - 文本颜色（十六进制）
- `--font-size <size>` - 字体大小（像素）
- `--font-weight <weight>` - 字体粗细：normal、bold

### markdown 命令

转换 Markdown

```bash
html-from-anywhere markdown [options]
```

**选项：**
- `-f, --file <path>` - Markdown 文件路径
- `-c, --content <content>` - Markdown 内容字符串
- `-o, --output <path>` - 输出文件路径（默认：output.html）
- `-s, --subject <subject>` - 邮件主题
- `-t, --template <name>` - 邮件模板名称（默认：default）

## 开发

### 项目结构

```
html-from-anywhere/
├── src/
│   ├── cli/                    # CLI 入口和命令
│   ├── pipeline/               # 数据采集管道
│   ├── processors/             # 数据处理器
│   ├── generators/             # HTML 生成器
│   ├── utils/                  # 工具函数
│   └── types/                  # 类型定义
├── templates/                  # 邮件模板
├── configs/                    # 配置示例
└── tests/                      # 测试文件
```

### 构建

```bash
npm run build
```

### 运行

```bash
npm start -- [command] [options]
```

### 测试

```bash
npm test
```

## 许可证

MIT
