<template>
  <div>
    <el-button type="success" @click="openDialog()" style="margin-bottom:12px">新增角色</el-button>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="roleName" label="角色名称" width="140" />
      <el-table-column prop="roleCode" label="角色编码" width="160" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="isEdit?'编辑角色':'新增角色'" v-model="dialogVisible" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required><el-input v-model="form.roleName" /></el-form-item>
        <el-form-item label="编码" required><el-input v-model="form.roleCode" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" /></el-form-item>
        <el-form-item label="权限">
          <el-tree
            ref="permTreeRef"
            :data="permTree"
            show-checkbox
            node-key="id"
            :props="{ label: 'permName', children: 'children' }"
            style="max-height:280px;overflow:auto;width:100%"
          />
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api';

const tableData = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<any>({ id: undefined, roleName:'', roleCode:'', description:'' });
const permTree = ref<any[]>([]);
const permTreeRef = ref();

async function fetchData() {
  loading.value = true;
  const res = await request.get('/api/role/all');
  tableData.value = res.data;
  loading.value = false;
}

async function fetchPermTree() {
  const res = await request.get('/api/permission/tree');
  permTree.value = res.data || [];
}

async function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, row);
  } else {
    Object.assign(form, { id: undefined, roleName:'', roleCode:'', description:'' });
  }
  dialogVisible.value = true;
  await nextTick();
  permTreeRef.value?.setCheckedKeys([]);
  if (row) {
    try {
      const res = await request.get(`/api/role-permission/${row.id}`);
      permTreeRef.value?.setCheckedKeys(res.data || []);
    } catch { /* 忽略查询失败 */ }
  }
}

async function handleSave() {
  let roleId: number | null = form.id || null;
  if (isEdit.value) {
    await request.put('/api/role', { ...form });
  } else {
    const res = await request.post('/api/role', { ...form });
    roleId = res.data;
  }
  if (roleId != null) {
    const checked = permTreeRef.value?.getCheckedKeys() || [];
    const half = permTreeRef.value?.getHalfCheckedKeys() || [];
    await request.post('/api/role-permission', { roleId, permIds: [...checked, ...half] });
  }
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/role/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => { fetchData(); fetchPermTree(); });
</script>