<template>
  <div class="h5-page">
    <el-header style="display:flex;align-items:center;background:#fff;border-bottom:1px solid #e6e6e6">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h4 style="margin-left:8px">预约维修</h4>
    </el-header>
    <el-main>
      <el-card style="max-width:600px;margin:0 auto">
        <el-form :model="form" label-width="100px">
          <el-form-item label="选择车辆">
            <el-select v-model="selectedPlate" placeholder="请选择车辆" @change="onVehicleChange" style="width:100%">
              <el-option v-for="v in vehicles" :key="v.id" :label="`${v.plateNumber} ${v.brand || ''} ${v.model || ''}`" :value="v.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="故障描述">
            <el-input v-model="form.faultDescription" type="textarea" :rows="4" placeholder="请描述车辆故障现象" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" placeholder="其他补充信息" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading" style="width:100%">提交预约</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getVehicles, createWorkOrderApi, getCustomer } from '../../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const customer = ref(getCustomer())
const vehicles = ref<any[]>([])
const selectedVehicleId = ref<number | null>(null)
const selectedPlate = ref('')
const loading = ref(false)
const form = ref({ faultDescription: '', remark: '' })

onMounted(async () => {
  if (route.query.vehicleId) {
    selectedVehicleId.value = Number(route.query.vehicleId)
    selectedPlate.value = String(route.query.plateNumber || '')
  }
  try {
    const res = await getVehicles(customer.value.customerId)
    vehicles.value = res.data || []
  } catch { /* ignore */ }
})

const onVehicleChange = (id: number) => {
  const v = vehicles.value.find((x: any) => x.id === id)
  if (v) selectedPlate.value = v.plateNumber
}

const handleSubmit = async () => {
  if (!selectedVehicleId.value) { ElMessage.warning('请选择车辆'); return }
  if (!form.value.faultDescription) { ElMessage.warning('请输入故障描述'); return }
  loading.value = true
  try {
    await createWorkOrderApi({
      vehicleId: selectedVehicleId.value,
      faultDescription: form.value.faultDescription,
      remark: form.value.remark,
    })
    ElMessage.success('预约提交成功')
    router.push('/h5/home')
  } catch { /* ignore */ } finally { loading.value = false }
}
</script>

<style scoped>.h5-page { min-height:100vh; background:#f5f7fa; }</style>
