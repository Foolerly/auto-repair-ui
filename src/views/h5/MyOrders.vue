<template>
  <div class="h5-page">
    <div class="h5-shell">
      <header class="h5-header">
        <button class="h5-back" @click="$router.back()"><el-icon><ArrowLeft /></el-icon>返回</button>
        <span class="h5-header-title">配件订单</span>
        <span style="width:36px"></span>
      </header>

      <div v-if="loading" class="mall-empty">加载中...</div>
      <div v-else-if="orders.length === 0" class="mall-empty">
        <p>还没有配件订单</p>
        <el-button type="primary" round @click="$router.push('/h5/mall')">去逛逛商城</el-button>
      </div>
      <div v-else class="order-list">
        <div class="order-item" v-for="o in orders" :key="o.id">
          <div class="order-top">
            <span class="order-status" :class="'st' + o.salesStatus">{{ STATUS[o.salesStatus] || '未知' }}</span>
            <span class="order-no">{{ o.orderNo }}</span>
          </div>
          <div class="order-bottom">
            <span class="order-time">{{ fmt(o.createTime) }}</span>
            <span class="order-amount">¥{{ o.totalAmount }}</span>
          </div>
          <div class="order-ops">
            <el-button size="small" text @click="openDetail(o)">查看明细</el-button>
            <el-button size="small" type="primary" v-if="o.salesStatus === 0" @click="openPay(o)">去支付</el-button>
            <span v-else-if="o.salesStatus === 1" class="order-hint">已付款，门店备货中</span>
          </div>
        </div>
      </div>

      <el-dialog v-model="detailVisible" title="订单明细" width="88%">
        <div v-if="detail">
          <div class="detail-head">{{ detail.order.orderNo }} · {{ STATUS[detail.order.salesStatus] }}</div>
          <div class="detail-row" v-for="i in detail.items" :key="i.id">
            <span>配件#{{ i.partId }}</span>
            <span>¥{{ i.unitPrice }} × {{ i.qty }}</span>
          </div>
          <div class="cart-total">合计：¥{{ detail.order.totalAmount }}</div>
        </div>
      </el-dialog>

      <el-dialog v-model="payVisible" title="订单支付" width="86%">
        <div class="pay-amount">¥{{ payOrder ? payOrder.totalAmount : 0 }}</div>
        <el-radio-group v-model="paymentMethod">
          <el-radio :value="2">微信支付</el-radio>
          <el-radio :value="3">支付宝</el-radio>
          <el-radio :value="1">现金</el-radio>
        </el-radio-group>
        <template #footer>
          <el-button @click="payVisible = false">取消</el-button>
          <el-button type="primary" :loading="paying" @click="handlePay">确认支付</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMySalesOrders, getMySalesOrderDetail, payClientSalesOrder } from '../../api';

const STATUS: Record<number, string> = { 0: '待付款', 1: '待发货', 2: '已完成', 3: '已取消' };

const orders = ref<any[]>([]);
const loading = ref(true);
const detailVisible = ref(false);
const detail = ref<any>(null);
const payVisible = ref(false);
const payOrder = ref<any>(null);
const paymentMethod = ref(2);
const paying = ref(false);

const fmt = (t: string) => (t ? new Date(t).toLocaleString('zh-CN') : '-');

async function load() {
  loading.value = true;
  try {
    const res: any = await getMySalesOrders();
    orders.value = res.data || [];
  } finally {
    loading.value = false;
  }
}

async function openDetail(o: any) {
  const res: any = await getMySalesOrderDetail(o.id);
  detail.value = res.data;
  detailVisible.value = true;
}

function openPay(o: any) {
  payOrder.value = o;
  paymentMethod.value = 2;
  payVisible.value = true;
}

async function handlePay() {
  if (!payOrder.value) return;
  paying.value = true;
  try {
    await payClientSalesOrder(payOrder.value.id, paymentMethod.value);
    ElMessage.success('支付成功');
    payVisible.value = false;
    await load();
  } finally {
    paying.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.mall-empty {
  margin: 80px 24px;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-2);
  font-size: 14px;
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 10px;
}
.mall-empty p { margin-bottom: 16px; }

.order-list { padding: 14px; }
.order-item {
  padding: 14px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.order-top { display: flex; align-items: center; gap: 8px; }
.order-status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.order-status.st0 { background: #e2e8f0; color: #475569; }
.order-status.st1 { background: #fef3c7; color: #b45309; }
.order-status.st2 { background: #dcfce7; color: #15803d; }
.order-status.st3 { background: #f1f5f9; color: #94a3b8; }
.order-no { font-size: 12px; color: var(--text-2); }
.order-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.order-time { font-size: 12px; color: var(--text-2); }
.order-amount { font-size: 15px; font-weight: 700; color: #f56c6c; }
.order-ops { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.order-hint { font-size: 12px; color: var(--text-2); }

.detail-head { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.cart-total { margin-top: 16px; text-align: right; font-size: 16px; font-weight: 700; color: #f56c6c; }
.pay-amount { text-align: center; font-size: 28px; font-weight: 700; color: #f56c6c; margin-bottom: 20px; }
</style>
