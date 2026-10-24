<template>
  <div>
    <div class="dash-head">
      <div>
        <h2>门店概览</h2>
        <p>关键经营数据一览</p>
      </div>
      <el-button :icon="Refresh" circle @click="loadAll" />
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in cards" :key="card.title">
        <div class="stat-card">
          <span class="stat-icon" :style="{ background: card.bg, color: card.color }">
            <el-icon :size="22"><component :is="card.icon" /></el-icon>
          </span>
          <div class="stat-meta">
            <p class="stat-title">{{ card.title }}</p>
            <p class="stat-value">{{ card.count }}</p>
          </div>
        </div>
      </el-col>
    </el-row>

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

    <div class="low-stock-head">
      <h3 class="section-title">库存预警</h3>
      <span class="low-stock-hint">低于最低库存的配件</span>
    </div>
    <el-table :data="lowStock" border v-loading="lowStockLoading" empty-text="库存充足，暂无预警">
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
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { markRaw, onMounted, reactive, ref } from 'vue';
import { Box, Checked, Document, Money, Refresh, ShoppingCart, UserFilled } from '@element-plus/icons-vue';
import request from '../api/index';

const cards = reactive([
  { title: '客户总数', count: '-', icon: markRaw(UserFilled), color: '#0d9488', bg: '#d7f1ee' },
  { title: '维修工单', count: '-', icon: markRaw(Document), color: '#2563eb', bg: '#dbeafe' },
  { title: '配件种类', count: '-', icon: markRaw(Box), color: '#d97706', bg: '#fef3c7' },
  { title: '本月营收', count: '¥0', icon: markRaw(Money), color: '#16a34a', bg: '#dcfce7' },
]);

const quickLinks = [
  { label: '维修工单', desc: '跟进维修进度', path: '/work-order', icon: markRaw(Document) },
  { label: '配件库存', desc: '库存与价格', path: '/part', icon: markRaw(Box) },
  { label: '收款管理', desc: '结算与收款', path: '/payment', icon: markRaw(Money) },
  { label: '客户管理', desc: '客户档案', path: '/customer', icon: markRaw(UserFilled) },
  { label: '库存盘点', desc: '盘点与调整', path: '/stock-check', icon: markRaw(Checked) },
  { label: '采购订单', desc: '采购入库', path: '/purchase-order', icon: markRaw(ShoppingCart) },
];

const lowStock = ref<any[]>([]);
const lowStockLoading = ref(false);

async function loadAll() {
  try {
    const res = await request.get('/api/dashboard/stats');
    const data = res.data;
    cards[0].count = data.customerCount ?? '-';
    cards[1].count = data.workOrderCount ?? '-';
    cards[2].count = data.partCount ?? '-';
    cards[3].count = data.monthlyRevenue != null
      ? '¥' + Number(data.monthlyRevenue).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
      : '¥0';
  } catch {
    // 保持默认值
  }
  try {
    lowStockLoading.value = true;
    const res = await request.get('/api/part/low-stock');
    lowStock.value = res.data || [];
  } catch {
    lowStock.value = [];
  } finally {
    lowStockLoading.value = false;
  }
}

onMounted(loadAll);
</script>

<style scoped>
.dash-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.dash-head h2 { font-size: 20px; font-weight: 700; }
.dash-head p { font-size: 13px; color: var(--text-2); margin-top: 4px; }

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

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 8px 0 12px;
}

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

.low-stock-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.low-stock-hint { font-size: 12px; color: var(--text-2); }

@media (max-width: 900px) {
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
