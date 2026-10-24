<template>
  <div>
    <el-form :inline="true">
      <el-form-item><el-input-number v-model="search.partId" placeholder="配件ID" :controls="false" /></el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
    </el-form>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="配件" width="180">
        <template #default="{row}">{{ partName(row.partId) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="{row}">{{ typeLabel(row.changeType) }}</template>
      </el-table-column>
      <el-table-column prop="changeQty" label="变动" width="80">
        <template #default="{row}">{{ row.changeQty > 0 ? '+' + row.changeQty : row.changeQty }}</template>
      </el-table-column>
      <el-table-column prop="beforeQty" label="变动前" width="80" />
      <el-table-column prop="afterQty" label="变动后" width="80" />
      <el-table-column prop="relatedNo" label="关联单号" width="160" />
      <el-table-column prop="createTime" label="时间" width="170" />
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../api';

const search = reactive<any>({ page: 1, size: 10, partId: null });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const partMap = ref<any>({});

const types = ['', '采购入库', '领料出库', '退料入库', '采购退货出库', '盘盈', '盘亏', '损耗'];
function typeLabel(t: number) { return types[t] || t; }
function partName(id: number) { return partMap.value[id] || ('配件#' + id); }

async function fetchParts() {
  const res = await request.get('/api/part/all');
  const map: any = {};
  (res.data || []).forEach((p: any) => { map[p.id] = p.partName; });
  partMap.value = map;
}

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size };
  if (search.partId) params.partId = search.partId;
  const res = await request.get('/api/stock-flow', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

onMounted(() => { fetchParts(); fetchData(); });
</script>