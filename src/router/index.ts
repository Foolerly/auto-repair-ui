import { createRouter, createWebHistory } from 'vue-router';
import { ElMessage } from 'element-plus';

const ROUTE_PERMISSIONS: Record<string, string> = {
  '/customer': 'customer:manage',
  '/vehicle': 'vehicle:manage',
  '/work-order': 'workorder:manage',
  '/requisition': 'workorder:manage',
  '/payment': 'payment:manage',
  '/part-category': 'part:category',
  '/part': 'part:info',
  '/vehicle-model': 'part:info',
  '/stock-check': 'part:info',
  '/part-scrap': 'part:info',
  '/stock-flow': 'part:info',
  '/supplier': 'supplier:manage',
  '/purchase-catalog': 'purchase:manage',
  '/purchase-request': 'purchase:manage',
  '/purchase-order': 'purchase:manage',
  '/purchase-return': 'purchase:manage',
  '/purchase-reconciliation': 'purchase:manage',
  '/user': 'system:user',
  '/role': 'system:role',
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 管理后台登录
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
    },
    // 管理后台
    {
      path: '/',
      component: () => import('../views/Layout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
        { path: 'user', name: 'User', component: () => import('../views/user/UserList.vue') },
        { path: 'role', name: 'Role', component: () => import('../views/role/RoleList.vue') },
        { path: 'customer', name: 'Customer', component: () => import('../views/customer/CustomerList.vue') },
        { path: 'vehicle', name: 'Vehicle', component: () => import('../views/vehicle/VehicleList.vue') },
        { path: 'part-category', name: 'PartCategory', component: () => import('../views/part/PartCategory.vue') },
        { path: 'part', name: 'Part', component: () => import('../views/part/PartList.vue') },
        { path: 'supplier', name: 'Supplier', component: () => import('../views/supplier/SupplierList.vue') },
        { path: 'purchase-order', name: 'PurchaseOrder', component: () => import('../views/purchase/PurchaseOrderList.vue') },
        { path: 'work-order', name: 'WorkOrder', component: () => import('../views/workorder/WorkOrderList.vue') },
        { path: 'payment', name: 'Payment', component: () => import('../views/payment/PaymentList.vue') },
        { path: 'vehicle-model', name: 'VehicleModel', component: () => import('../views/vehicle/VehicleModelList.vue') },
        { path: 'requisition', name: 'Requisition', component: () => import('../views/requisition/RequisitionList.vue') },
        { path: 'purchase-request', name: 'PurchaseRequest', component: () => import('../views/purchase/PurchaseRequestList.vue') },
        { path: 'purchase-catalog', name: 'PurchaseCatalog', component: () => import('../views/purchase/PurchaseCatalog.vue') },
        { path: 'stock-flow', name: 'StockFlow', component: () => import('../views/stock/StockFlowList.vue') },
        { path: 'purchase-return', name: 'PurchaseReturn', component: () => import('../views/purchase/PurchaseReturnList.vue') },
        { path: 'purchase-reconciliation', name: 'PurchaseReconciliation', component: () => import('../views/purchase/PurchaseReconciliation.vue') },
        { path: 'stock-check', name: 'StockCheck', component: () => import('../views/stock/StockCheckList.vue') },
        { path: 'part-scrap', name: 'PartScrap', component: () => import('../views/part/PartScrapList.vue') },
      ],
    },
    // H5 客户端
    {
      path: '/h5',
      children: [
        { path: '', redirect: '/h5/login' },
        { path: 'login', name: 'H5Login', component: () => import('../views/h5/Login.vue') },
        { path: 'home', name: 'H5Home', component: () => import('../views/h5/Home.vue') },
        { path: 'vehicles', name: 'H5Vehicles', component: () => import('../views/h5/Vehicles.vue') },
        { path: 'create-order', name: 'H5CreateOrder', component: () => import('../views/h5/CreateOrder.vue') },
        { path: 'history', name: 'H5OrderHistory', component: () => import('../views/h5/OrderHistory.vue') },
        { path: 'order/:id', name: 'H5OrderDetail', component: () => import('../views/h5/OrderDetail.vue') },
        { path: 'quote/:workOrderId', name: 'H5QuoteConfirm', component: () => import('../views/h5/QuoteConfirm.vue') },
        { path: 'payment/:id', name: 'H5Payment', component: () => import('../views/h5/Payment.vue') },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  // H5 路由用 sessionStorage 里的 customer
  if (to.path.startsWith('/h5')) {
    const customer = sessionStorage.getItem('customer');
    if (to.name !== 'H5Login' && !customer) {
      next('/h5/login');
    } else if (to.name === 'H5Login' && customer) {
      next('/h5/home');
    } else {
      next();
    }
    return;
  }
  // 管理后台路由
  if (to.name === 'Login') {
    if (token) {
      next('/dashboard');
    } else {
      next();
    }
    return;
  }
  if (!token) {
    next('/login');
    return;
  }

  let userInfo: any = null;
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  } catch {
    userInfo = null;
  }
  const roles: string[] = userInfo?.roles || [];
  const permissions: string[] = userInfo?.permissions || [];
  if (roles.length === 0) {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    next('/login');
    return;
  }

  const required = ROUTE_PERMISSIONS[to.path];
  if (required && !roles.includes('ROLE_ADMIN') && !permissions.includes(required)) {
    ElMessage.warning('没有访问该页面的权限');
    next('/dashboard');
    return;
  }
  next();
});

export default router;
