<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item>
        <el-select v-model="search.status" placeholder="状态" clearable>
          <el-option label="待处理" :value="0" /><el-option label="已转采购" :value="1" /><el-option label="已拒绝" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增申请</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="requestNo" label="申请单号" width="180" />
      <el-table-column label="配件" width="200">
        <template #default="{row}">{{ partName(row.partId) }}</template>
      </el-table-column>
      <el-table-column prop="qty" label="数量" width="80" />
      <el-table-column prop="detail" label="采购明细" min-width="180" show-overflow-tooltip />
      <el-table-column prop="reason" label="原因" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{row}">{{ ['待处理','已转采购','已拒绝'][row.status] }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button v-if="row.status===0" size="small" type="success" @click="handleStatus(row.id,1)">转采购</el-button>
          <el-button v-if="row.status===0" size="small" type="warning" @click="handleStatus(row.id,2)">拒绝</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog title="新增采购申请" v-model="dialogVisible" width="480px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="配件" required>
          <el-select v-model="form.partId" filterable style="width:100%">
            <el-option v-for="p in partList" :key="p.id" :label="p.partName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" required><el-input-number v-model="form.qty" :min="1" /></el-form-item>
        <el-form-item label="采购明细">
          <el-input v-model="form.detail" type="textarea" :rows="2" placeholder="如：壳牌机油 4桶、博世机滤 2个" />
        </el-form-item>
        <el-form-item label="原因"><el-input v-model="form.reason" /></el-form-item>
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
const form = reactive<any>({ partId: null, qty: 1, detail: '', reason: '' });
const partList = ref<any[]>([]);

function partName(id: number) { return partList.value.find(p => p.id === id)?.partName || ('配件#' + id); }

async function fetchParts() { const res = await request.get('/api/part/all'); partList.value = res.data || []; }

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size };
  if (search.status !== null && search.status !== '') params.status = search.status;
  const res = await request.get('/api/purchase-request', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog() { Object.assign(form, { partId: null, qty: 1, detail: '', reason: '' }); dialogVisible.value = true; }

async function handleSave() {
  await request.post('/api/purchase-request', { ...form });
  ElMessage.success('新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleStatus(id: number, status: number) {
  await request.put(`/api/purchase-request/${id}/status?status=${status}`);
  ElMessage.success(status === 1 ? '已转采购' : '已拒绝');
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/purchase-request/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => { fetchParts(); fetchData(); });
</script>
