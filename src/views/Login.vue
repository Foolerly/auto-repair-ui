<template>
  <div class="login-page">
    <div class="login-brand">
      <div class="brand-inner">
        <div class="brand-mark"><el-icon :size="30"><Tools /></el-icon></div>
        <h1>汽修管理系统</h1>
        <p class="brand-slogan">工单 · 配件 · 采购 · 收款，一站式门店管理</p>
        <ul class="brand-features">
          <li><el-icon><Document /></el-icon><span>维修工单全流程跟踪</span></li>
          <li><el-icon><Box /></el-icon><span>配件库存与采购闭环</span></li>
          <li><el-icon><Money /></el-icon><span>收款记录与营收统计</span></li>
        </ul>
      </div>
      <div class="brand-foot">AUTO REPAIR MANAGEMENT SYSTEM</div>
    </div>

    <div class="login-panel">
      <div class="login-card">
        <h2>欢迎登录</h2>
        <p class="login-sub">请使用门店账号登录管理系统</p>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="0" @submit.prevent>
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名" size="large" :prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" size="large" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
          </el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, User } from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';
import { loginApi } from '../api/index';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);

const form = reactive({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const res = await loginApi(form.username, form.password);
    userStore.login(res.data);
    ElMessage.success(res.message || '登录成功');
    router.push('/dashboard');
  } catch {
    // 错误信息已在拦截器中提示
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: #f4f6f8;
}

.login-brand {
  flex: 1.1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #1b2c33;
  color: #fff;
}

.brand-inner {
  position: relative;
  z-index: 1;
  width: 420px;
  max-width: calc(100% - 64px);
}

.brand-mark {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--brand);
  color: #fff;
  margin-bottom: 26px;
}

.brand-inner h1 {
  font-size: 34px;
  font-weight: 700;
  margin-bottom: 12px;
}

.brand-slogan {
  font-size: 15px;
  color: #9db4bd;
  margin-bottom: 42px;
}

.brand-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #d7e2e6;
}

.brand-features .el-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(13, 148, 136, 0.22);
  color: #5eead4;
}

.brand-foot {
  position: absolute;
  left: 44px;
  bottom: 34px;
  font-size: 11px;
  color: #5f727b;
  letter-spacing: 2px;
}

.login-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.login-card {
  width: 400px;
  max-width: 100%;
}

.login-card h2 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-sub {
  font-size: 14px;
  color: var(--text-2);
  margin-bottom: 30px;
}

.login-btn {
  width: 100%;
  margin-top: 6px;
}

@media (max-width: 900px) {
  .login-brand { display: none; }
}
</style>
