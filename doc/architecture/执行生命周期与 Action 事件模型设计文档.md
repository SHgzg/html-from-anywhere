# 执行生命周期与 Action 事件模型设计文档

## 1. 设计目标

本模块用于定义：

* 程序从“配置就绪”到“执行完成”的完整生命周期
* 各阶段之间的**确定性边界**
* Action 的触发时机、依赖条件与执行约束

目标是确保：

* 执行顺序可预测
* Action 行为可推导
* 渲染、存储、通知之间解耦

---

## 2. 生命周期总览

完整执行生命周期被划分为以下阶段：

```
Bootstrap Phase
  ↓
Config Phase
  ↓
Data Phase
  ↓
Render Phase (Conditional)
  ↓
Action Phase
```

各阶段**线性推进**，不存在回溯或并行调度。

---

## 3. Bootstrap Phase（回顾）

职责：

* 加载 .env
* 连接 report_config
* 加载 env collection
* 解析 user_config（DB | local）
* 解析 CLI 参数
* 构建 RuntimeContext

输出：

* RuntimeContext（只读）

失败策略：

* 任一失败 → 立即退出

---

## 4. Config Phase

### 4.1 阶段职责

Config Phase 的目标是：

> 将“原始配置”转化为“可执行配置”

具体步骤：

```
user_config
  ↓
Template Resolution
  ↓
Deprecated Check
  ↓
Enhance Application (optional)
  ↓
ExecutableConfig
```

---

### 4.2 Deprecated Check

* 若 user_config 标记为 deprecated：

  * 禁用 Enhance
  * 直接进入 ExecutableConfig

deprecated 在此阶段生效，后续阶段不再关心该字段。

---

## 5. Data Phase

### 5.1 阶段职责

Data Phase 负责：

* 根据 ExecutableConfig 中的 data 定义
* 获取原始数据
* 执行结构化转换
* 生成 **标准化数据结果（DataResult）**

> 本阶段不关心报告形式，只关心“数据是否就绪”。

---

### 5.2 DataResult 定义（逻辑）

DataResult 是一个结构化对象，包含：

* 原始数据结果
* 元信息（如来源、标题、tag）
* Enhance 注入的派生字段

DataResult 是 Render Phase 与 Action Phase 的共同输入。

---

### 5.3 data_ready 事件

当所有 data item 均完成处理后：

```
emit event: data_ready
```

语义保证：

* 所有数据已确定
* 不依赖任何渲染结果

---

## 6. Render Phase（条件阶段）

### 6.1 Render Phase 的存在条件

Render Phase **不是必经阶段**。

触发条件：

* 至少存在一个 Action 依赖 report_ready 事件

否则：

* Render Phase 被整体跳过

---

### 6.2 Render Mode

系统内置两种 Render Mode：

1. **HTML Report Mode**

   * 生成完整 HTML
   * 允许 JS / 交互

2. **Email Report Mode**

   * 生成邮件友好内容
   * 偏向 inline / 静态

Render Mode 由 Action 声明需求决定。

---

### 6.3 多 Render Mode 支持

* 同一次执行中：

  * 允许生成多个 Render Mode
* 每种 Render Mode：

  * 最多生成一次

Render Phase 的产物是：

```
RenderResult[renderMode]
```

---

### 6.4 report_ready 事件

当某一 Render Mode 完成后：

```
emit event: report_ready (with renderMode)
```

Action 可基于 renderMode 选择性响应。

---

## 7. Action Phase

### 7.1 Action 的基本结构

每一个 Action 至少包含：

* type
* on（事件名）
* spec（执行参数）

Action 不主动执行，只响应事件。

---

### 7.2 Action 触发事件

当前支持的事件：

* data_ready
* report_ready
* report_archived

Action 只能绑定其中之一。

---

### 7.3 Action 与 Render 的关系

* 绑定 data_ready 的 Action：

  * 不允许访问 RenderResult

* 绑定 report_ready 的 Action：

  * 可声明所需 renderMode

---

### 7.4 Action 执行顺序

* 同一事件下：

  * Action 顺序不保证
* 不同事件：

  * 严格按生命周期顺序

---

## 8. report_archived 事件

当以下条件满足时触发：

* 报告已成功存储
* 存储 Action 明确声明归档完成

该事件通常用于：

* 成功通知
* 二次分发

---

## 9. 错误模型

* Data Phase 错误：

  * 终止后续所有阶段

* Render Phase 错误：

  * 仅影响依赖该 renderMode 的 Action

* Action 错误：

  * 默认不中断其他 Action
  * 错误被记录

---

## 10. 本模块边界声明

本模块 **不负责**：

* Enhance 实现
* 模板生成器实现
* 数据源适配

它只负责：

> 定义“什么时候可以做什么事”
