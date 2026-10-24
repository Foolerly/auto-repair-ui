<template>
  <div class="h5-page">
    <el-header style="display:flex;align-items:center;background:#fff;border-bottom:1px solid #e6e6e6">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h4 style="margin-left:8px">报价确认</h4>
    </el-header>
    <el-main>
      <el-card v-if="quote" style="max-width:600px;margin:0 auto">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="工时费">¥{{ quote.laborFee }}</el-descriptions-item>
          <el-descriptions-item label="配件费">¥{{ quote.partsFee }}</el-descriptions-item>
          <el-descriptions-item label="总金额"><span style="font-size:20px;font-weight:bold;color:#f56c6c">¥{{ quote.totalAmount }}</span></el-descriptions-item>
          <el-descriptions-item label="备注">{{ quote.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:20px;text-align:center">
          <el-button type="success" size="large" @click="handleConfirm" :loading="loading">确认报价</el-button>
          <el-button type="danger" size="large" @click="handleReject" :loading="loading">拒绝</el-button>
        </div>
      </el-card>
      <el-skeleton v-else :rows="4" animated style="max-width:600px;margin:0 auto" />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getQuote, confirmQuote, rejectQuote } from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const quote = ref<any>(null)
const loading = ref(false)

onMounted(async () => {
  try {
    const res = await getQuote(Number(route.params.workOrderId))
    quote.value = res.data
  } catch { /* ignore */ }
})

const handleConfirm = async () => {
  loading.value = true
  try {
    await confirmQuote(quote.value.id)
    ElMessage.success('已确认报价')
    router.back()
  } catch { /* ignore */ } finally { loading.value = false }
}

const handleReject = () => {
  ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝报价', { confirmButtonText: '确认拒绝' }).then(async ({ value }) => {
    loading.value = true
    try {
      await rejectQuote(quote.value.id, value)
      ElMessage.success('已拒绝报价')
      router.back()
    } catch { /* ignore */ } finally { loading.value = false }
  }).catch(() => {})
}
</script>

<style scoped>.h5-page { min-height:100vh; background:#f5f7fa; }</style>
