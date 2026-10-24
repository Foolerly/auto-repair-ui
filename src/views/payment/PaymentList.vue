<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item><el-input-number v-model="search.workOrderId" placeholder="工单ID" /></el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增收款</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="paymentNo" label="收款单号" width="180" />
      <el-table-column prop="workOrderId" label="工单ID" width="80" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="paymentMethod" label="支付方式" width="100">
        <template #default="{row}">{{ ['','现金','微信','支付宝','银行卡','积分抵扣'][row.paymentMethod] }}</template>
      </el-table-column>
      <el-table-column prop="paymentStatus" label="状态" width="80">
        <template #default="{row}">{{ ['未收款','已收款','已退款'][row.paymentStatus] }}</template>
      </el-table-column>
      <el-table-column prop="paymentTime" label="收款时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog :title="isEdit?'编辑收款':'新增收款'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="收款单号" required><el-input v-model="form.paymentNo" /></el-form-item>
        <el-form-item label="工单ID" required><el-input-number v-model="form.workOrderId" /></el-form-item>
        <el-form-item label="金额" required><el-input-number v-model="form.amount" :precision="2" /></el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="form.paymentMethod">
            <el-option label="现金" :value="1" /><el-option label="微信" :value="2" /><el-option label="支付宝" :value="3" /><el-option label="银行卡" :value="4" /><el-option label="积分抵扣" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.paymentStatus">
            <el-option label="未收款" :value="0" /><el-option label="已收款" :value="1" /><el-option label="已退款" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款时间"><el-date-picker v-model="form.paymentTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
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

const search = reactive<any>({ page: 1, size: 10, workOrderId: null });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<any>({ paymentNo:'', workOrderId:null, amount:0, paymentMethod:1, paymentStatus:0, paymentTime:'', remark:'' });

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size };
  if (search.workOrderId) params.workOrderId = search.workOrderId;
  const res = await request.get('/api/payment', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) Object.assign(form, row); else Object.assign(form, { paymentNo:'', workOrderId:null, amount:0, paymentMethod:1, paymentStatus:0, paymentTime:'', remark:'' });
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/payment', { ...form });
  else await request.post('/api/payment', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/payment/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(fetchData);
</script>
