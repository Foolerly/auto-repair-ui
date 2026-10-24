<template>
  <div>
    <el-form :inline="true">
      <el-form-item><el-button type="success" @click="openDialog()">登记损耗</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="scrapNo" label="损耗单号" width="180" />
      <el-table-column label="配件" width="200"><template #default="{row}">{{ partName(row.partId) }}</template></el-table-column>
      <el-table-column prop="qty" label="数量" width="80" />
      <el-table-column prop="reason" label="原因" show-overflow-tooltip />
      <el-table-column prop="createTime" label="时间" width="170" />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{row}"><el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button></template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog title="登记损耗" v-model="dialogVisible" width="460px">
      <el-form label-width="70px">
        <el-form-item label="配件" required>
          <el-select v-model="form.partId" filterable style="width:100%"><el-option v-for="p in partList" :key="p.id" :label="p.partName" :value="p.id" /></el-select>
        </el-form-item>
        <el-form-item label="数量" required><el-input-number v-model="form.qty" :min="1" /></el-form-item>
        <el-form-item label="原因"><el-input v-model="form.reason" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">登记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api';

const search = reactive({ page: 1, size: 10 });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<any>({ partId: null, qty: 1, reason: '' });
const partList = ref<any[]>([]);

function partName(id: number) { return partList.value.find(p => p.id === id)?.partName || ('#' + id); }

async function fetchParts() { const res = await request.get('/api/part/all'); partList.value = res.data || []; }

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/part-scrap', { params: search });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog() { Object.assign(form, { partId: null, qty: 1, reason: '' }); dialogVisible.value = true; }

async function handleSave() {
  await request.post('/api/part-scrap', { ...form });
  ElMessage.success('已登记损耗');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/part-scrap/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => { fetchParts(); fetchData(); });
</script>