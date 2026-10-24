<template>
  <div class="h5-page">
    <div class="h5-shell">
      <header class="h5-header">
        <button class="h5-back" @click="$router.back()"><el-icon><ArrowLeft /></el-icon>返回</button>
        <span class="h5-header-title">维修记录</span>
        <span style="width:36px"></span>
      </header>

      <div v-if="loading" class="auto-empty">加载中...</div>
      <div v-else-if="orders.length === 0" class="auto-empty">暂无维修记录</div>
      <div v-else class="order-list">
        <div class="order-item" v-for="o in orders" :key="o.id" @click="$router.push(`/h5/order/${o.id}`)">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getMyOrders } from '../../api';

const orders = ref<any[]>([]);
const loading = ref(true);

const statusMap: Record<number, string> = { 0: '待诊断', 1: '诊断中', 2: '待确认', 3: '待维修', 4: '维修中', 5: '待结算', 6: '已完成', 7: '已取消' };
const statusTag = (s: number) => statusMap[s] || '未知';
const formatTime = (t: string) => (t ? new Date(t).toLocaleString('zh-CN') : '-');

onMounted(async () => {
  try {
    const res = await getMyOrders();
    orders.value = res.data || [];
  } catch {
    // 忽略加载失败
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.auto-empty {
  margin: 80px 24px;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-2);
  font-size: 14px;
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 10px;
}

.order-list { padding: 14px; }
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
