<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item>
        <el-select v-model="search.status" placeholder="工单状态" clearable>
          <el-option label="待诊断" :value="0" /><el-option label="诊断中" :value="1" /><el-option label="待确认" :value="2" /><el-option label="待维修" :value="3" /><el-option label="维修中" :value="4" /><el-option label="待结算" :value="5" /><el-option label="已完成" :value="6" /><el-option label="已取消" :value="7" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增工单</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="orderNo" label="工单号" width="180" />
      <el-table-column prop="customerId" label="客户ID" width="70" />
      <el-table-column prop="vehicleId" label="车辆ID" width="70" />
      <el-table-column prop="faultDescription" label="故障描述" width="180" show-overflow-tooltip />
      <el-table-column prop="workOrderStatus" label="状态" width="80">
        <template #default="{row}">{{ ['待诊断','诊断中','待确认','待维修','维修中','待结算','已完成','已取消'][row.workOrderStatus] }}</template>
      </el-table-column>
      <el-table-column prop="laborFee" label="工时费" width="80" />
      <el-table-column prop="totalAmount" label="总金额" width="90" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)" :disabled="[6,7].includes(row.workOrderStatus)">编辑</el-button>
          <el-button size="small" v-if="row.workOrderStatus===0" type="success" @click="updateStatus(row.id,1)">开始诊断</el-button>
          <el-button size="small" v-if="row.workOrderStatus===1" type="warning" @click="openQuoteDialog(row)">创建报价</el-button>
          <el-button size="small" v-if="row.workOrderStatus===2" type="primary" @click="updateStatus(row.id,3)">待维修</el-button>
          <el-button size="small" v-if="row.workOrderStatus===3" type="success" @click="updateStatus(row.id,4)">开始维修</el-button>
          <el-button size="small" v-if="row.workOrderStatus===4" type="warning" @click="updateStatus(row.id,5)">待结算</el-button>
          <el-button size="small" v-if="row.workOrderStatus===5" type="success" @click="handleComplete(row)">收款完成</el-button>
          <el-button size="small" v-if="![6,7].includes(row.workOrderStatus)" type="danger" @click="handleCancel(row.id)">取消</el-button>
          <el-button size="small" v-if="[6,7].includes(row.workOrderStatus)" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog :title="isEdit?'编辑工单':'新增工单'" v-model="dialogVisible" width="700px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="工单号">
          <el-input :model-value="form.orderNo" disabled placeholder="保存后自动生成" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="客户ID"><el-input-number v-model="form.customerId" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="车辆ID"><el-input-number v-model="form.vehicleId" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="技师ID"><el-input-number v-model="form.technicianId" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="故障描述"><el-input v-model="form.faultDescription" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="维修内容"><el-input v-model="form.repairContent" type="textarea" :rows="2" /></el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="工时费"><el-input-number v-model="form.laborFee" :precision="2" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="总金额"><el-input-number v-model="form.totalAmount" :precision="2" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="状态">
            <el-select v-model="form.workOrderStatus" :disabled="!isEdit">
              <el-option label="待诊断" :value="0" /><el-option label="诊断中" :value="1" /><el-option label="待确认" :value="2" /><el-option label="待维修" :value="3" /><el-option label="维修中" :value="4" /><el-option label="待结算" :value="5" /><el-option label="已完成" :value="6" /><el-option label="已取消" :value="7" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>

        <el-divider>领用配件</el-divider>
        <el-row :gutter="8" style="margin-bottom:8px">
          <el-col :span="10">
            <el-select v-model="selectedPartId" placeholder="选择配件" filterable>
              <el-option v-for="p in partList" :key="p.id" :label="p.partName + ' (库存:' + p.stockQty + ')'" :value="p.id" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input-number v-model="selectedPartQty" :min="1" placeholder="数量" />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="addPart">添加</el-button>
          </el-col>
        </el-row>
        <el-table :data="form.parts" border size="small" v-if="form.parts.length>0">
          <el-table-column prop="partId" label="配件ID" width="70" />
          <el-table-column label="配件名称" width="160"><template #default="{row}">{{ getPartName(row.partId) }}</template></el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="80" />
          <el-table-column prop="qty" label="数量" width="60" />
          <el-table-column prop="totalPrice" label="小计" width="80" />
          <el-table-column label="操作"><template #default="{ $index }"><el-button size="small" type="danger" @click="form.parts.splice($index,1)">删除</el-button></template></el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="创建报价单" v-model="quoteDialogVisible" width="520px">
      <el-form :model="quoteForm" label-width="90px">
        <el-form-item label="工时费"><el-input-number v-model="quoteForm.laborFee" :precision="2" :min="0" /></el-form-item>
        <el-form-item label="配件费"><el-input-number v-model="quoteForm.partsFee" :precision="2" :min="0" /></el-form-item>
        <el-form-item label="总金额"><el-input-number v-model="quoteForm.totalAmount" :precision="2" :min="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="quoteForm.remark" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quoteDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleCreateQuote">创建报价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api';

interface PartItem { partId: number; qty: number; unitPrice: number; totalPrice: number; }

const search = reactive<any>({ page: 1, size: 10, status: null });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<any>({ orderNo:'', customerId:null, vehicleId:null, technicianId:null, faultDescription:'', repairContent:'', workOrderStatus:0, laborFee:0, totalAmount:0, remark:'', parts: [] as PartItem[] });
const partList = ref<any[]>([]);
const selectedPartId = ref<number | null>(null);
const selectedPartQty = ref(1);
const quoteDialogVisible = ref(false);
const quoteForm = reactive<any>({ workOrderId: null, laborFee: 0, partsFee: 0, totalAmount: 0, remark: '' });

function getPartName(partId: number) {
  const p = partList.value.find((x: any) => x.id === partId);
  return p ? p.partName : '';
}

async function fetchPartList() {
  const res = await request.get('/api/part/all');
  partList.value = res.data || [];
}

function addPart() {
  if (!selectedPartId.value) return;
  const part = partList.value.find((p: any) => p.id === selectedPartId.value);
  if (!part) return;
  const price = part.salePrice || 0;
  const qty = selectedPartQty.value;
  form.parts.push({ partId: part.id, qty, unitPrice: price, totalPrice: price * qty });
  selectedPartId.value = null;
  selectedPartQty.value = 1;
}

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size };
  if (search.status !== null && search.status !== '') params.status = search.status;
  const res = await request.get('/api/work-order', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

async function updateStatus(id: number, status: number) {
  await request.put(`/api/work-order/status/${id}?status=${status}`);
  ElMessage.success('状态已更新');
  fetchData();
}

async function handleComplete(row: any) {
  try {
    await ElMessageBox.prompt('请输入收款金额', '收款', {
      confirmButtonText: '确认收款',
      inputType: 'number',
      inputValue: row.totalAmount || 0,
    });
    const amount = (document.querySelector('.el-message-box__input input') as HTMLInputElement)?.value;
    await request.post('/api/payment', {
      workOrderId: row.id,
      amount: Number(amount),
      paymentMethod: 2,
    });
    ElMessage.success('收款成功，工单已完成');
    fetchData();
  } catch {
    // 用户取消
  }
}

async function handleCancel(id: number) {
  await ElMessageBox.confirm('确定取消该工单？已领用的配件将退回库存。', '提示', { type: 'warning' });
  await updateStatus(id, 7);
}

function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, { ...row, parts: row.parts ? [...row.parts] : [] });
  } else {
    Object.assign(form, { orderNo:'', customerId:null, vehicleId:null, technicianId:null, faultDescription:'', repairContent:'', workOrderStatus:0, laborFee:0, totalAmount:0, remark:'', parts: [] });
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/work-order', { ...form });
  else await request.post('/api/work-order', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/work-order/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

function openQuoteDialog(row: any) {
  quoteForm.workOrderId = row.id;
  quoteForm.laborFee = row.laborFee || 0;
  quoteForm.partsFee = 0;
  quoteForm.totalAmount = row.laborFee || 0;
  quoteForm.remark = '';
  quoteDialogVisible.value = true;
}

async function handleCreateQuote() {
  await request.post('/api/quote', { ...quoteForm });
  ElMessage.success('报价单已创建');
  quoteDialogVisible.value = false;
  fetchData();
}

watch(() => [quoteForm.laborFee, quoteForm.partsFee], ([l, p]) => {
  quoteForm.totalAmount = (Number(l) || 0) + (Number(p) || 0);
});

onMounted(() => { fetchData(); fetchPartList(); });
</script>
