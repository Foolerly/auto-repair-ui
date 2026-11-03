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
7. H5 客户端（客户自助端）Token 链路修复：
   - 新增 H5 专用 axios 实例，使用 `sessionStorage.customer.token`，与员工端 `localStorage.token` 隔离；
   - 客户端 401 跳 `/h5/login`，员工端 401 仍跳 `/login`；
   - 注册即登录（后端返回 token）；付款改走 `clientPay`，不再直连默认实例。
8. 销售模块页面：`src/views/sales/SalesOrderList.vue`，菜单"配件销售"（权限 `sales:manage`）。
   支持开单、编辑明细、出库、收款、取消/删除；路由 `/sales-order` 已加入 `ROUTE_PERMISSIONS`。
9. 价格体系前端：配件表单/列表增加"批发价"（`sale_price` 显示为"零售价"），
   客户表单/列表增加"客户类型"（零售/批发）；销售开单与工单领件时按所选客户自动带价
   （调 `GET /api/part/resolve-price`），单价仍可手工修改。
10. H5 配件商城：`src/views/h5/Mall.vue`（浏览、加购、下单）、`src/views/h5/MyOrders.vue`
    （我的配件订单、在线支付），购物车独立在 `src/stores/mallCart.ts`（与员工端采购车分开）；
    H5 首页新增"配件商城""配件订单"入口，路由 `/h5/mall`、`/h5/my-orders`。

## 三、关键决策

- **双端保留**：管理端与 H5 客户端都要可用。`src/views/h5` 与 `/h5` 路由正常使用，
  客户端 Token 走 `sessionStorage.customer`，不要和员工端混用。
- **论文、任务书口径**：管理端 + 客户端（H5）双端，客户端不再排除在论文之外。

## 四、本地启动

```bash
npm install
npm run dev
```

默认地址 http://localhost:5173 ，后端需先启动并完成数据库初始化。

## 五、下一步

1. 操作审计日志的前端页面（列表、筛选、详情）。
2. 按钮级权限控制（目前只控制到菜单和路由）。
3. H5 客户端越权校验（车辆归属、报价归属），以及“我的车辆”的编辑/删除。
