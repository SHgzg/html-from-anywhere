# Action 类型与执行器设计文档

## 1. 设计目标

本模块用于定义 **Action 的类型体系、执行模型与错误边界**。

设计目标是：

* 使 Action 成为“对事件的响应”，而不是流程控制器
* 保证 Action 可扩展、可组合、可失败而不污染主流程
* 明确 Action 与 Render / Data 的依赖关系

---

## 2. Action 的系统定位

Action 位于执行生命周期的最末端：

```
Data Phase
  ↓
Render Phase (optional)
  ↓
Action Phase
```

其本质是：

> **当某个事件发生时，对外部世界做一次副作用操作**

---

## 3. Action 的基本结构

每一个 Action 必须由以下字段组成：

* type
* on（绑定事件）
* spec（执行参数）

示例：

```json
{
  "type": "email",
  "on": "report_ready",
  "spec": {
    "to": ["data-team@domain.com"],
    "subject": "日报"
  }
}
```

---

## 4. Action 触发事件模型

### 4.1 支持的事件

当前系统支持以下事件：

* data_ready
* report_ready
* report_archived

Action **只能**绑定其中一个。

---

### 4.2 事件语义约束

* data_ready

  * 数据已完全准备
  * 不保证存在 RenderResult

* report_ready

  * 至少一个 Render Mode 已完成
  * Action 可声明依赖的 renderMode

* report_archived

  * 报告已成功完成持久化

---

## 5. Action 与 Render 的关系

### 5.1 data_ready Action

* 不允许访问任何 RenderResult
* 只能使用 DataResult 与 ExecutableConfig

---

### 5.2 report_ready Action

* 必须声明所需 renderMode
* 系统仅注入对应 RenderResult

示例：

```json
{
  "type": "email",
  "on": "report_ready",
  "renderMode": "email",
  "spec": { ... }
}
```

---

## 6. Action 执行器（Action Executor）

### 6.1 职责

Action Executor 是 Action 的具体执行单元，负责：

* 校验 spec 合法性
* 执行副作用操作
* 返回执行结果或错误

---

### 6.2 执行约束

Action Executor 必须：

* 明确依赖事件类型
* 不修改 RuntimeContext
* 不影响其他 Action 的执行

---

## 7. 内置 Action 类型

### 7.1 Email Action

用途：

* 发送邮件通知或报告内容

常见 spec 字段：

* to / cc / bcc
* subject
* from
* mode（inline / link）

---

### 7.2 Storage Action

用途：

* 将报告或数据存储到外部介质（如 MinIO）

常见 spec 字段：

* provider
* target（如 MinIO 名称）
* bucket
* path

成功执行后：

* 可触发 report_archived 事件

---

## 8. Action 执行顺序与并发

* 同一事件下：

  * Action 默认可并发执行

* 不同事件：

  * 严格遵循生命周期顺序

系统不保证 Action 的执行顺序。

---

## 9. Action 错误模型

* 单个 Action 失败：

  * 不中断其他 Action
  * 记录错误信息

* 严重错误（如 spec 非法）：

  * Action 本身失败
  * 不回滚已完成 Action

---

## 10. 扩展性原则

新增 Action 类型时，需满足：

* 明确副作用边界
* 不引入生命周期控制逻辑
* 不依赖其他 Action 的执行结果

---

## 11. 本模块边界声明

本模块 **不负责**：

* 数据处理
* 报告渲染
* 生命周期调度

它只负责：

> 定义“在什么事件下，可以对外部世界做什么事”
