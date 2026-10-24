import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const savedToken = localStorage.getItem('token') || '';
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  })();

  const token = ref(savedToken);
  const userInfo = ref<any>(savedUser);

  function login(data: any) {
    userInfo.value = data;
    token.value = data.token || '';
    if (token.value) {
      localStorage.setItem('token', token.value);
      localStorage.setItem('userInfo', JSON.stringify({ id: data.id, username: data.username, realName: data.realName }));
    }
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }

  return { token, userInfo, login, logout };
});
