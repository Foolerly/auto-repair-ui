# 前端交接说明（HANDOFF）

> 完整的项目交接说明在后端仓库 `auto-repair-system/HANDOFF.md`，本文件只补充前端相关内容。

## 一、项目与仓库

- 目录：`E:\idea\demo1\auto-repair-ui`
- 技术栈：Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router
- GitHub（私有）：https://github.com/Foolerly/auto-repair-ui
- 后端仓库：`E:\idea\demo1\auto-repair-system`（Spring Boot），`/api` 代理到 `http://localhost:8080`

## 二、前端已完成

1. 界面重做：深色侧边栏与分组菜单、分屏登录页、角色化工作台、全局主题样式。
2. 配件库存页增加左侧分类导航，表格显示分类并高亮低库存。
3. 工单、报价、采购单的“总金额 / 状态”改为只读（金额与状态由后端决定）。
4. 编辑工单、采购单时先请求详情，避免保存时清空明细。
5. RBAC 前端部分：
   - 登录后持久化 `roles`、`permissions`；
   - 侧边栏按权限过滤，无权限分组整体隐藏；
   - 路由守卫按 `ROUTE_PERMISSIONS` 映射拦截，无权限跳回工作台；
   - 旧会话缺少角色权限数据时会清理登录态并要求重新登录；
   - 工作台按角色展示不同内容（管理员/老板、前台、技师、采购）。
6. 接口 401 会自动清理 Token 并跳转登录页（用于 Token 版本号失效场景）。

## 三、关键决策

- **不做 H5 客户端**：论文与任务书只写管理端。`src/views/h5` 与 `/h5` 路由暂时保留，
  但客户 Token 链路是坏的，不要演示，后续要么删除要么修好。

## 四、本地启动

```bash
npm install
npm run dev
```

默认地址 http://localhost:5173 ，后端需先启动并完成数据库初始化。

## 五、下一步

1. 操作审计日志的前端页面（列表、筛选、详情）。
2. 按钮级权限控制（目前只控制到菜单和路由）。
3. 后续若确定删除 H5：移除 `/h5` 路由、`src/views/h5`、`api/index.ts` 中的客户端方法与样式。
