<template>
  <div class="h5-page">
    <div class="h5-shell login-shell">
      <div class="login-hero">
        <div class="login-logo"><el-icon :size="28"><Tools /></el-icon></div>
        <h1>汽修管家</h1>
        <p>预约维修 · 报价确认 · 在线支付</p>
      </div>

      <div class="login-box">
        <div class="login-tabs">
          <button type="button" :class="{ active: !showRegister }" @click="showRegister = false">登录</button>
          <button type="button" :class="{ active: showRegister }" @click="showRegister = true">注册</button>
        </div>

        <el-form v-if="!showRegister" label-width="0" @submit.prevent>
          <el-form-item>
            <el-input v-model="phone" placeholder="请输入手机号" size="large" maxlength="11" :prefix-icon="Phone" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="password" type="password" placeholder="请输入密码" size="large" show-password :prefix-icon="Lock" @keyup.enter="handleLogin" />
          </el-form-item>
          <el-button type="primary" size="large" class="login-submit" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form>

        <el-form v-else label-width="0">
          <el-form-item>
            <el-input v-model="regPhone" placeholder="手机号" size="large" maxlength="11" :prefix-icon="Phone" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="regName" placeholder="姓名" size="large" :prefix-icon="User" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="regPassword" type="password" placeholder="设置密码（至少6位）" size="large" show-password :prefix-icon="Lock" />
          </el-form-item>
          <el-button type="primary" size="large" class="login-submit" :loading="regLoading" @click="handleRegister">注 册</el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, Phone, User } from '@element-plus/icons-vue';
import { clientLogin, clientRegister, setCustomer } from '../../api';

const router = useRouter();
const phone = ref('');
const password = ref('');
const loading = ref(false);
const showRegister = ref(false);
const regPhone = ref('');
const regName = ref('');
const regPassword = ref('');
const regLoading = ref(false);

const handleLogin = async () => {
  if (!phone.value || !password.value) {
    ElMessage.warning('请输入手机号和密码');
    return;
  }
  loading.value = true;
  try {
    const res = await clientLogin({ phone: phone.value, password: password.value });
    setCustomer(res.data);
    ElMessage.success('登录成功');
    router.push('/h5/home');
  } catch {
    // 错误信息已在拦截器中提示
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  if (!regPhone.value || !regName.value || !regPassword.value) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  if (regPassword.value.length < 6) {
    ElMessage.warning('密码至少6位');
    return;
  }
  regLoading.value = true;
  try {
    const res = await clientRegister({ phone: regPhone.value, password: regPassword.value, name: regName.value });
    setCustomer(res.data);
    ElMessage.success('注册成功');
    router.push('/h5/home');
  } catch {
    // 错误信息已在拦截器中提示
  } finally {
    regLoading.value = false;
  }
};
</script>

<style scoped>
.login-shell { padding-bottom: 40px; }

.login-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 58px 20px 34px;
  background: #1b2c33;
  color: #fff;
}

.login-logo {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--brand);
  color: #fff;
  margin-bottom: 20px;
}

.login-hero h1 { font-size: 24px; font-weight: 700; }
.login-hero p { font-size: 13px; color: #9db4bd; margin-top: 8px; }

.login-box {
  margin: -18px 16px 0;
  padding: 22px 20px 26px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid var(--line);
  position: relative;
}

.login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  background: #f2f5f7;
  border-radius: 8px;
  padding: 4px;
}
.login-tabs button {
  flex: 1;
  height: 38px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
}
.login-tabs button.active {
  background: #fff;
  color: var(--brand);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.login-submit {
  width: 100%;
  margin-top: 6px;
}
</style>
