<template>
  <div class="h5-page">
    <el-header style="display:flex;align-items:center;background:#fff;border-bottom:1px solid #e6e6e6">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h4 style="margin-left:8px">付款</h4>
    </el-header>
    <el-main>
      <el-card v-if="order" style="max-width:500px;margin:0 auto;text-align:center">
        <h3>工单号：{{ order.orderNo }}</h3>
        <p style="font-size:32px;font-weight:bold;color:#f56c6c;margin:20px 0">¥{{ amount }}</p>

        <el-radio-group v-model="paymentMethod" style="margin-bottom:20px">
          <el-radio :value="2">微信支付</el-radio>
          <el-radio :value="3">支付宝</el-radio>
          <el-radio :value="1">现金</el-radio>
        </el-radio-group>

        <el-button type="danger" size="large" @click="handlePay" :loading="loading" style="width:100%">
          确认支付 ¥{{ amount }}
        </el-button>
      </el-card>
      <el-skeleton v-else :rows="3" animated style="max-width:500px;margin:0 auto" />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail } from '../../api'
import api from '../../api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const order = ref<any>(null)
const amount = ref(0)
const paymentMethod = ref(2)
const loading = ref(false)

onMounted(async () => {
  try {
    const res = await getOrderDetail(Number(route.params.id))
    order.value = res.data.order
    const quote = res.data.quote
    amount.value = order.value.totalAmount || quote?.totalAmount || 0
  } catch { ElMessage.error('加载失败') }
})

const handlePay = async () => {
  loading.value = true
  try {
    await api.post('/api/client/pay', {
      workOrderId: order.value.id,
      paymentMethod: paymentMethod.value
    })
    ElMessage.success('支付成功')
    setTimeout(() => router.push({ path: '/h5/order/' + order.value.id }), 1000)
  } catch { /* ignore */ } finally { loading.value = false }
}
</script>

<style scoped>.h5-page { min-height:100vh; background:#f5f7fa; }</style>
