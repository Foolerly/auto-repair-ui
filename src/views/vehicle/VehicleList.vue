<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item><el-input v-model="search.keyword" placeholder="车牌号/品牌/车型" clearable /></el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增车辆</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="plateNumber" label="车牌号" width="110" />
      <el-table-column prop="brand" label="品牌" width="100" />
      <el-table-column prop="model" label="车型" width="120" />
      <el-table-column prop="vin" label="VIN" width="150" />
      <el-table-column prop="engineNo" label="发动机号" width="130" />
      <el-table-column prop="mileage" label="里程(km)" width="90" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog :title="isEdit?'编辑车辆':'新增车辆'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="客户ID" required><el-input-number v-model="form.customerId" /></el-form-item>
        <el-form-item label="车牌号" required><el-input v-model="form.plateNumber" /></el-form-item>
        <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
        <el-form-item label="车型"><el-input v-model="form.model" /></el-form-item>
        <el-form-item label="VIN"><el-input v-model="form.vin" /></el-form-item>
        <el-form-item label="发动机号"><el-input v-model="form.engineNo" /></el-form-item>
        <el-form-item label="购车日期"><el-date-picker v-model="form.purchaseDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="里程(km)"><el-input-number v-model="form.mileage" /></el-form-item>
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

const search = reactive({ page: 1, size: 10, keyword: '' });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<any>({ customerId:null, plateNumber:'', brand:'', model:'', vin:'', engineNo:'', purchaseDate:'', mileage:null, remark:'' });

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/vehicle', { params: search });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) Object.assign(form, row); else Object.assign(form, { customerId:null, plateNumber:'', brand:'', model:'', vin:'', engineNo:'', purchaseDate:'', mileage:null, remark:'' });
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/vehicle', { ...form });
  else await request.post('/api/vehicle', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/vehicle/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(fetchData);
</script>
