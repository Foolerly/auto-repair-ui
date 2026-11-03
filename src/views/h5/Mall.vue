<template>
  <div class="h5-page">
    <div class="h5-shell">
      <header class="h5-header">
        <button class="h5-back" @click="$router.back()"><el-icon><ArrowLeft /></el-icon>返回</button>
        <span class="h5-header-title">配件商城</span>
        <button class="h5-btn-icon" @click="cartVisible = true">
          <el-icon :size="18"><ShoppingCart /></el-icon>
          <span v-if="cart.count" class="cart-badge">{{ cart.count }}</span>
        </button>
      </header>

      <div class="mall-search">
        <el-input v-model="keyword" placeholder="搜索配件名称或规格" clearable :prefix-icon="Search" @change="loadParts" />
      </div>
      <div class="mall-cats">
        <button :class="{ active: categoryId === null }" @click="pickCategory(null)">全部</button>
        <button v-for="c in categories" :key="c.id" :class="{ active: categoryId === c.id }" @click="pickCategory(c.id)">{{ c.categoryName }}</button>
      </div>

      <div v-if="loading" class="mall-empty">加载中...</div>
      <div v-else-if="parts.length === 0" class="mall-empty">没有找到配件</div>
      <div v-else class="mall-list">
        <div class="mall-item" v-for="p in parts" :key="p.id">
          <img v-if="p.image" :src="p.image" class="mall-img" alt="" />
          <div v-else class="mall-img mall-img-empty">无图</div>
          <div class="mall-info">
            <div class="mall-name">{{ p.partName }}</div>
            <div class="mall-spec">{{ p.spec || '-' }} · 库存 {{ p.stockQty }}</div>
            <div class="mall-price">¥{{ p.price }}</div>
          </div>
          <div class="mall-ops">
            <el-input-number v-model="p._qty" :min="1" :max="p.stockQty" size="small" controls-position="right" style="width:92px" />
            <el-button size="small" type="primary" @click="addToCart(p)">加入</el-button>
          </div>
        </div>
      </div>

      <el-drawer v-model="cartVisible" title="购物车" size="88%">
        <div v-if="cart.items.length === 0" class="mall-empty">购物车是空的</div>
        <template v-else>
          <div class="cart-item" v-for="i in cart.items" :key="i.partId">
            <div class="cart-main">
              <div class="cart-name">{{ i.partName }}</div>
              <div class="cart-sub">¥{{ i.unitPrice }} × {{ i.qty }}</div>
            </div>
            <el-button size="small" type="danger" text @click="cart.remove(i.partId)">删除</el-button>
          </div>
          <el-input v-model="remark" placeholder="备注（可选）" style="margin-top:12px" />
          <div class="cart-total">合计：¥{{ cart.totalPrice }}</div>
        </template>
        <template #footer>
          <el-button @click="cartVisible = false">继续选购</el-button>
          <el-button type="primary" :disabled="cart.items.length === 0" :loading="submitting" @click="checkout">提交订单</el-button>
        </template>
      </el-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getMallParts, getMallCategories, createClientSalesOrder } from '../../api';
import { useMallCartStore } from '../../stores/mallCart';

const router = useRouter();
const cart = useMallCartStore();
const parts = ref<any[]>([]);
const categories = ref<any[]>([]);
const categoryId = ref<number | null>(null);
const keyword = ref('');
const loading = ref(false);
const cartVisible = ref(false);
const submitting = ref(false);
const remark = ref('');

async function loadParts() {
  loading.value = true;
  try {
    const params: any = {};
    if (categoryId.value != null) params.categoryId = categoryId.value;
    if (keyword.value) params.keyword = keyword.value;
    const res: any = await getMallParts(params);
    parts.value = (res.data || []).map((p: any) => ({ ...p, _qty: 1 }));
  } finally {
    loading.value = false;
  }
}

function pickCategory(id: number | null) {
  categoryId.value = id;
  loadParts();
}

function addToCart(p: any) {
  cart.add({ partId: p.id, partName: p.partName, unitPrice: p.price, qty: p._qty || 1 });
  ElMessage.success('已加入购物车');
}

async function checkout() {
  if (cart.items.length === 0) return;
  submitting.value = true;
  try {
    // 只提交配件与数量，单价由服务端按客户类型解析
    await createClientSalesOrder({
      remark: remark.value,
      items: cart.items.map(i => ({ partId: i.partId, qty: i.qty })),
    });
    ElMessage.success('下单成功，等待门店备货');
    cart.clear();
    remark.value = '';
    cartVisible.value = false;
    router.push('/h5/my-orders');
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    const res: any = await getMallCategories();
    categories.value = res.data || [];
  } catch {
    // 分类加载失败不影响商品列表
  }
  loadParts();
});
</script>

<style scoped>
.h5-btn-icon { position: relative; }
.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #f56c6c;
  color: #fff;
  font-size: 10px;
  text-align: center;
}

.mall-search { margin: 12px 14px 0; }
.mall-cats { display: flex; gap: 8px; overflow-x: auto; padding: 12px 14px 0; }
.mall-cats button {
  flex: none;
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--text-2);
  font-size: 13px;
}
.mall-cats button.active { background: var(--brand); border-color: var(--brand); color: #fff; }

.mall-list { padding: 14px; }
.mall-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.mall-img { width: 62px; height: 62px; border-radius: 8px; object-fit: cover; flex: none; }
.mall-img-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f5f7;
  color: #b9c2cb;
  font-size: 12px;
}
.mall-info { flex: 1; min-width: 0; }
.mall-name { font-size: 14px; font-weight: 600; }
.mall-spec { font-size: 12px; color: var(--text-2); margin-top: 4px; }
.mall-price { font-size: 15px; font-weight: 700; color: #f56c6c; margin-top: 6px; }
.mall-ops { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; flex: none; }

.mall-empty {
  margin: 60px 24px;
  padding: 36px 20px;
  text-align: center;
  color: var(--text-2);
  font-size: 13px;
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 10px;
}
.mall-empty p { margin-bottom: 16px; }

.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}
.cart-name { font-size: 14px; font-weight: 600; }
.cart-sub { font-size: 12px; color: var(--text-2); margin-top: 4px; }
.cart-total { margin-top: 16px; text-align: right; font-size: 16px; font-weight: 700; color: #f56c6c; }
</style>
