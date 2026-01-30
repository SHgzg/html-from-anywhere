# 核心 TypeScript 接口与模块边界设计文档

## 1. 设计目标

本文档用于定义 **系统核心抽象的 TypeScript 接口**，而非具体实现。

目标是：

* 将前述设计文档中的概念固化为类型边界
* 为后续 monorepo / 模块拆分提供稳定契约
* 在编码前暴露潜在设计冲突

---

## 2. 模块划分总览（逻辑）

```
cli
bootstrap
config
enhance
lifecycle
render
action
```

各模块通过接口通信，不直接依赖实现。

---

## 3. RuntimeContext

RuntimeContext 是启动阶段构建完成的只读上下文。

```ts
export interface DateContext {
  rawDate: string;          // YYYY-MM-DD
  YYYY: string;
  YY: string;
  MM: string;
  DD: string;
  YYYYMMDD: string;
  YYMMDD: string;
  MMDD: string;
}

export interface EnvConfig {
  minio: Record<string, MinioConnectionConfig>;
  userConfigDB: {
    uri: string;
    database: string;
    collection: string;
  };
}

export interface RuntimeContext {
  envConfig: EnvConfig;
  dateContext: DateContext;
  cliArgs: Record<string, unknown>;
}
```

RuntimeContext 在系统生命周期中只读传递。

---

## 4. UserConfig 与 ExecutableConfig

### 4.1 UserConfig（原始）

UserConfig 不做强 schema 约束，只保证可解析。

```ts
export type UserConfig = Record<string, unknown>;
```

---

### 4.2 ExecutableConfig（增强后）

ExecutableConfig 是 Enhance 完成后的配置快照。

```ts
export interface ExecutableConfig {
  report: ReportConfig;
  data: DataItemConfig[];
  actions: ActionConfig[];
  meta?: Record<string, unknown>;
}
```

---

## 5. Enhance 接口

Enhance 是纯函数配置增强器。

```ts
export interface EnhanceContext {
  runtime: RuntimeContext;
}

export interface Enhance {
  name: string;
  apply(
    config: ExecutableConfig,
    context: EnhanceContext
  ): ExecutableConfig;
}
```

Enhance 不允许修改输入对象，应返回新对象或结构化拷贝。

---

## 6. Data 阶段接口

### 6.1 DataItemConfig

```ts
export interface DataItemConfig {
  title: string;
  tag: string;
  source: unknown;
  enhance?: string;
}
```

---

### 6.2 DataResult

```ts
export interface DataResult {
  title: string;
  tag: string;
  data: unknown;
  meta?: Record<string, unknown>;
}
```

---

## 7. Render 接口

### 7.1 RenderMode

```ts
export type RenderMode = 'html' | 'email';
```

---

### 7.2 RenderResult

```ts
export interface RenderResult {
  renderMode: RenderMode;
  content: string;
  meta?: Record<string, unknown>;
}
```

---

### 7.3 TemplateGenerator

```ts
export interface TemplateGenerator {
  renderMode: RenderMode;
  render(params: {
    data: DataResult[];
    config: ExecutableConfig;
    runtime: RuntimeContext;
  }): RenderResult;
}
```

---

## 8. Action 接口

### 8.1 ActionConfig

```ts
export interface ActionConfig {
  type: string;
  on: 'data_ready' | 'report_ready' | 'report_archived';
  renderMode?: RenderMode;
  spec: Record<string, unknown>;
}
```

---

### 8.2 ActionExecutor

```ts
export interface ActionExecutor {
  type: string;
  execute(params: {
    action: ActionConfig;
    data: DataResult[];
    renderResult?: RenderResult;
    runtime: RuntimeContext;
  }): Promise<void>;
}
```

---

## 9. Lifecycle Orchestrator（逻辑接口）

```ts
export interface LifecycleOrchestrator {
  run(): Promise<void>;
}
```

具体阶段拆分在实现层完成。

---

## 9.5 Render 触发与默认规则（补充）

### report_ready 事件的默认 RenderMode

当存在监听 `report_ready` 的 Action，且 ActionConfig 未显式声明 `renderMode` 时，系统必须遵循以下规则：

* 默认 `renderMode = 'html'`
* Render Phase 必须被执行

该规则用于消除执行歧义，保证 Render 决策是确定性的。

> 约定优于配置：report_ready 在语义上即意味着“生成完整报告”。

---

## 9.6 DataResult.meta 推荐字段（非强约束）

虽然 DataResult.meta 不做 schema 强约束，但推荐实现方尽量提供以下字段，以增强 Action / Render 能力：

```ts
interface RecommendedDataMeta {
  rowCount?: number;
  sourceType?: 'http' | 'db' | 'file' | string;
  warnings?: string[];
}
```

这些字段：

* 不参与流程控制
* 仅用于展示、日志或 Action 行为优化

---

## 9.7 report_archived 事件的唯一触发源

`report_archived` 事件语义定义为：

> 报告已被**成功持久化**到长期存储介质

因此：

* 仅 **Storage 类 ActionExecutor** 允许触发该事件
* 其他 Action（如 email / webhook）不得主动 emit 该事件

该约束用于防止报告状态机出现伪完成状态。

---

## 10. 错误边界约定

* 所有接口方法：

  * 抛出 Error 表示阶段失败
* ActionExecutor 错误：

  * 不应中断 orchestrator

---

## 11. 本文档边界

本文档：

* 不定义实现
* 不绑定具体库
* 不涉及性能优化

它的唯一目的：

> **为系统提供一套稳定、可演进的类型契约**
