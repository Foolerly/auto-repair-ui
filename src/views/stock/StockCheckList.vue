<template>
  <div>
    <el-form :inline="true">
      <el-form-item><el-button type="success" @click="handleStart">新建盘点</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="checkNo" label="盘点单号" width="180" />
      <el-table-column label="状态" width="90"><template #default="{row}">{{ ['盘点中','已完成'][row.checkStatus] }}</template></el-table-column>
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDetail(row)">盘点</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog title="库存盘点" v-model="detailVisible" width="640px">
      <el-table :data="items" border size="small">
        <el-table-column label="配件" width="200"><template #default="{row}">{{ partName(row.partId) }}</template></el-table-column>
        <el-table-column prop="bookQty" label="账面" width="80" />
        <el-table-column label="实盘" width="120">
          <template #default="{row}"><el-input-number v-model="row.actualQty" :min="0" size="small" :disabled="checkStatus===1" /></template>
        </el-table-column>
        <el-table-column label="差异" width="80">
          <template #default="{row}">{{ (row.actualQty || 0) - row.bookQty }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailVisible=false">取消</el-button>
        <el-button v-if="checkStatus!==1" type="primary" @click="handleComplete">完成盘点</el-button>
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
const detailVisible = ref(false);
const items = ref<any[]>([]);
const checkId = ref<number | null>(null);
const checkStatus = ref(0);
const partMap = ref<any>({});

function partName(id: number) { return partMap.value[id] || ('#' + id); }

async function fetchParts() {
  const res = await request.get('/api/part/all');
  const m: any = {};
  (res.data || []).forEach((p: any) => { m[p.id] = p.partName; });
  partMap.value = m;
}

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/stock-check', { params: search });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

async function handleStart() {
  await ElMessageBox.confirm('新建盘点将快照所有配件当前账面库存。', '提示', { type: 'info' });
  const res = await request.post('/api/stock-check/start');
  ElMessage.success('盘点单已创建');
  fetchData();
  openDetail({ id: res.data });
}

async function openDetail(row: any) {
  const res = await request.get(`/api/stock-check/${row.id}`);
  checkId.value = row.id;
  checkStatus.value = res.data.checkStatus;
  items.value = res.data.items || [];
  detailVisible.value = true;
}

async function handleComplete() {
  await ElMessageBox.confirm('确认完成盘点？有差异的配件将自动调整库存。', '提示', { type: 'info' });
  const body = { items: items.value.map(i => ({ id: i.id, actualQty: i.actualQty })) };
  await request.put(`/api/stock-check/${checkId.value}/complete`, body);
  ElMessage.success('盘点完成');
  detailVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/stock-check/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => { fetchParts(); fetchData(); });
</script>