<template>
  <el-container class="app-shell">
    <el-aside width="236px" class="app-sidebar">
      <div class="app-logo">
        <div class="app-logo-mark"><el-icon :size="20"><Tools /></el-icon></div>
        <div class="app-logo-text">
          <strong>汽修管理系统</strong>
          <span>AUTO REPAIR</span>
        </div>
      </div>

      <div class="app-menu-wrap">
        <el-menu ref="menuRef" :default-active="route.path" router unique-opened class="app-menu" background-color="transparent" text-color="#9aa7b1" active-text-color="#ffffff">
          <div class="app-menu-group">总览</div>
          <el-menu-item index="/dashboard"><el-icon><Odometer /></el-icon><span>工作台</span></el-menu-item>

          <div class="app-menu-group" v-if="showBusiness">业务中心</div>
          <el-menu-item v-if="can('customer:manage')" index="/customer"><el-icon><UserFilled /></el-icon><span>客户管理</span></el-menu-item>
          <el-menu-item v-if="can('vehicle:manage')" index="/vehicle"><el-icon><Van /></el-icon><span>车辆管理</span></el-menu-item>
          <el-menu-item v-if="can('workorder:manage')" index="/work-order"><el-icon><Document /></el-icon><span>维修工单</span></el-menu-item>
          <el-menu-item v-if="can('workorder:manage')" index="/requisition"><el-icon><TakeawayBox /></el-icon><span>领料管理</span></el-menu-item>
          <el-menu-item v-if="can('payment:manage')" index="/payment"><el-icon><Money /></el-icon><span>收款管理</span></el-menu-item>

          <div class="app-menu-group" v-if="showParts || showPurchase">配件与采购</div>
          <el-sub-menu v-if="showParts" index="parts">
            <template #title><el-icon><Box /></el-icon><span>配件管理</span></template>
            <el-menu-item v-if="can('part:category')" index="/part-category">配件分类</el-menu-item>
            <el-menu-item v-if="can('part:info')" index="/part">配件库存</el-menu-item>
            <el-menu-item v-if="can('part:info')" index="/vehicle-model">车型管理</el-menu-item>
            <el-menu-item v-if="can('part:info')" index="/stock-check">库存盘点</el-menu-item>
            <el-menu-item v-if="can('part:info')" index="/part-scrap">配件损耗</el-menu-item>
            <el-menu-item v-if="can('part:info')" index="/stock-flow">库存流水</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="showPurchase" index="purchase">
            <template #title><el-icon><ShoppingCart /></el-icon><span>采购管理</span></template>
            <el-menu-item v-if="can('supplier:manage')" index="/supplier">供应商管理</el-menu-item>
            <el-menu-item v-if="can('purchase:manage')" index="/purchase-catalog">配件采购</el-menu-item>
            <el-menu-item v-if="can('purchase:manage')" index="/purchase-request">采购申请</el-menu-item>
            <el-menu-item v-if="can('purchase:manage')" index="/purchase-order">采购订单</el-menu-item>
            <el-menu-item v-if="can('purchase:manage')" index="/purchase-return">采购退货</el-menu-item>
            <el-menu-item v-if="can('purchase:manage')" index="/purchase-reconciliation">采购对账</el-menu-item>
          </el-sub-menu>

          <div class="app-menu-group" v-if="showSystem">系统管理</div>
          <el-sub-menu v-if="showSystem" index="system">
            <template #title><el-icon><Setting /></el-icon><span>系统设置</span></template>
            <el-menu-item v-if="can('system:user')" index="/user">用户管理</el-menu-item>
            <el-menu-item v-if="can('system:role')" index="/role">角色权限</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </el-aside>

    <el-container>
      <el-header height="60px" class="app-header">
        <div class="app-header-left">
          <span class="app-page-title">{{ pageTitle }}</span>
          <span class="app-header-date">{{ today }}</span>
        </div>
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="app-user">
            <span class="app-avatar">{{ avatarChar }}</span>
            <span class="app-user-name">{{ userStore.userInfo?.realName || userStore.userInfo?.username || '用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout"><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '工作台',
  '/user': '用户管理',
  '/role': '角色权限',
  '/customer': '客户管理',
  '/vehicle': '车辆管理',
  '/vehicle-model': '车型管理',
  '/part-category': '配件分类',
  '/part': '配件库存',
  '/supplier': '供应商管理',
  '/purchase-catalog': '配件采购',
  '/purchase-request': '采购申请',
  '/purchase-order': '采购订单',
  '/purchase-return': '采购退货',
  '/purchase-reconciliation': '采购对账',
  '/work-order': '维修工单',
  '/requisition': '领料管理',
  '/payment': '收款管理',
  '/stock-flow': '库存流水',
  '/stock-check': '库存盘点',
  '/part-scrap': '配件损耗',
};

const pageTitle = computed(() => PAGE_TITLES[route.path] || '工作台');
const menuRef = ref();
const can = (code: string) => userStore.hasPermission(code);
const showBusiness = computed(() =>
  can('customer:manage') || can('vehicle:manage') || can('workorder:manage') || can('payment:manage'));
const showParts = computed(() => can('part:category') || can('part:info'));
const showPurchase = computed(() => can('supplier:manage') || can('purchase:manage'));
const showSystem = computed(() => can('system:user') || can('system:role'));

const GROUP_OF: Record<string, string> = {
  '/part-category': 'parts',
  '/part': 'parts',
  '/vehicle-model': 'parts',
  '/stock-check': 'parts',
  '/part-scrap': 'parts',
  '/stock-flow': 'parts',
  '/supplier': 'purchase',
  '/purchase-catalog': 'purchase',
  '/purchase-request': 'purchase',
  '/purchase-order': 'purchase',
  '/purchase-return': 'purchase',
  '/purchase-reconciliation': 'purchase',
  '/user': 'system',
  '/role': 'system',
};

function syncMenuGroup() {
  if (!menuRef.value) return;
  const group = GROUP_OF[route.path];
  for (const id of ['parts', 'purchase', 'system']) {
    if (id !== group) menuRef.value.close(id);
  }
  if (group) menuRef.value.open(group);
}

onMounted(syncMenuGroup);
watch(() => route.path, syncMenuGroup);

const today = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
const avatarChar = computed(() => {
  const name = userStore.userInfo?.realName || userStore.userInfo?.username || '管';
  return String(name).charAt(0);
});

function handleCommand(command: string) {
  if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  }
}
</script>
