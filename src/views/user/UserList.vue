<template>
  <div>
    <el-form :inline="true" :model="search">
      <el-form-item><el-input v-model="search.keyword" placeholder="用户名/姓名/手机号" clearable /></el-form-item>
      <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
      <el-form-item><el-button type="success" @click="openDialog()">新增用户</el-button></el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="realName" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{row}">{{ row.status === 1 ? '启用' : '禁用' }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination style="margin-top:16px" background layout="total, sizes, prev, pager, next"
      :total="total" v-model:page-size="search.size" v-model:current-page="search.page" @change="fetchData" />

    <!-- 弹窗 -->
    <el-dialog :title="isEdit?'编辑用户':'新增用户'" v-model="dialogVisible" width="500px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.gender"><el-option label="未知" :value="0" /><el-option label="男" :value="1" /><el-option label="女" :value="2" /></el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="statusBool" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色" style="width:100%">
            <el-option v-for="r in roleList" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api';

const search = reactive({ page: 1, size: 10, keyword: '' });
const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();
const form = reactive<any>({ username:'', password:'123456', realName:'', phone:'', email:'', gender:0, status:1, roleIds: [] });
const rules = {
  username: [{ required: true, message: '必填' }],
  password: [{ required: true, message: '必填' }],
  realName: [{ required: true, message: '必填' }],
};
const roleList = ref<any[]>([]);

const statusBool = computed({
  get: () => form.status === 1,
  set: (v) => (form.status = v ? 1 : 0),
});

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/user', { params: search });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

async function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, row);
    form.roleIds = [];
    try {
      const res = await request.get(`/api/user-role/${row.id}`);
      form.roleIds = res.data || [];
    } catch { /* 忽略查询失败 */ }
  } else {
    form.roleIds = [];
  }
  dialogVisible.value = true;
}

function resetForm() {
  formRef.value?.resetFields();
  Object.assign(form, { username:'', password:'123456', realName:'', phone:'', email:'', gender:0, status:1, roleIds: [] });
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  let userId: number | null = form.id || null;
  if (isEdit.value) {
    await request.put('/api/user', { ...form });
  } else {
    const res = await request.post('/api/user', { ...form });
    userId = res.data;
  }
  if (userId != null) {
    await request.post('/api/user-role', { userId, roleIds: form.roleIds || [] });
  }
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/user/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

async function fetchRoles() {
  const res = await request.get('/api/role/all');
  roleList.value = res.data || [];
}

onMounted(() => { fetchData(); fetchRoles(); });
</script>
