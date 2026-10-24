<template>
  <div class="h5-page">
    <div class="h5-shell">
      <header class="h5-header">
        <div>
          <div class="h5-header-title">汽修管家</div>
        </div>
        <button class="h5-btn-icon" @click="logout"><el-icon :size="18"><SwitchButton /></el-icon></button>
      </header>

      <section class="home-hero">
        <div class="home-avatar">{{ initial }}</div>
        <div class="home-greet">
          <p class="home-hello">欢迎回来</p>
          <p class="home-name">{{ customer?.name || '车主' }}</p>
          <p class="home-phone">{{ customer?.phone || '' }}</p>
        </div>
        <span class="home-level">{{ memberLevel }}</span>
      </section>

      <div class="home-actions">
        <div class="home-action" @click="$router.push('/h5/create-order')">
          <span class="home-action-icon teal"><el-icon :size="22"><Plus /></el-icon></span>
          <strong>预约维修</strong>
          <em>提交故障描述</em>
        </div>
        <div class="home-action" @click="$router.push('/h5/vehicles')">
          <span class="home-action-icon blue"><el-icon :size="22"><Van /></el-icon></span>
          <strong>我的车辆</strong>
          <em>车辆档案管理</em>
        </div>
        <div class="home-action" @click="$router.push('/h5/history')">
          <span class="home-action-icon amber"><el-icon :size="22"><Document /></el-icon></span>
          <strong>维修记录</strong>
          <em>历史工单与报价</em>
        </div>
      </div>

      <section class="home-section">
        <div class="home-section-head">
          <h3>进行中的工单</h3>
          <span @click="$router.push('/h5/history')">全部记录</span>
        </div>

        <div v-if="loading" class="home-empty">加载中...</div>
        <div v-else-if="activeOrders.length === 0" class="home-empty">暂无进行中的工单</div>
        <div v-else class="order-list">
          <div class="order-item" v-for="o in activeOrders" :key="o.id" @click="$router.push(`/h5/order/${o.id}`)">
            <div class="order-top">
              <span class="order-status" :class="'st' + o.workOrderStatus">{{ statusTag(o.workOrderStatus) }}</span>
              <span class="order-no">{{ o.orderNo }}</span>
            </div>
            <p class="order-desc">{{ o.faultDescription || '未填写故障描述' }}</p>
            <div class="order-bottom">
              <span class="order-time">{{ formatTime(o.createTime) }}</span>
              <span v-if="o.totalAmount" class="order-amount">¥{{ Number(o.totalAmount).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { clearCustomer, getCustomer, getMyOrders } from '../../api';

const router = useRouter();
const customer = ref(getCustomer());
const activeOrders = ref<any[]>([]);
const loading = ref(true);

const statusMap: Record<number, string> = { 0: '待诊断', 1: '诊断中', 2: '待确认', 3: '待维修', 4: '维修中', 5: '待结算', 6: '已完成', 7: '已取消' };
const memberMap: Record<number, string> = { 0: '普通会员', 1: '银卡会员', 2: '金卡会员', 3: '钻石会员' };
const initial = computed(() => String(customer.value?.name || '车').charAt(0));
const memberLevel = computed(() => memberMap[customer.value?.memberLevel] || '普通会员');
const statusTag = (s: number) => statusMap[s] || '未知';
const formatTime = (t: string) => (t ? new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-');

const logout = () => {
  clearCustomer();
  router.push('/h5/login');
};

onMounted(async () => {
  if (!customer.value) {
    router.push('/h5/login');
    return;
  }
  try {
    const res = await getMyOrders();
    const orders = res.data || [];
    activeOrders.value = orders.filter((o: any) => o.workOrderStatus !== 6 && o.workOrderStatus !== 7);
  } catch {
    // 请求失败时保留空列表
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 14px 0;
  padding: 18px 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.home-avatar {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  flex: none;
}
.home-greet { flex: 1; }
.home-hello { font-size: 12px; color: var(--text-2); }
.home-name { font-size: 19px; font-weight: 700; margin-top: 2px; }
.home-phone { font-size: 12px; color: var(--text-2); margin-top: 4px; }
.home-level {
  padding: 4px 10px;
  border-radius: 20px;
  background: #d7f1ee;
  color: #0d7a70;
  font-size: 11px;
  font-weight: 600;
}

.home-actions {
  display: flex;
  gap: 10px;
  margin: 14px 14px 0;
}
.home-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
}
.home-action-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 10px;
}
.home-action-icon.teal { background: #d7f1ee; color: #0d9488; }
.home-action-icon.blue { background: #dbeafe; color: #2563eb; }
.home-action-icon.amber { background: #fef3c7; color: #d97706; }
.home-action strong { font-size: 14px; }
.home-action em { font-style: normal; font-size: 11px; color: var(--text-2); margin-top: 3px; }

.home-section { margin: 22px 14px 30px; }
.home-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.home-section-head h3 { font-size: 16px; font-weight: 700; }
.home-section-head span { font-size: 12px; color: var(--brand); cursor: pointer; }
.home-empty {
  padding: 34px 0;
  text-align: center;
  color: var(--text-2);
  font-size: 13px;
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 10px;
}

.order-item {
  padding: 14px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
}
.order-top { display: flex; align-items: center; gap: 8px; }
.order-status {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.order-status.st0 { background: #f1f5f9; color: #475569; }
.order-status.st1 { background: #dbeafe; color: #1d4ed8; }
.order-status.st2 { background: #fef3c7; color: #b45309; }
.order-status.st3 { background: #ede9fe; color: #6d28d9; }
.order-status.st4 { background: #cffafe; color: #0e7490; }
.order-status.st5 { background: #ffedd5; color: #c2410c; }
.order-status.st6 { background: #dcfce7; color: #15803d; }
.order-status.st7 { background: #e2e8f0; color: #64748b; }
.order-no { font-size: 12px; color: var(--text-2); }
.order-desc {
  font-size: 14px;
  color: var(--text-1);
  margin: 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.order-bottom { display: flex; align-items: center; justify-content: space-between; }
.order-time { font-size: 12px; color: var(--text-2); }
.order-amount { font-size: 15px; font-weight: 700; color: var(--brand); }
</style>
