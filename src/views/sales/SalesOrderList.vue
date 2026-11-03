<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item>
        <el-select v-model="search.status" placeholder="销售状态" clearable>
          <el-option label="待付款" :value="0" /><el-option label="待发货" :value="1" />
          <el-option label="已完成" :value="2" /><el-option label="已取消" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增销售单</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="orderNo" label="销售单号" width="170" />
      <el-table-column prop="customerId" label="客户ID" width="80" />
      <el-table-column prop="totalAmount" label="总金额" width="100" />
      <el-table-column prop="salesStatus" label="状态" width="90">
        <template #default="{row}">
          <el-tag :type="statusTagType(row.salesStatus)">{{ STATUS_TEXT[row.salesStatus] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="outboundTime" label="出库时间" width="170" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="270" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)" :disabled="row.salesStatus!==0">编辑</el-button>
          <el-button size="small" v-if="row.salesStatus===0" type="warning" @click="openPayDialog(row)">收款</el-button>
          <el-button size="small" v-if="row.salesStatus===1" type="success" @click="handleOutbound(row)">出库发货</el-button>
          <el-button size="small" v-if="row.salesStatus===0" type="danger" @click="handleCancel(row)">取消</el-button>
          <el-button size="small" v-if="row.salesStatus===3" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog :title="isEdit?'编辑销售单':'新增销售单'" v-model="dialogVisible" width="760px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="销售单号">
          <el-input :model-value="form.orderNo" disabled placeholder="保存后自动生成" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="客户ID"><el-input-number v-model="form.customerId" @change="onCustomerChange" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="总金额"><el-input-number :model-value="totalAmount" :precision="2" disabled /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="状态">
            <el-input :model-value="STATUS_TEXT[form.salesStatus]" disabled />
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>

        <el-divider>销售明细</el-divider>
        <el-row :gutter="8" style="margin-bottom:8px">
          <el-col :span="9">
            <el-select v-model="selectedPartId" placeholder="选择配件" filterable style="width:100%" @change="onPartChange">
              <el-option v-for="p in partList" :key="p.id" :label="p.partName + ' (库存:' + p.stockQty + ')'" :value="p.id" />
            </el-select>
          </el-col>
          <el-col :span="4"><el-input-number v-model="selectedQty" :min="1" placeholder="数量" style="width:100%" /></el-col>
          <el-col :span="5"><el-input-number v-model="selectedPrice" :min="0" :precision="2" placeholder="单价" style="width:100%" /></el-col>
          <el-col :span="4"><el-button type="primary" @click="addItem">添加</el-button></el-col>
        </el-row>
        <el-table :data="form.items" border size="small">
          <el-table-column prop="partId" label="配件ID" width="80" />
          <el-table-column label="配件名称" width="200"><template #default="{row}">{{ getPartName(row.partId) }}</template></el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="90" />
          <el-table-column prop="qty" label="数量" width="70" />
          <el-table-column label="小计" width="100"><template #default="{row}">{{ (Number(row.unitPrice||0)*Number(row.qty||0)).toFixed(2) }}</template></el-table-column>
          <el-table-column label="操作"><template #default="{ $index }"><el-button size="small" type="danger" @click="form.items.splice($index,1)">删除</el-button></template></el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="销售收款" v-model="payDialogVisible" width="420px">
      <el-form :model="payForm" label-width="90px">
        <el-form-item label="销售单号"><el-input :model-value="payForm.orderNo" disabled /></el-form-item>
        <el-form-item label="收款金额"><el-input-number :model-value="payForm.amount" :precision="2" disabled /></el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="payForm.paymentMethod">
            <el-option label="现金" :value="1" /><el-option label="微信" :value="2" />
            <el-option label="支付宝" :value="3" /><el-option label="银行卡" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handlePay">确认收款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api';

interface SalesItem { partId: number | null; qty: number; unitPrice: number; }

const STATUS_TEXT: Record<number, string> = { 0: '待付款', 1: '待发货', 2: '已完成', 3: '已取消' };
const statusTagType = (s: number) => (s === 2 ? 'success' : s === 3 ? 'info' : s === 1 ? 'warning' : 'primary');

const search = reactive<any>({ page: 1, size: 10, status: null });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<any>({ id: null, orderNo: '', customerId: null, salesStatus: 0, remark: '', items: [] as SalesItem[] });
const partList = ref<any[]>([]);
const selectedPartId = ref<number | null>(null);
const selectedQty = ref(1);
const selectedPrice = ref(0);

const payDialogVisible = ref(false);
const payForm = reactive<any>({ id: null, orderNo: '', amount: 0, paymentMethod: 2 });

const totalAmount = computed(() =>
  (form.items as SalesItem[]).reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.qty) || 0), 0));

const getPartName = (id: number) => partList.value.find((p: any) => p.id === id)?.partName || id;

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: search.page, size: search.size };
    if (search.status !== null && search.status !== '') params.status = search.status;
    const res: any = await request.get('/api/sales-order', { params });
    tableData.value = res.data.records || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
  }
}

async function fetchParts() {
  const res: any = await request.get('/api/part/all');
  partList.value = res.data || [];
}

async function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) {
    const res: any = await request.get(`/api/sales-order/${row.id}`);
    const d = res.data;
    Object.assign(form, {
      id: d.id, orderNo: d.orderNo, customerId: d.customerId, salesStatus: d.salesStatus,
      remark: d.remark, items: (d.items || []).map((i: any) => ({ partId: i.partId, qty: i.qty, unitPrice: i.unitPrice })),
    });
  } else {
    Object.assign(form, { id: null, orderNo: '', customerId: null, salesStatus: 0, remark: '', items: [] });
  }
  selectedPartId.value = null;
  selectedQty.value = 1;
  selectedPrice.value = 0;
  dialogVisible.value = true;
}

async function resolvePartPrice(partId: number, customerId: number | null) {
  const params: any = { partId };
  if (customerId != null) params.customerId = customerId;
  const res: any = await request.get('/api/part/resolve-price', { params });
  return Number(res.data) || 0;
}

async function onPartChange(id: number) {
  if (!id) return;
  selectedPrice.value = await resolvePartPrice(id, form.customerId);
}

async function onCustomerChange() {
  if (selectedPartId.value) {
    selectedPrice.value = await resolvePartPrice(selectedPartId.value, form.customerId);
  }
}

async function addItem() {
  if (!selectedPartId.value) { ElMessage.warning('请选择配件'); return; }
  if (!selectedPrice.value) {
    selectedPrice.value = await resolvePartPrice(selectedPartId.value, form.customerId);
  }
  const exists = (form.items as SalesItem[]).find(i => i.partId === selectedPartId.value);
  if (exists) {
    exists.qty = Number(exists.qty) + Number(selectedQty.value);
    exists.unitPrice = selectedPrice.value || exists.unitPrice;
  } else {
    (form.items as SalesItem[]).push({ partId: selectedPartId.value, qty: selectedQty.value, unitPrice: selectedPrice.value });
  }
  selectedPartId.value = null;
  selectedQty.value = 1;
  selectedPrice.value = 0;
}

async function handleSave() {
  if (form.items.length === 0) { ElMessage.warning('请至少添加一条销售明细'); return; }
  const payload = { id: form.id, customerId: form.customerId, remark: form.remark, items: form.items };
  if (isEdit.value) await request.put('/api/sales-order', payload);
  else await request.post('/api/sales-order', payload);
  ElMessage.success(isEdit.value ? '修改成功' : '开单成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleOutbound(row: any) {
  await ElMessageBox.confirm('确认出库？将按明细扣减库存。', '出库确认', { type: 'warning' });
  await request.put(`/api/sales-order/outbound/${row.id}`);
  ElMessage.success('出库成功');
  fetchData();
}

function openPayDialog(row: any) {
  payForm.id = row.id;
  payForm.orderNo = row.orderNo;
  payForm.amount = row.totalAmount;
  payForm.paymentMethod = 2;
  payDialogVisible.value = true;
}

async function handlePay() {
  await request.put(`/api/sales-order/pay/${payForm.id}`, { paymentMethod: payForm.paymentMethod });
  ElMessage.success('收款成功');
  payDialogVisible.value = false;
  fetchData();
}

async function handleCancel(row: any) {
  await ElMessageBox.confirm('确定取消该销售单？', '提示', { type: 'warning' });
  await request.put(`/api/sales-order/cancel/${row.id}`);
  ElMessage.success('已取消');
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/sales-order/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => {
  fetchData();
  fetchParts();
});
</script>
