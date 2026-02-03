# Render-Core 设计讨论与约束

本文档用于在实现 render-core 之前进行前瞻性讨论、分析和约束定义。

## 目录

- [核心目标](#核心目标)
- [输入输出分析](#输入输出分析)
- [数据类型与渲染策略](#数据类型与渲染策略)
- [渲染模式设计](#渲染模式设计)
- [关键约束](#关键约束)
- [待讨论问题](#待讨论问题)

---

## 核心目标

render-core 的核心职责是：**将 data-core 返回的标准化数据渲染成可读的报告格式**。

### 关键原则

1. **纯函数式** - 渲染过程无副作用，不执行 IO 操作
2. **数据驱动** - 根据 `dataType` 自动选择渲染方式
3. **可扩展** - 支持多种渲染模式和自定义模板
4. **内网友好** - 不依赖外部资源（图片转为 base64，样式内联）

---

## 输入输出分析

### 输入：DataResult[]

```typescript
interface DataResult {
  title: string;           // 数据项标题
  tag: string;            // 数据来源标识
  data: unknown;          // 实际数据
  meta?: {
    dataType: 'table' | 'image' | 'object' | 'text';
    format?: string;      // csv, json, png, etc.
    rows?: number;        // 表格行数
    columns?: number;     // 表格列数
    encoding?: string;    // base64 for images
    // ... 其他元数据
  };
}
```

### 输出：RenderResult

```typescript
interface RenderResult {
  renderMode: RenderMode;
  content: string;        // 渲染后的内容（HTML/Email/Text/etc.）
  meta?: {
    dataCount: number;
    generatedAt: string;
    // ... 其他元数据
  };
}
```

---

## 数据类型与渲染策略

### 1. dataType: 'table' → 表格渲染

**数据结构：**
```typescript
data: Array<Record<string, unknown>>
```

**渲染策略：**

| 场景 | HTML 渲染 | Email 渲染 |
|------|----------|-----------|
| 小表格 (<50 行) | 完整 HTML 表格 | 完整 HTML 表格 |
| 大表格 (≥50 行) | 表格 + 分页 | 前 20 行预览 + "查看完整报告" 链接 |
| 宽列 (>10 列) | 水平滚动 | 隐藏次要列或转置 |

**表格功能需求：**
- ✅ 基本表格展示
- ✅ 表头样式（背景色、加粗）
- ✅ 斑马纹（交替行颜色）
- ❓ 排序功能（需要 JS，但内网环境可能不允许）
- ❓ 过滤功能（需要 JS）
- ❓ 导出 CSV（需要下载，属于 Action 层）

### 2. dataType: 'image' → 图片渲染

**数据结构：**
```typescript
data: {
  format: string;     // png, jpg, etc.
  encoding: 'base64';
  data: string;       // base64 编码的图片数据
}
```

**渲染策略：**

| 场景 | HTML 渲染 | Email 渲染 |
|------|----------|-----------|
| 小图 (<100KB) | 内联 `<img src="data:image/...">` | 内联 CID 或 base64 |
| 大图 (≥100KB) | 缩略图 + 点击放大 | 缩略图 + "查看大图" 链接 |

**图片功能需求：**
- ✅ Base64 内联显示
- ✅ 响应式宽度（max-width: 100%）
- ✅ Alt 文本（使用 title）
- ❓ 图片放大/缩小（需要 JS）

### 3. dataType: 'object' → 对象渲染

**数据结构：**
```typescript
data: Record<string, unknown>
```

**渲染策略：**

| 场景 | HTML 渲染 | Email 渲染 |
|------|----------|-----------|
| 简单对象 | 键值对列表 | 键值对列表 |
| 嵌套对象 | 树形结构或缩进展示 | 缩进展示 |
| 大对象 (>10 属性) | 折叠/展开 | 主要属性 + "查看全部" |

**对象展示格式：**
```
Key1: Value1
Key2: Value2
  NestedKey: NestedValue
```

### 4. dataType: 'text' → 文本渲染

**数据结构：**
```typescript
data: string
```

**渲染策略：**

| 场景 | HTML 渲染 | Email 渲染 |
|------|----------|-----------|
| 短文本 (<500 字) | 段落显示 | 段落显示 |
| 长文本 (≥500 字) | `<pre>` 或折叠 | 前 200 字 + "查看更多" |
| 代码文本 | `<pre><code>` + 语法高亮 | 纯文本（无高亮） |

---

## 渲染模式设计

### 当前定义

```typescript
type RenderMode = 'html' | 'email';
```

### 需要讨论：是否需要更多模式？

| 模式 | 用途 | 优先级 | 讨论 |
|------|------|--------|------|
| **html** | 完整 HTML 报告 | 🔴 必需 | 已定义 |
| **email** | 邮件 HTML（更简洁） | 🔴 必需 | 已定义 |
| **markdown** | Markdown 文档 | 🟡 可选 | 可用于文档归档 |
| **json** | 原始 JSON 数据 | 🟢 低 | 可用于 API 返回 |
| **text** | 纯文本 | 🟢 低 | 某些老系统需要 |

### HTML vs Email 的差异

| 特性 | HTML | Email |
|------|------|-------|
| CSS 支持 | 完整 CSS3 | 内联样式，有限 CSS |
| JavaScript | ✅ 支持 | ❌ 不支持 |
| 图片 | 任意方式 | 最佳用 CID 或外链 |
| 布局 | Flexbox/Grid | Table 布局 |
| 响应式 | Media Queries | Fluid width |
| 字体 | Web Fonts | 系统字体 |

**约束：** Email 渲染必须兼容主流邮件客户端（Gmail, Outlook, Foxmail 等）

---

## 关键约束

### 1. 纯函数约束

```typescript
// ✅ 正确：纯函数
async render(data, config, context): Promise<RenderResult> {
  const html = generateHTML(data);
  return { renderMode: 'html', content: html };
}

// ❌ 错误：有副作用
async render(data, config, context): Promise<RenderResult> {
  await fs.writeFile('output.html', html); // 不允许 IO
  return { ... };
}
```

### 2. 内网环境约束

- ❌ 不使用 CDN（如 `<link href="https://cdn...">`）
- ❌ 不依赖外部字体
- ❌ 不使用外链图片（除非用户配置）
- ✅ 所有资源内联（CSS、字体、图片 base64）

### 3. 数据安全约束

- 对用户输入进行 HTML 转义（防 XSS）
- base64 图片需要验证格式
- 大表格需要限制行数（防内存溢出）

### 4. 性能约束

- 大表格分页或截断
- 大图缩略图
- 渲染超时控制（建议 30s）

---

## 待讨论问题

### 问题 1：模板系统设计

**选项 A：固定模板**
```typescript
// 简单，但不灵活
const template = `
<html>
<body>
  ${data.map(renderDataItem).join('\n')}
</body>
</html>
`;
```

**选项 B：模板引擎（如 Handlebars）**
```typescript
// 灵活，但增加依赖
const template = Handlebars.compile(source);
return template({ data, config });
```

**选项 C：配置化模板**
```typescript
// 用户在配置中指定模板结构
{
  report: {
    template: {
      header: '<h1>{{title}}</h1>',
      dataSection: '<div class="data">{{content}}</div>',
      footer: '<p>Generated at {{timestamp}}</p>'
    }
  }
}
```

**建议：** 先实现选项 A（固定模板），后续可扩展选项 C

---

### 问题 2：表格大数据处理

**场景：** 表格有 10,000 行数据

**选项 A：客户端分页（需要 JS）**
```html
<table>
  <thead>...</thead>
  <tbody>
    <!-- 只显示前 50 行 -->
    <tr>...</tr>
  </tbody>
</table>
<button onclick="loadMore()">加载更多</button>
```

**选项 B：服务端截断**
```html
<table>
  <!-- 只渲染前 50 行 -->
</table>
<p>... 共 10,000 行，仅显示前 50 行</p>
```

**选项 C：导出提示**
```html
<table><!-- 前 50 行 --></table>
<a href="/download-csv">下载完整 CSV</a>
```

**建议：**
- HTML 模式：选项 A（客户端分页）或 B（截断）
- Email 模式：选项 B（截断，因为邮件客户端不支持 JS）

---

### 问题 3：样式隔离与主题

**需求：** 支持自定义主题（颜色、字体等）

**选项 A：内置主题**
```typescript
const themes = {
  default: { primaryColor: '#007bff', ... },
  dark: { primaryColor: '#bb86fc', ... },
  minimal: { primaryColor: '#333', ... }
};
```

**选项 B：CSS 变量**
```html
<style>
  :root {
    --primary-color: {{config.theme?.primary || '#007bff'}};
  }
  h1 { color: var(--primary-color); }
</style>
```

**选项 C：完全自定义 CSS**
```typescript
{
  report: {
    customCSS: 'h1 { color: red; }'
  }
}
```

**建议：** 选项 B（CSS 变量）+ 配置覆盖

---

### 问题 4：图片处理策略

**场景：** 用户在 data 中提供了 5MB 的图片

**选项 A：原图显示**
```html
<img src="data:image/png;base64,..." width="100%">
```
- ❌ Email 可能有大小限制
- ❌ 加载慢

**选项 B：自动压缩**
```typescript
// 需要图片处理库（sharp）
const compressed = await sharp(image).resize(800, 600).toBuffer();
```
- ✅ 解决大小问题
- ❌ 增加依赖和复杂度

**选项 C：缩略图 + 链接**
```html
<img src="thumbnail..." onclick="window.open(fullImage)">
```
- ✅ 平衡方案
- ❌ 需要存储原图（IO 操作）

**建议：** 先实现选项 A（原图），在大图情况下给出警告，后续添加选项 B

---

### 问题 5：表格样式

**需求：** 表格需要可读、美观

**最小样式（必须）：**
```css
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; font-weight: bold; }
tr:nth-child(even) { background-color: #f9f9f9; }  /* 斑马纹 */
```

**扩展样式（可选）：**
- 悬停高亮（`:hover`）
- 固定表头（`position: sticky`）
- 列宽自适应
- 数字右对齐，文本左对齐

**Email 兼容性：**
```css
/* Outlook 需要额外的 table 布局 */
table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
```

---

## 实现优先级建议

### Phase 1: MVP（最小可行产品）

1. ✅ **HTML 渲染器**
   - 表格渲染（固定样式）
   - 图片渲染（base64 内联）
   - 对象渲染（键值对列表）
   - 文本渲染（`<pre>`）

2. ✅ **Email 渲染器**
   - 基于 HTML 渲染器，简化样式
   - 移除 JavaScript
   - 使用 table 布局

### Phase 2: 增强功能

3. ⚠️ **大表格处理**
   - 分页或截断
   - 行数限制配置

4. ⚠️ **主题系统**
   - CSS 变量
   - 配置覆盖

### Phase 3: 高级功能

5. 📋 **Markdown 渲染器**
6. 📋 **自定义模板**
7. 📋 **图片压缩**

---

## 决策建议

| 问题 | 建议 | 理由 |
|------|------|------|
| **模板系统** | 固定模板 + CSS 变量 | 简单、可靠 |
| **大表格** | 截断（HTML/Email 都适用） | 邮件兼容性 |
| **图片处理** | 原图 + 大小警告 | 避免额外依赖 |
| **样式主题** | CSS 变量 + 配置覆盖 | 灵活且简单 |
| **JavaScript** | HTML 可选，Email 禁用 | 兼容性考虑 |

---

## 下一步行动

1. **确认上述决策** - 讨论并达成一致
2. **扩展 RenderMode** - 是否需要 markdown/json/text？
3. **定义插件接口** - 确认是否需要扩展
4. **开始实现** - 先实现 HTML 渲染器

请讨论并提供反馈！
