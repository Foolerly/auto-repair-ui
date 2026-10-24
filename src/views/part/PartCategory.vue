<template>
  <div>
    <el-button type="success" @click="openDialog()" style="margin-bottom:12px">新增分类</el-button>
    <el-table :data="tableData" border stripe v-loading="loading" row-key="id" default-expand-all>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="categoryName" label="分类名称" />
      <el-table-column prop="parentId" label="父级ID" width="80" />
      <el-table-column prop="sortOrder" label="排序" width="60" />
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="isEdit?'编辑分类':'新增分类'" v-model="dialogVisible" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required><el-input v-model="form.categoryName" /></el-form-item>
        <el-form-item label="父级ID"><el-input-number v-model="form.parentId" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" /></el-form-item>
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

const tableData = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({ categoryName:'', parentId:0, sortOrder:0 });

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/part-category/all');
  tableData.value = res.data;
  loading.value = false;
}

function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) Object.assign(form, row); else Object.assign(form, { categoryName:'', parentId:0, sortOrder:0 });
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/part-category', { ...form });
  else await request.post('/api/part-category', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/part-category/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(fetchData);
</script>
