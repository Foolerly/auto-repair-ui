<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item><el-input v-model="search.keyword" placeholder="供应商名称/联系人/电话" clearable /></el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增供应商</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="supplierName" label="供应商名称" width="160" />
      <el-table-column prop="contactPerson" label="联系人" width="100" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="debtAmount" label="应付欠款" width="120" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog :title="isEdit?'编辑供应商':'新增供应商'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required><el-input v-model="form.supplierName" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="合作配件"><el-input v-model="form.cooperateParts" /></el-form-item>
        <el-form-item label="应付欠款"><el-input-number v-model="form.debtAmount" :precision="2" /></el-form-item>
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
const form = reactive({ supplierName:'', contactPerson:'', phone:'', address:'', cooperateParts:'', debtAmount:0, remark:'' });

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/supplier', { params: search });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) Object.assign(form, row); else Object.assign(form, { supplierName:'', contactPerson:'', phone:'', address:'', cooperateParts:'', debtAmount:0, remark:'' });
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/supplier', { ...form });
  else await request.post('/api/supplier', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/supplier/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(fetchData);
</script>
