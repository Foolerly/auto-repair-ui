<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item><el-input v-model="search.keyword" placeholder="客户姓名/电话" clearable /></el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增客户</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="memberLevel" label="会员" width="80">
        <template #default="{row}">{{ ['普通','银卡','金卡','钻石'][row.memberLevel] }}</template>
      </el-table-column>
      <el-table-column prop="totalPoints" label="积分" width="80" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" background layout="total,prev,pager,next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <el-dialog :title="isEdit?'编辑客户':'新增客户'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="form.memberLevel"><el-option label="普通" :value="0" /><el-option label="银卡" :value="1" /><el-option label="金卡" :value="2" /><el-option label="钻石" :value="3" /></el-select>
        </el-form-item>
        <el-form-item label="积分"><el-input-number v-model="form.totalPoints" /></el-form-item>
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
const form = reactive({ name:'', phone:'', address:'', memberLevel:0, totalPoints:0, remark:'' });

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/customer', { params: search });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) Object.assign(form, row); else Object.assign(form, { name:'', phone:'', address:'', memberLevel:0, totalPoints:0, remark:'' });
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/customer', { ...form });
  else await request.post('/api/customer', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/customer/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(fetchData);
</script>
