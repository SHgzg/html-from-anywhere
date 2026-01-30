完美！插件系统的 Registry 系统已经全部实现并编译通过！

当前状态总结
✅ 已完成的核心组件
BaseRegistry 基类

✅ 启动期注册锁
✅ contracts 版本校验（semver）
✅ 重复注册检测
✅ 强失败
各子系统 Registry

✅ ActionRegistry - 按 ActionType 查找
✅ DataRegistry - 按 DataSourceType 查找
✅ RenderRegistry - 按 RenderMode 查找
✅ EnhanceRegistry - Pipeline 模式，顺序执行
Bootstrap 集成

✅ 创建所有 Registry 实例
✅ 锁定 Registry（防止运行期注册）
✅ 构建完整的 RuntimeContext
防腐措施验证

运行日志显示：[Bootstrap] Locking registries...
错误抛出：PluginNotFoundError: No plugin registered for key: https
强失败机制正确工作！