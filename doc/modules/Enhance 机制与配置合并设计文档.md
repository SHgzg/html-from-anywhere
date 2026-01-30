# Enhance 机制与配置合并设计文档

## 1. Enhance 的设计定位

Enhance 不是“处理逻辑”，而是 **配置增强机制（Configuration Augmentation）**。

其唯一目标是：

> 在保持 user_config 简洁、声明式的前提下，补齐系统执行所必需但不应由用户承担的复杂配置。

---

## 2. Enhance 与 user_config 的关系

### 2.1 分层原则

* user_config：

  * 用户关注的“我要什么”
  * 尽量少字段、少嵌套、少推导

* enhance_config：

  * 开发维护
  * 负责：

    * 参数派生
    * 默认值补齐
    * 结构扩展

最终产物：

```
ExecutableConfig = user_config ⊕ enhance_config
```

其中 ⊕ 表示 **受控合并**，而不是简单覆盖。

---

## 3. Enhance 的加载与启用规则

### 3.1 加载时机

Enhance 发生在以下步骤之后：

```
Resolve user_config
  ↓
Template Resolution
  ↓
Enhance Application
```

Enhance 永远作用于 **模板已解析后的配置**。

---

### 3.2 deprecated 对 Enhance 的影响

当 user_config 标记为 deprecated 时：

* Enhance **整体失效**
* 不加载、不执行任何 enhance_config
* 系统只使用 user_config 本身

> deprecated 是 Enhance 的“硬开关”，而不是提示信息。

---

## 4. Enhance 的作用范围

Enhance 允许：

* 新增字段
* 补齐缺省字段
* 派生中间配置（如执行参数、隐式依赖）

Enhance 明确禁止：

* 删除用户字段
* 修改用户已显式声明的值
* 执行 IO 操作
* 访问外部系统

---

## 5. 配置合并策略

### 5.1 合并优先级

从低到高：

```
Enhance Config
↑
User Config
↑
CLI Override
```

规则：

* 上层只能覆盖下层
* Enhance 永远不能覆盖 user_config 的显式字段

---

### 5.2 合并粒度

* 原始字段存在：

  * 保留 user_config
* 原始字段缺失：

  * Enhance 可补齐

示例：

```json
// user_config
{
  "source": "data/users.json"
}
```

```json
// enhance
{
  "parser": "json",
  "encoding": "utf-8"
}
```

合并结果：

```json
{
  "source": "data/users.json",
  "parser": "json",
  "encoding": "utf-8"
}
```

---

## 6. Enhance 的组织方式（建议）

### 6.1 按能力拆分

Enhance 建议按“能力”而不是按“报告”组织：

* enhance_source_http
* enhance_source_csv
* enhance_table_render
* enhance_email_render

每个 enhance 单元：

* 接收一段局部配置
* 返回补齐后的配置片段

---

### 6.2 Enhance 的纯函数约束

每一个 Enhance 单元必须满足：

* 输入确定 → 输出确定
* 无副作用
* 不依赖执行顺序

这保证了：

* 可测试性
* 可组合性
* 可预测性

---

## 7. Enhance 执行模型

### 7.1 执行顺序

* 先全局 Enhance
* 再局部 Enhance（如 data item / action item）

但顺序 **不影响语义结果**。

---

### 7.2 错误策略

* Enhance 内部错误：

  * 视为配置错误
  * 立即终止执行

Enhance 不做兜底，不做降级。

---

## 8. 本模块边界声明

Enhance 模块 **不负责**：

* 数据加载
* 数据处理
* 报告渲染
* Action 执行

它只负责：

> 将“可读配置”转化为“可执行配置”
