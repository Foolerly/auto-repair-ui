<template>
  <div class="h5-page">
    <el-header style="display:flex;align-items:center;background:#fff;border-bottom:1px solid #e6e6e6">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h4 style="margin-left:8px">工单详情</h4>
    </el-header>
    <el-main>
      <el-card v-if="order" style="max-width:700px;margin:0 auto">
        <el-steps :active="activeStep" finish-status="success" style="margin-bottom:20px">
          <el-step title="接单" />
          <el-step title="诊断" />
          <el-step title="报价" />
          <el-step title="维修" />
          <el-step title="结算" />
          <el-step title="完成" />
        </el-steps>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="order.workOrderStatus === 6 ? 'success' : order.workOrderStatus === 7 ? 'danger' : 'warning'">
              {{ statusTag(order.workOrderStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障描述" :span="2">{{ order.faultDescription || '无' }}</el-descriptions-item>
          <el-descriptions-item label="诊断结果" :span="2" v-if="order.diagnosis">{{ order.diagnosis }}</el-descriptions-item>
          <el-descriptions-item label="维修内容" :span="2" v-if="order.repairContent">{{ order.repairContent }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(order.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ order.totalAmount || quote?.totalAmount || 0 }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="order.parts && order.parts.length > 0" style="margin-top:16px">
          <h4>领用配件</h4>
          <el-table :data="order.parts" border size="small">
            <el-table-column prop="partId" label="配件ID" width="80" />
            <el-table-column prop="qty" label="数量" width="80" />
            <el-table-column prop="unitPrice" label="单价" width="100" />
            <el-table-column prop="totalPrice" label="小计" />
          </el-table>
        </div>

        <div v-if="quote && quote.quoteStatus === 0" style="margin-top:16px">
          <el-alert title="您有一份待确认的报价单" type="warning" show-icon :closable="false" />
          <el-button type="warning" style="margin-top:8px" @click="$router.push(`/h5/quote/${order.id}`)">查看报价</el-button>
        </div>

        <div v-if="order.workOrderStatus === 5" style="margin-top:16px;text-align:center">
          <el-button type="danger" size="large" @click="$router.push(`/h5/payment/${order.id}`)">去付款 ¥{{ order.totalAmount }}</el-button>
        </div>

        <div v-if="order.workOrderStatus === 6" style="margin-top:16px">
          <el-result icon="success" title="工单已完成" sub-title="感谢您的惠顾" />
        </div>
      </el-card>
      <el-skeleton v-else :rows="6" animated style="max-width:700px;margin:0 auto" />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderDetail } from '../../api'

const route = useRoute()
const order = ref<any>(null)
const quote = ref<any>(null)

const statusMap: Record<number, string> = { 0:'待诊断', 1:'诊断中', 2:'待确认', 3:'待维修', 4:'维修中', 5:'待结算', 6:'已完成', 7:'已取消' }
const statusTag = (s: number) => statusMap[s] || '未知'
const formatTime = (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-'
const activeStep = computed(() => order.value?.workOrderStatus === 7 ? -1 : (order.value?.workOrderStatus || 0))

onMounted(async () => {
  try {
    const res = await getOrderDetail(Number(route.params.id))
    order.value = res.data.order
    quote.value = res.data.quote
  } catch { /* ignore */ }
})
</script>

<style scoped>.h5-page { min-height:100vh; background:#f5f7fa; }</style>
