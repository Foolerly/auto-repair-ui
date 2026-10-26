<template>
  <div>
    <div class="dash-head">
      <div>
        <h2>{{ greeting }}，{{ displayName }}</h2>
        <p class="dash-sub">
          <el-tag size="small" effect="plain">{{ roleLabel }}</el-tag>
          <span class="dash-date">{{ today }}</span>
        </p>
      </div>
      <el-button :icon="Refresh" circle @click="loadDashboard" />
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="cardSpan" v-for="item in cards" :key="item.title">
        <div class="stat-card">
          <span class="stat-icon" :style="{ background: item.bg, color: item.color }">
            <el-icon :size="22"><component :is="item.icon" /></el-icon>
          </span>
          <div class="stat-meta">
            <p class="stat-title">{{ item.title }}</p>
            <p class="stat-value">{{ item.count }}</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <template v-if="quickLinks.length">
      <h3 class="section-title">快捷入口</h3>
      <div class="quick-grid">
        <div class="quick-item" v-for="q in quickLinks" :key="q.path" @click="$router.push(q.path)">
          <el-icon :size="20"><component :is="q.icon" /></el-icon>
          <div>
            <strong>{{ q.label }}</strong>
            <span>{{ q.desc }}</span>
          </div>
        </div>
      </div>
    </template>

    <div class="detail-head">
      <h3 class="section-title">{{ detailTitle }}</h3>
      <span class="detail-hint">{{ detailHint }}</span>
    </div>

    <el-table
      v-if="detailType === 'lowStock'"
      :data="lowStock"
      border
      v-loading="loading"
      empty-text="库存充足，暂无预警"
    >
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="partName" label="配件名称" min-width="180" />
      <el-table-column prop="spec" label="规格" min-width="120" />
      <el-table-column prop="stockQty" label="当前库存" width="110" />
      <el-table-column prop="minStockQty" label="预警值" width="110" />
      <el-table-column label="状态" width="110">
        <template #default>
          <el-tag type="danger" effect="light">库存不足</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="110">
        <template #default>
          <el-button size="small" @click="$router.push(role === 'purchaser' ? '/purchase-catalog' : '/part')">去处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-table
      v-else-if="detailType === 'settlement'"
      :data="settlementOrders"
      border
      v-loading="loading"
      empty-text="暂无待结算工单"
    >
      <el-table-column prop="orderNo" label="工单号" width="180" />
      <el-table-column prop="customerId" label="客户ID" width="100" />
      <el-table-column prop="faultDescription" label="故障描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="totalAmount" label="应收金额" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="110">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="$router.push(`/work-order?id=${row.id}`)">去结算</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-table
      v-else-if="detailType === 'activeOrders'"
      :data="activeOrders"
      border
      v-loading="loading"
      empty-text="暂无维修中的工单"
    >
      <el-table-column prop="orderNo" label="工单号" width="180" />
      <el-table-column prop="faultDescription" label="故障描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.workOrderStatus)" size="small">{{ statusText(row.workOrderStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始维修" width="180" />
      <el-table-column label="操作" width="110">
        <template #default>
          <el-button size="small" type="primary" @click="$router.push('/work-order')">去处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-table v-else :data="[]" border empty-text="暂无待办事项" />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, ref } from 'vue';
import { Box, Checked, Clock, Document, Money, Refresh, ShoppingCart, Tickets, UserFilled, Van, Warning } from '@element-plus/icons-vue';
import request from '../api/index';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
type RoleKey = 'admin' | 'boss' | 'reception' | 'technician' | 'purchaser' | 'staff';
type DetailType = '' | 'lowStock' | 'settlement' | 'activeOrders';

const role = computed<RoleKey>(() => {
  const roles = userStore.roles;
  if (roles.includes('ROLE_ADMIN')) return 'admin';
  if (roles.includes('ROLE_BOSS')) return 'boss';
  if (roles.includes('ROLE_RECEPTION')) return 'reception';
  if (roles.includes('ROLE_TECHNICIAN')) return 'technician';
  if (roles.includes('ROLE_PURCHASER')) return 'purchaser';
  return 'staff';
});

const ROLE_LABELS: Record<RoleKey, string> = {
  admin: '系统管理员',
  boss: '门店老板',
  reception: '前台接待',
  technician: '维修技师',
  purchaser: '采购人员',
  staff: '员工',
};
const roleLabel = computed(() => ROLE_LABELS[role.value]);
const displayName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || '用户');
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '上午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});
const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

const cards = ref<any[]>([]);
const loading = ref(false);
const detailType = ref<DetailType>('');
const lowStock = ref<any[]>([]);
const settlementOrders = ref<any[]>([]);
const activeOrders = ref<any[]>([]);

const cardSpan = computed(() => (cards.value.length === 4 ? 6 : 8));
const detailTitle = computed(() => {
  if (detailType.value === 'lowStock') return '库存预警';
  if (detailType.value === 'settlement') return '待结算工单';
  if (detailType.value === 'activeOrders') return '我的维修中工单';
  return '待办事项';
});
const detailHint = computed(() => {
  if (detailType.value === 'lowStock') return '低于最低库存的配件';
  if (detailType.value === 'settlement') return '等待客户结算的工单';
  if (detailType.value === 'activeOrders') return '分配给我的维修中工单';
  return '';
});

function card(title: string, count: any, icon: any, color: string, bg: string) {
  return { title, count, icon: markRaw(icon), color, bg };
}

const quickLinks = computed(() => {
  const common = {
    workOrder: { label: '维修工单', desc: '跟进维修进度', path: '/work-order', icon: markRaw(Document) },
    part: { label: '配件库存', desc: '库存与价格', path: '/part', icon: markRaw(Box) },
    payment: { label: '收款管理', desc: '结算与收款', path: '/payment', icon: markRaw(Money) },
    customer: { label: '客户管理', desc: '客户档案', path: '/customer', icon: markRaw(UserFilled) },
    vehicle: { label: '车辆管理', desc: '车辆档案', path: '/vehicle', icon: markRaw(Van) },
    stockCheck: { label: '库存盘点', desc: '盘点与调整', path: '/stock-check', icon: markRaw(Checked) },
    purchaseOrder: { label: '采购订单', desc: '采购入库', path: '/purchase-order', icon: markRaw(ShoppingCart) },
    requisition: { label: '领料管理', desc: '领料与退料', path: '/requisition', icon: markRaw(Tickets) },
    stockFlow: { label: '库存流水', desc: '出入库记录', path: '/stock-flow', icon: markRaw(Warning) },
    purchaseRequest: { label: '采购申请', desc: '处理采购需求', path: '/purchase-request', icon: markRaw(Tickets) },
    supplier: { label: '供应商管理', desc: '供应商档案', path: '/supplier', icon: markRaw(UserFilled) },
    purchaseCatalog: { label: '配件采购', desc: '选购与下单', path: '/purchase-catalog', icon: markRaw(ShoppingCart) },
  };
  if (role.value === 'reception') return [common.workOrder, common.customer, common.vehicle, common.payment];
  if (role.value === 'technician') return [common.workOrder, common.requisition, common.part, common.stockFlow];
  if (role.value === 'purchaser') return [common.purchaseRequest, common.purchaseOrder, common.supplier, common.purchaseCatalog];
  if (role.value === 'staff') return [common.workOrder, common.part];
  return [common.workOrder, common.part, common.payment, common.customer, common.stockCheck, common.purchaseOrder];
});

const statusMap: Record<number, string> = { 0: '待诊断', 1: '诊断中', 2: '待确认', 3: '待维修', 4: '维修中', 5: '待结算', 6: '已完成', 7: '已取消' };
const statusText = (status: number) => statusMap[status] || '未知';
const statusType = (status: number) => {
  if (status === 6) return 'success';
  if (status === 7) return 'info';
  if (status === 5) return 'warning';
  return 'primary';
};

const formatMoney = (value: any) => (value == null ? '¥0' : '¥' + Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 }));

async function countWorkOrders(status: number, technicianId?: number) {
  try {
    const params: any = { page: 1, size: 1, status };
    if (technicianId != null) params.technicianId = technicianId;
    const res = await request.get('/api/work-order', { params });
    return res.data?.total ?? 0;
  } catch {
    return '-';
  }
}

async function loadLowStock() {
  try {
    const res = await request.get('/api/part/low-stock');
    lowStock.value = res.data || [];
  } catch {
    lowStock.value = [];
  }
}

async function loadDashboard() {
  loading.value = true;
  cards.value = [];
  lowStock.value = [];
  settlementOrders.value = [];
  activeOrders.value = [];

  try {
    if (role.value === 'admin' || role.value === 'boss') {
      cards.value = [
        card('客户总数', '-', UserFilled, '#0d9488', '#d7f1ee'),
        card('维修工单', '-', Document, '#2563eb', '#dbeafe'),
        card('配件种类', '-', Box, '#d97706', '#fef3c7'),
        card('本月营收', '¥0', Money, '#16a34a', '#dcfce7'),
      ];
      try {
        const res = await request.get('/api/dashboard/stats');
        const data = res.data;
        cards.value[0].count = data.customerCount ?? '-';
        cards.value[1].count = data.workOrderCount ?? '-';
        cards.value[2].count = data.partCount ?? '-';
        cards.value[3].count = formatMoney(data.monthlyRevenue);
      } catch {
        // 保留占位值
      }
      await loadLowStock();
      detailType.value = 'lowStock';
    } else if (role.value === 'reception') {
      cards.value = [
        card('待诊断', 0, Clock, '#2563eb', '#dbeafe'),
        card('待确认报价', 0, Tickets, '#d97706', '#fef3c7'),
        card('待结算', 0, Money, '#dc2626', '#fee2e2'),
      ];
      const [diagnosis, confirm, settlement] = await Promise.all([
        countWorkOrders(0),
        countWorkOrders(2),
        countWorkOrders(5),
      ]);
      cards.value[0].count = diagnosis;
      cards.value[1].count = confirm;
      cards.value[2].count = settlement;
      try {
        const res = await request.get('/api/work-order', { params: { page: 1, size: 5, status: 5 } });
        settlementOrders.value = res.data.records || [];
      } catch {
        settlementOrders.value = [];
      }
      detailType.value = 'settlement';
    } else if (role.value === 'technician') {
      const technicianId = userStore.userInfo?.id;
      cards.value = [
        card('我的待诊断', 0, Clock, '#2563eb', '#dbeafe'),
        card('我的维修中', 0, Document, '#0d9488', '#d7f1ee'),
        card('我的待结算', 0, Money, '#d97706', '#fef3c7'),
      ];
      const [diagnosis, repairing, settlement] = await Promise.all([
        countWorkOrders(0, technicianId),
        countWorkOrders(4, technicianId),
        countWorkOrders(5, technicianId),
      ]);
      cards.value[0].count = diagnosis;
      cards.value[1].count = repairing;
      cards.value[2].count = settlement;
      try {
        const res = await request.get('/api/work-order', {
          params: { page: 1, size: 5, status: 4, technicianId },
        });
        activeOrders.value = res.data.records || [];
      } catch {
        activeOrders.value = [];
      }
      detailType.value = 'activeOrders';
    } else if (role.value === 'purchaser') {
      cards.value = [
        card('待处理申请', 0, Tickets, '#2563eb', '#dbeafe'),
        card('待审核订单', 0, Checked, '#d97706', '#fef3c7'),
        card('待入库订单', 0, ShoppingCart, '#0d9488', '#d7f1ee'),
        card('库存预警', 0, Warning, '#dc2626', '#fee2e2'),
      ];
      try {
        const [requests, pendingAudit, pendingInbound] = await Promise.all([
          request.get('/api/purchase-request', { params: { page: 1, size: 1, status: 0 } }),
          request.get('/api/purchase-order', { params: { page: 1, size: 1, status: 0 } }),
          request.get('/api/purchase-order', { params: { page: 1, size: 1, status: 1 } }),
        ]);
        cards.value[0].count = requests.data?.total ?? 0;
        cards.value[1].count = pendingAudit.data?.total ?? 0;
        cards.value[2].count = pendingInbound.data?.total ?? 0;
      } catch {
        // 保留占位值
      }
      await loadLowStock();
      cards.value[3].count = lowStock.value.length;
      detailType.value = 'lowStock';
    } else {
      cards.value = [
        card('维修工单', '-', Document, '#2563eb', '#dbeafe'),
        card('配件库存', '-', Box, '#0d9488', '#d7f1ee'),
      ];
      detailType.value = '';
    }
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped>
.dash-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.dash-head h2 { font-size: 20px; font-weight: 700; }
.dash-sub { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.dash-date { font-size: 13px; color: var(--text-2); }

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
}
.stat-icon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex: none;
}
.stat-title { font-size: 13px; color: var(--text-2); }
.stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; font-variant-numeric: tabular-nums; }

.section-title { font-size: 15px; font-weight: 600; margin: 8px 0 12px; }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.quick-item:hover { border-color: var(--brand); box-shadow: 0 2px 8px rgba(13, 148, 136, 0.12); }
.quick-item .el-icon { color: var(--brand); }
.quick-item strong { display: block; font-size: 14px; }
.quick-item span { display: block; font-size: 12px; color: var(--text-2); margin-top: 2px; }

.detail-head { display: flex; align-items: baseline; justify-content: space-between; }
.detail-hint { font-size: 12px; color: var(--text-2); }

@media (max-width: 900px) {
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
