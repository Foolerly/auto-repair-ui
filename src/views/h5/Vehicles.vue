<template>
  <div class="h5-page">
    <div class="h5-shell">
      <header class="h5-header">
        <button class="h5-back" @click="$router.back()"><el-icon><ArrowLeft /></el-icon>返回</button>
        <span class="h5-header-title">我的车辆</span>
        <button class="h5-btn-icon" @click="showAdd = true"><el-icon :size="17"><Plus /></el-icon></button>
      </header>

      <div v-if="loading" class="auto-empty">加载中...</div>
      <div v-else-if="vehicles.length === 0" class="auto-empty">
        <p>还没有车辆档案</p>
        <el-button type="primary" round @click="showAdd = true">添加第一辆车</el-button>
      </div>
      <div v-else class="vehicle-list">
        <div class="vehicle-item" v-for="v in vehicles" :key="v.id">
          <div class="vehicle-main">
            <div class="vehicle-plate">{{ v.plateNumber }}</div>
            <div class="vehicle-meta">
              <p>{{ [v.brand, v.model].filter(Boolean).join(' ') || '未填写车型' }}</p>
              <span>里程 {{ v.mileage != null ? v.mileage + ' km' : '未记录' }}</span>
            </div>
          </div>
          <el-button type="primary" plain size="small" @click="selectVehicle(v)">预约维修</el-button>
        </div>
      </div>

      <el-dialog v-model="showAdd" title="添加车辆" width="90%">
        <el-form :model="form" label-width="82px">
          <el-form-item label="车牌号"><el-input v-model="form.plateNumber" placeholder="如 京A12345" /></el-form-item>
          <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
          <el-form-item label="车型"><el-input v-model="form.model" /></el-form-item>
          <el-form-item label="里程(km)"><el-input-number v-model="form.mileage" :min="0" style="width:100%" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAdd = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleAdd">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { addVehicle, getCustomer, getVehicles } from '../../api';

const router = useRouter();
const customer = ref(getCustomer());
const vehicles = ref<any[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const saving = ref(false);
const form = ref({ plateNumber: '', brand: '', model: '', mileage: 0 });

const refresh = async () => {
  if (!customer.value) return;
  loading.value = true;
  try {
    const res = await getVehicles(customer.value.customerId);
    vehicles.value = res.data || [];
  } catch {
    // 忽略加载失败
  } finally {
    loading.value = false;
  }
};

const selectVehicle = (v: any) => {
  router.push({ path: '/h5/create-order', query: { vehicleId: v.id, plateNumber: v.plateNumber } });
};

const handleAdd = async () => {
  if (!form.value.plateNumber) {
    ElMessage.warning('请输入车牌号');
    return;
  }
  saving.value = true;
  try {
    await addVehicle({ ...form.value, customerId: customer.value.customerId });
    ElMessage.success('添加成功');
    showAdd.value = false;
    form.value = { plateNumber: '', brand: '', model: '', mileage: 0 };
    await refresh();
  } catch {
    // 错误已提示
  } finally {
    saving.value = false;
  }
};

onMounted(refresh);
</script>

<style scoped>
.auto-empty {
  margin: 80px 24px;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-2);
  font-size: 14px;
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 10px;
}
.auto-empty p { margin-bottom: 16px; }

.vehicle-list { padding: 14px; }
.vehicle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.vehicle-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.vehicle-plate {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--brand);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.4);
  flex: none;
}
.vehicle-meta { min-width: 0; }
.vehicle-meta p {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vehicle-meta span { font-size: 12px; color: var(--text-2); }
</style>
