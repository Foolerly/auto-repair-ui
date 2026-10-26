import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const savedToken = localStorage.getItem('token') || '';
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  })();

  const token = ref(savedToken);
  const userInfo = ref<any>(savedUser);
  const roles = computed<string[]>(() => userInfo.value?.roles ?? []);
  const permissions = computed<string[]>(() => userInfo.value?.permissions ?? []);

  function login(data: any) {
    userInfo.value = data;
    token.value = data.token || '';
    if (token.value) {
      localStorage.setItem('token', token.value);
      localStorage.setItem('userInfo', JSON.stringify({
        id: data.id,
        username: data.username,
        realName: data.realName,
        roles: data.roles ?? [],
        permissions: data.permissions ?? [],
      }));
    }
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }

  function hasRole(role: string) {
    return roles.value.includes(role);
  }

  function hasPermission(code?: string) {
    if (!code) return true;
    if (hasRole('ROLE_ADMIN')) return true;
    return permissions.value.includes(code);
  }

  return { token, userInfo, roles, permissions, login, logout, hasRole, hasPermission };
});
