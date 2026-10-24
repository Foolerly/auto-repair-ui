<template>
  <div>
    <el-form :inline="true">
      <el-form-item><el-input v-model="search.keyword" placeholder="搜索配件名称/规格" clearable /></el-form-item>
      <el-form-item>
        <el-select v-model="search.categoryId" placeholder="分类" clearable style="width:140px">
          <el-option v-for="c in categories" :key="c.id" :label="c.categoryName" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="search.modelId" placeholder="适配车型" clearable filterable style="width:180px">
          <el-option v-for="m in models" :key="m.id" :label="modelLabel(m)" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="cartVisible = true">采购车 ({{ cart.count }})</el-button></el-form-item>
    </el-form>

    <el-row :gutter="16">
      <el-col :span="6" v-for="p in filteredParts" :key="p.id">
        <el-card style="margin-bottom:16px">
          <img v-if="p.image" :src="p.image" style="height:90px;width:100%;object-fit:cover;border-radius:4px" />
          <div v-else style="height:90px;background:#f5f7fa;color:#ccc;display:flex;align-items:center;justify-content:center">无图</div>
          <div style="font-weight:bold;margin-top:8px">{{ p.partName }}</div>
          <div style="color:#999;font-size:12px">{{ p.spec || '-' }}</div>
          <div style="color:#f56c6c;margin:4px 0">进价 ¥{{ p.purchasePrice }} · 库存 {{ p.stockQty }}</div>
          <div style="display:flex;gap:8px">
            <el-input-number v-model="p._qty" :min="1" size="small" style="width:90px" />
            <el-button size="small" type="primary" @click="addToCart(p)">加入采购车</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-drawer v-model="cartVisible" title="采购车" size="480px">
      <el-table :data="cart.items" border size="small">
        <el-table-column prop="partName" label="配件" />
        <el-table-column prop="unitPrice" label="进价" width="80" />
        <el-table-column prop="qty" label="数量" width="70" />
        <el-table-column label="操作" width="70">
          <template #default="{row}"><el-button size="small" type="danger" @click="cart.remove(row.partId)">删</el-button></template>
        </el-table-column>
      </el-table>
      <div style="margin-top:12px;font-weight:bold">合计：¥{{ cart.totalPrice }}</div>
      <el-form style="margin-top:12px">
        <el-form-item label="供应商">
          <el-select v-model="supplierId" placeholder="选择供应商" style="width:100%">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.supplierName" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cartVisible=false">取消</el-button>
        <el-button type="primary" @click="checkout">生成采购单</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../api';
import { useCartStore } from '../../stores/cart';

const cart = useCartStore();
const search = reactive({ keyword: '', categoryId: null as number | null, modelId: null as number | null });
const parts = ref<any[]>([]);
const categories = ref<any[]>([]);
const models = ref<any[]>([]);
const suppliers = ref<any[]>([]);
const cartVisible = ref(false);
const supplierId = ref<number | null>(null);

const filteredParts = computed(() => parts.value.filter(p => {
  if (search.keyword && !(p.partName?.includes(search.keyword) || p.spec?.includes(search.keyword))) return false;
  if (search.categoryId && p.categoryId !== search.categoryId) return false;
  if (search.modelId && !(p.vehicleModelIds || []).includes(search.modelId)) return false;
  return true;
}));

function modelLabel(m: any) { return [m.brand, m.series, m.modelYear].filter(Boolean).join(' '); }

async function fetchParts() {
  const res = await request.get('/api/part/with-models');
  parts.value = (res.data || []).map((p: any) => ({ ...p, _qty: 1 }));
}

async function fetchBase() {
  const [c, m, s] = await Promise.all([
    request.get('/api/part-category/all'),
    request.get('/api/vehicle-model/all'),
    request.get('/api/supplier/all'),
  ]);
  categories.value = c.data || [];
  models.value = m.data || [];
  suppliers.value = s.data || [];
}

function addToCart(p: any) {
  cart.add({ partId: p.id, partName: p.partName, unitPrice: p.purchasePrice || 0, qty: p._qty || 1 });
  ElMessage.success('已加入采购车');
}

async function checkout() {
  if (!supplierId.value) { ElMessage.warning('请选择供应商'); return; }
  if (cart.items.length === 0) { ElMessage.warning('采购车为空'); return; }
  const items = cart.items.map(i => ({ partId: i.partId, qty: i.qty, unitPrice: i.unitPrice, totalPrice: i.unitPrice * i.qty }));
  await request.post('/api/purchase-order', { supplierId: supplierId.value, items });
  ElMessage.success('采购单已生成');
  cart.clear();
  cartVisible.value = false;
  fetchParts();
}

onMounted(() => { fetchParts(); fetchBase(); });
</script>