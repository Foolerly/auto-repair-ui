<template>
  <div class="part-layout">
    <aside class="part-cats">
      <button type="button" class="cat-item" :class="{ active: selectedCategory === null }" @click="selectCategory(null)">
        <el-icon><Goods /></el-icon>
        <span>全部配件</span>
      </button>
      <template v-for="top in topCategories" :key="top.id">
        <button type="button" class="cat-item" :class="{ active: selectedCategory === top.id }" @click="selectCategory(top.id)">
          <el-icon><Collection /></el-icon>
          <span>{{ top.categoryName }}</span>
        </button>
        <button
          v-for="child in childrenOf(top.id)"
          :key="child.id"
          type="button"
          class="cat-item child"
          :class="{ active: selectedCategory === child.id }"
          @click="selectCategory(child.id)"
        >
          {{ child.categoryName }}
        </button>
      </template>
    </aside>

    <section class="part-content">
      <el-form :inline="true" :model="search">
        <el-form-item><el-input v-model="search.keyword" placeholder="配件名称/规格" clearable @keyup.enter="fetchData" /></el-form-item>
        <el-form-item><el-button type="primary" @click="fetchData">搜索</el-button></el-form-item>
        <el-form-item><el-button type="success" @click="openDialog()">新增配件</el-button></el-form-item>
        <el-form-item><el-button type="warning" plain @click="fetchLowStock">库存预警</el-button></el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="partName" label="配件名称" min-width="140" />
        <el-table-column prop="spec" label="规格" width="110" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="categoryName(row.categoryId) !== '-'" size="small" effect="plain">{{ categoryName(row.categoryId) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="purchasePrice" label="进价" width="80" />
        <el-table-column prop="salePrice" label="售价" width="80" />
        <el-table-column label="库存" width="90">
          <template #default="{ row }">
            <span :class="{ 'stock-low': row.stockQty <= row.minStockQty }">{{ row.stockQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="minStockQty" label="预警值" width="70" />
        <el-table-column prop="origin" label="产地" width="90" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:16px"
        background
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:page-size="search.size"
        v-model:current-page="search.page"
        @change="fetchData"
      />

      <el-dialog :title="isEdit ? '编辑配件' : '新增配件'" v-model="dialogVisible" width="550px">
        <el-form :model="form" label-width="80px">
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="名称" required><el-input v-model="form.partName" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="规格"><el-input v-model="form.spec" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item label="分类"><el-select v-model="form.categoryId" clearable placeholder="选择分类" style="width:100%"><el-option v-for="c in categories" :key="c.id" :label="categoryOptionLabel(c)" :value="c.id" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="进价"><el-input-number v-model="form.purchasePrice" :precision="2" :min="0" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="售价"><el-input-number v-model="form.salePrice" :precision="2" :min="0" style="width:100%" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item label="库存"><el-input-number v-model="form.stockQty" :min="0" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="预警值"><el-input-number v-model="form.minStockQty" :min="0" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="产地"><el-input v-model="form.origin" /></el-form-item>
          <el-form-item label="适配车型">
            <el-select v-model="form.vehicleModelIds" multiple filterable placeholder="选择适配车型" style="width:100%">
              <el-option v-for="m in modelList" :key="m.id" :label="[m.brand, m.series, m.modelYear].filter(Boolean).join(' ')" :value="m.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </template>
      </el-dialog>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api';

const search = reactive({ page: 1, size: 10, keyword: '' });
const tableData = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<any>({ partName: '', spec: '', unit: '个', categoryId: null, purchasePrice: 0, salePrice: 0, stockQty: 0, minStockQty: 10, origin: '', suitableModels: '', remark: '', vehicleModelIds: [] });
const modelList = ref<any[]>([]);

const categories = ref<any[]>([]);
const selectedCategory = ref<number | null>(null);
const topCategories = computed(() => categories.value.filter((c: any) => c.parentId === 0));
const childrenOf = (id: number) => categories.value.filter((c: any) => c.parentId === id);
const categoryName = (id: number | null | undefined) => {
  const c = categories.value.find((x: any) => x.id === id);
  return c ? c.categoryName : '-';
};
const categoryOptionLabel = (c: any) => {
  if (c.parentId === 0) return c.categoryName;
  const parent = categories.value.find((x: any) => x.id === c.parentId);
  return parent ? `${parent.categoryName} / ${c.categoryName}` : c.categoryName;
};

function selectCategory(id: number | null) {
  selectedCategory.value = id;
  search.page = 1;
  fetchData();
}

async function fetchData() {
  loading.value = true;
  const params: any = { page: search.page, size: search.size, keyword: search.keyword || undefined };
  if (selectedCategory.value != null) params.categoryId = selectedCategory.value;
  const res = await request.get('/api/part', { params });
  tableData.value = res.data.records;
  total.value = res.data.total;
  loading.value = false;
}

async function fetchLowStock() {
  selectedCategory.value = null;
  search.page = 1;
  loading.value = true;
  const res = await request.get('/api/part/low-stock');
  tableData.value = res.data;
  total.value = res.data.length;
  loading.value = false;
}

async function openDialog(row?: any) {
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, row);
    form.vehicleModelIds = [];
    try {
      const res = await request.get(`/api/part/${row.id}`);
      form.vehicleModelIds = res.data?.vehicleModelIds || [];
    } catch {
      // 忽略
    }
  } else {
    Object.assign(form, { partName: '', spec: '', unit: '个', categoryId: null, purchasePrice: 0, salePrice: 0, stockQty: 0, minStockQty: 10, origin: '', suitableModels: '', remark: '', vehicleModelIds: [] });
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (isEdit.value) await request.put('/api/part', { ...form });
  else await request.post('/api/part', { ...form });
  ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
  await request.delete(`/api/part/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

async function fetchModels() {
  const res = await request.get('/api/vehicle-model/all');
  modelList.value = res.data || [];
}

async function fetchCategories() {
  const res = await request.get('/api/part-category/all');
  categories.value = res.data || [];
}

onMounted(() => {
  fetchData();
  fetchModels();
  fetchCategories();
});
</script>

<style scoped>
.part-layout {
  display: flex;
  align-items: flex-start;
  gap: 22px;
}

.part-cats {
  width: 188px;
  flex: none;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.cat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  margin-bottom: 2px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  color: var(--text-2);
  text-align: left;
  cursor: pointer;
}
.cat-item .el-icon { color: #94a3b8; }
.cat-item:hover { background: #eef3f5; color: var(--text-1); }
.cat-item.active {
  background: var(--brand);
  color: #fff;
  font-weight: 600;
}
.cat-item.active .el-icon { color: #fff; }
.cat-item.child {
  padding-left: 34px;
  font-size: 12px;
}

.part-content {
  flex: 1;
  min-width: 0;
}

.stock-low {
  color: #dc2626;
  font-weight: 600;
}
</style>
