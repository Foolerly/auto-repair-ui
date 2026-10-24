<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item>
        <el-select v-model="search.status" placeholder="状态" clearable>
          <el-option label="待出库" :value="0" /><el-option label="已出库" :value="1" /><el-option label="已退料" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增领料单</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="requisitionNo" label="领料单号" width="180" />
      <el-table-column prop="workOrderId" label="工单ID" width="80" />
      <el-table-column prop="technicianId" label="技师ID" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{row}">{{ ['待出库','已出库','已退料'][row.status] }}</template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDetail(row)">明细</el-button>
          <el-button v-if="row.status===0" size="small" type="success" @click="handleOut(row.id)">出库</el-button>
          <el-button v-if="row.status===1" size="small" type="warning" @click="handleReturn(row.id)">退料</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog title="新增领料单" v-model="dialogVisible" width="700px">
      <el-form label-width="70px">
        <el-row :gutter="8" style="margin-bottom:8px">
          <el-col :span="6"><el-select v-model="selectedPartId" placeholder="选择配件" filterable><el-option v-for="p in partList" :key="p.id" :label="p.partName" :value="p.id" /></el-select></el-col>
          <el-col :span="6"><el-select v-model="selectedModelId" placeholder="车型(可空)" clearable filterable><el-option v-for="m in models" :key="m.id" :label="modelLabel(m)" :value="m.id" /></el-select></el-col>
          <el-col :span="4"><el-input-number v-model="selectedQty" :min="1" /></el-col>
          <el-col :span="4"><el-button type="primary" @click="addItem">添加</el-button></el-col>
        </el-row>
        <el-table :data="form.items" border size="small">
          <el-table-column label="配件" width="180"><template #default="{row}">{{ partName(row.partId) }}</template></el-table-column>
          <el-table-column label="车型" width="180"><template #default="{row}">{{ modelName(row.vehicleModelId) }}</template></el-table-column>
          <el-table-column prop="qty" label="数量" width="70" />
          <el-table-column label="操作"><template #default="{ $index }"><el-button size="small" type="danger" @click="form.items.splice($index,1)">删除</el-button></template></el-table-column>
        </el-table>
        <el-form-item label="备注" style="margin-top:12px"><el-input v-model="form.remark" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="领料明细" v-model="detailVisible" width="560px">
      <el-table :data="detailItems" border size="small">
        <el-table-column label="配件" width="200"><template #default="{row}">{{ partName(row.partId) }}</template></el-table-column>
        <el-table-column label="车型" width="200"><template #default="{row}">{{ modelName(row.vehicleModelId) }}</template></el-table-column>
        <el-table-column prop="qty" label="数量" />
      </el-table>
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
const detailVisible = ref(false);
const detailItems = ref<any[]>([]);
const form = reactive<any>({ items: [], remark: '' });
const partList = ref<any[]>([]);
const models = ref<any[]>([]);
const selectedPartId = ref<number | null>(null);
const selectedModelId = ref<number | null>(null);
const selectedQty = ref(1);

function partName(id: number) { return partList.value.find(p => p.id === id)?.partName || ('配件#' + id); }
function modelLabel(m: any) { return [m.brand, m.series, m.modelYear].filter(Boolean).join(' '); }
function modelName(id: number) { if (!id) return '-'; return models.value.find(m => m.id === id) ? modelLabel(models.value.find(m => m.id === id)) : ('车型#' + id); }

async function fetchBase() {
  const [p, m] = await Promise.all([request.get('/api/part/all'), request.get('/api/vehicle-model/all')]);
  partList.value = p.data || [];
  models.value = m.data || [];
}

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size };
  if (search.status !== null && search.status !== '') params.status = search.status;
  const res = await request.get('/api/requisition', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog() {
  Object.assign(form, { items: [], remark: '' });
  selectedPartId.value = null; selectedModelId.value = null; selectedQty.value = 1;
  dialogVisible.value = true;
}

function addItem() {
  if (!selectedPartId.value) { ElMessage.warning('请选择配件'); return; }
  form.items.push({ partId: selectedPartId.value, vehicleModelId: selectedModelId.value, qty: selectedQty.value });
  selectedPartId.value = null; selectedModelId.value = null; selectedQty.value = 1;
}

async function handleSave() {
  if (form.items.length === 0) { ElMessage.warning('请添加领料明细'); return; }
  await request.post('/api/requisition', { ...form });
  ElMessage.success('领料单已创建');
  dialogVisible.value = false;
  fetchData();
}

async function openDetail(row: any) {
  const res = await request.get(`/api/requisition/${row.id}`);
  detailItems.value = res.data?.items || [];
  detailVisible.value = true;
}

async function handleOut(id: number) {
  await ElMessageBox.confirm('确认出库？库存不足的配件将自动生成采购申请。', '提示', { type: 'info' });
  await request.put(`/api/requisition/${id}/out`);
  ElMessage.success('已出库');
  fetchData();
}

async function handleReturn(id: number) {
  await ElMessageBox.confirm('确认退料？配件将退回库存。', '提示', { type: 'warning' });
  await request.put(`/api/requisition/${id}/return`);
  ElMessage.success('已退料');
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/requisition/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => { fetchBase(); fetchData(); });
</script>