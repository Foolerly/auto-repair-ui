<template>
  <div>
    <el-form :inline="true">
      <el-form-item><el-date-picker v-model="startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" /></el-form-item>
      <el-form-item><el-date-picker v-model="endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" /></el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">查询</el-button></el-form-item>
    </el-form>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6" v-for="c in cards" :key="c.title">
        <el-card shadow="hover"><p style="color:#909399">{{ c.title }}</p><p style="font-size:24px;font-weight:bold;color:#409eff">¥{{ c.value }}</p></el-card>
      </el-col>
    </el-row>

    <el-table :data="suppliers" border stripe>
      <el-table-column prop="supplierName" label="供应商" />
      <el-table-column prop="contactPerson" label="联系人" width="120" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column prop="debtAmount" label="应付欠款" width="120" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../api';

const startDate = ref('');
const endDate = ref('');
const cards = reactive([
  { title: '采购总额', value: 0 },
  { title: '退货总额', value: 0 },
  { title: '净采购额', value: 0 },
  { title: '供应商欠款', value: 0 },
]);
const suppliers = ref<any[]>([]);

async function fetchData() {
  const params: any = {};
  if (startDate.value) params.startDate = startDate.value;
  if (endDate.value) params.endDate = endDate.value;
  const res = await request.get('/api/purchase-reconciliation', { params });
  cards[0].value = Number(res.data.purchaseTotal || 0);
  cards[1].value = Number(res.data.returnTotal || 0);
  cards[2].value = Number(res.data.netTotal || 0);
  cards[3].value = Number(res.data.debtTotal || 0);
  suppliers.value = res.data.suppliers || [];
}

onMounted(fetchData);
</script>