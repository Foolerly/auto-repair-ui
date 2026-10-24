<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item>
        <el-select v-model="search.status" placeholder="状态" clearable>
          <el-option label="待退货" :value="0" /><el-option label="已退货" :value="1" /><el-option label="已取消" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增退货单</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="returnNo" label="退货单号" width="180" />
      <el-table-column label="供应商" width="160"><template #default="{row}">{{ supplierName(row.supplierId) }}</template></el-table-column>
      <el-table-column prop="totalAmount" label="金额" width="100" />
      <el-table-column label="状态" width="90"><template #default="{row}">{{ ['待退货','已退货','已取消'][row.returnStatus] }}</template></el-table-column>
      <el-table-column prop="reason" label="原因" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button v-if="row.returnStatus===0" size="small" type="success" @click="handleReturn(row.id)">退货</el-button>
          <el-button v-if="row.returnStatus===0" size="small" type="warning" @click="handleCancel(row.id)">取消</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog title="新增退货单" v-model="dialogVisible" width="720px">
      <el-form label-width="70px">
        <el-form-item label="供应商" required>
          <el-select v-model="form.supplierId" style="width:100%"><el-option v-for="s in suppliers" :key="s.id" :label="s.supplierName" :value="s.id" /></el-select>
        </el-form-item>
        <el-row :gutter="8" style="margin-bottom:8px">
          <el-col :span="10"><el-select v-model="selectedPartId" placeholder="选择配件" filterable><el-option v-for="p in partList" :key="p.id" :label="p.partName" :value="p.id" /></el-select></el-col>
          <el-col :span="4"><el-input-number v-model="selectedQty" :min="1" /></el-col>
          <el-col :span="4"><el-input-number v-model="selectedPrice" :min="0" :precision="2" /></el-col>
          <el-col :span="4"><el-button type="primary" @click="addItem">添加</el-button></el-col>
        </el-row>
        <el-table :data="form.items" border size="small">
          <el-table-column label="配件" width="180"><template #default="{row}">{{ partName(row.partId) }}</template></el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="90" />
          <el-table-column prop="qty" label="数量" width="70" />
          <el-table-column prop="totalPrice" label="小计" width="90" />
          <el-table-column label="操作"><template #default="{ $index }"><el-button size="small" type="danger" @click="form.items.splice($index,1)">删除</el-button></template></el-table-column>
        </el-table>
        <el-form-item label="原因" style="margin-top:12px"><el-input v-model="form.reason" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api';

const search = reactive<any>({ page: 1, size: 10, status: null });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<any>({ supplierId: null, items: [], reason: '' });
const suppliers = ref<any[]>([]);
const partList = ref<any[]>([]);
const selectedPartId = ref<number | null>(null);
const selectedQty = ref(1);
const selectedPrice = ref(0);

function supplierName(id: number) { return suppliers.value.find(s => s.id === id)?.supplierName || ('#' + id); }
function partName(id: number) { return partList.value.find(p => p.id === id)?.partName || ('#' + id); }

async function fetchBase() {
  const [s, p] = await Promise.all([request.get('/api/supplier/all'), request.get('/api/part/all')]);
  suppliers.value = s.data || [];
  partList.value = p.data || [];
}

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size };
  if (search.status !== null && search.status !== '') params.status = search.status;
  const res = await request.get('/api/purchase-return', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog() {
  Object.assign(form, { supplierId: null, items: [], reason: '' });
  selectedPartId.value = null; selectedQty.value = 1; selectedPrice.value = 0;
  dialogVisible.value = true;
}

function addItem() {
  if (!selectedPartId.value) return;
  const p = partList.value.find(x => x.id === selectedPartId.value);
  const price = selectedPrice.value || p?.purchasePrice || 0;
  form.items.push({ partId: selectedPartId.value, qty: selectedQty.value, unitPrice: price, totalPrice: price * selectedQty.value });
  selectedPartId.value = null; selectedQty.value = 1; selectedPrice.value = 0;
}

async function handleSave() {
  if (!form.supplierId || form.items.length === 0) { ElMessage.warning('请选择供应商并添加明细'); return; }
  await request.post('/api/purchase-return', { ...form });
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleReturn(id: number) {
  await ElMessageBox.confirm('确认退货？将扣减库存并冲减供应商欠款。', '提示', { type: 'info' });
  await request.put(`/api/purchase-return/${id}/return`);
  ElMessage.success('已退货');
  fetchData();
}

async function handleCancel(id: number) {
  await request.put(`/api/purchase-return/${id}/cancel`);
  ElMessage.success('已取消');
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/purchase-return/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => { fetchBase(); fetchData(); });
</script>