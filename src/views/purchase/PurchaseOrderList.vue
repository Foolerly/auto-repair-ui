<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item>
        <el-select v-model="search.status" placeholder="订单状态" clearable>
          <el-option label="待审核" :value="0" /><el-option label="已审核" :value="1" /><el-option label="已入库" :value="2" /><el-option label="已取消" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增采购单</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="orderNo" label="采购单号" width="180" />
      <el-table-column prop="supplierId" label="供应商ID" width="80" />
      <el-table-column prop="totalAmount" label="总金额" width="100" />
      <el-table-column prop="orderStatus" label="状态" width="80">
        <template #default="{row}">{{ ['待审核','已审核','已入库','已取消'][row.orderStatus] }}</template>
      </el-table-column>
      <el-table-column prop="estimateArrivalTime" label="预计到货" width="110" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)" :disabled="row.orderStatus===3">编辑</el-button>
          <el-button size="small" v-if="row.orderStatus===0" type="success" @click="updateStatus(row.id,1)">审核</el-button>
          <el-button size="small" v-if="row.orderStatus===1" type="success" @click="updateStatus(row.id,2)">入库</el-button>
          <el-button size="small" v-if="row.orderStatus!==3" type="danger" @click="handleCancel(row.id)">取消</el-button>
          <el-button size="small" v-if="row.orderStatus===3" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog :title="isEdit?'编辑采购单':'新增采购单'" v-model="dialogVisible" width="700px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="采购单号">
          <el-input :model-value="form.orderNo" disabled placeholder="保存后自动生成" />
        </el-form-item>
        <el-form-item label="供应商ID" required><el-input-number v-model="form.supplierId" /></el-form-item>
        <el-form-item label="总金额"><el-input-number v-model="form.totalAmount" :precision="2" disabled /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.orderStatus" disabled>
            <el-option label="待审核" :value="0" /><el-option label="已审核" :value="1" /><el-option label="已入库" :value="2" /><el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计到货"><el-date-picker v-model="form.estimateArrivalTime" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="实际到货"><el-date-picker v-model="form.actualArrivalTime" type="date" value-format="YYYY-MM-DD" :disabled="true" /></el-form-item>
        <el-form-item label="采购人ID"><el-input-number v-model="form.purchaserId" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>

        <el-divider>采购明细</el-divider>
        <el-row :gutter="8" style="margin-bottom:8px">
          <el-col :span="10">
            <el-select v-model="selectedPartId" placeholder="选择配件" filterable>
              <el-option v-for="p in partList" :key="p.id" :label="p.partName + ' (进价:¥' + p.purchasePrice + ')'" :value="p.id" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-input-number v-model="selectedPartQty" :min="1" placeholder="数量" />
          </el-col>
          <el-col :span="4">
            <el-input-number v-model="selectedPartPrice" :min="0" :precision="2" placeholder="单价" />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="addItem">添加</el-button>
          </el-col>
        </el-row>
        <el-table :data="form.items" border size="small" v-if="form.items.length>0">
          <el-table-column prop="partId" label="配件ID" width="70" />
          <el-table-column label="配件名称" width="160"><template #default="{row}">{{ getPartName(row.partId) }}</template></el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="80" />
          <el-table-column prop="qty" label="数量" width="60" />
          <el-table-column prop="totalPrice" label="小计" width="80" />
          <el-table-column label="操作"><template #default="{ $index }"><el-button size="small" type="danger" @click="form.items.splice($index,1)">删除</el-button></template></el-table-column>
        </el-table>
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

interface Item { partId: number; qty: number; unitPrice: number; totalPrice: number; }

const search = reactive<any>({ page: 1, size: 10, status: null });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<any>({ orderNo:'', supplierId:null, totalAmount:0, orderStatus:0, estimateArrivalTime:'', actualArrivalTime:'', purchaserId:null, remark:'', items: [] as Item[] });
const partList = ref<any[]>([]);
const selectedPartId = ref<number | null>(null);
const selectedPartQty = ref(1);
const selectedPartPrice = ref(0);

function getPartName(partId: number) {
  const p = partList.value.find((x: any) => x.id === partId);
  return p ? p.partName : '';
}

async function fetchPartList() {
  const res = await request.get('/api/part/all');
  partList.value = res.data || [];
}

function addItem() {
  if (!selectedPartId.value) return;
  const part = partList.value.find((p: any) => p.id === selectedPartId.value);
  if (!part) return;
  const price = selectedPartPrice.value || part.purchasePrice;
  const qty = selectedPartQty.value;
  form.items.push({ partId: part.id, qty, unitPrice: price, totalPrice: price * qty });
  selectedPartId.value = null;
  selectedPartQty.value = 1;
  selectedPartPrice.value = 0;
}

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size };
  if (search.status !== null && search.status !== '') params.status = search.status;
  const res = await request.get('/api/purchase-order', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

async function updateStatus(id: number, status: number) {
  if (status === 2) {
    await ElMessageBox.confirm('确认入库？入库后将自动增加配件库存。', '提示', { type: 'info' });
  }
  await request.put(`/api/purchase-order/status/${id}?status=${status}`);
  ElMessage.success('状态已更新');
  fetchData();
}

async function handleCancel(id: number) {
  await ElMessageBox.confirm('确定取消该采购单？', '提示', { type: 'warning' });
  await request.put(`/api/purchase-order/status/${id}?status=3`);
  ElMessage.success('已取消');
  fetchData();
}

async function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) {
    const res = await request.get(`/api/purchase-order/${row.id}`);
    Object.assign(form, { ...res.data, items: res.data?.items ? [...res.data.items] : [] });
  } else {
    Object.assign(form, { orderNo:'', supplierId:null, totalAmount:0, orderStatus:0, estimateArrivalTime:'', actualArrivalTime:'', purchaserId:null, remark:'', items: [] });
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/purchase-order', { ...form });
  else await request.post('/api/purchase-order', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/purchase-order/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => { fetchData(); fetchPartList(); });
</script>
