import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  timeout: 10000,
});

// 请求拦截器：自动附加 JWT Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => {
    const data = res.data;
    if (data.code !== 200) {
      ElMessage.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
      return Promise.reject(err);
    }
    if (err.response?.status === 403) {
      ElMessage.error('没有操作权限');
      return Promise.reject(err);
    }
    ElMessage.error('网络错误：' + err.message);
    return Promise.reject(err);
  }
);

/** 登录 */
export function loginApi(username: string, password: string) {
  return request.post<any, { code: number; message: string; data: any }>('/api/auth/login', { username, password });
}

// ===== H5 客户端 API =====

export function getCustomer() {
  const raw = sessionStorage.getItem('customer')
  if (!raw || raw === 'undefined') return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setCustomer(c: any) {
  sessionStorage.setItem('customer', JSON.stringify(c))
}

export function clearCustomer() {
  sessionStorage.removeItem('customer')
}

export const clientRegister = (data: any) => request.post('/api/client/register', data)
export const clientLogin = (data: any) => request.post('/api/client/login', data)
export const getMyOrders = () => request.get('/api/client/orders')
export const getOrderDetail = (id: number) => request.get(`/api/client/orders/${id}`)
export const getQuote = (workOrderId: number) => request.get(`/api/quote/work-order/${workOrderId}`)
export const confirmQuote = (id: number) => request.put(`/api/quote/${id}/confirm`)
export const rejectQuote = (id: number, remark?: string) => request.put(`/api/quote/${id}/reject`, remark ? { remark } : {})
export const clientPay = (data: any) => request.post('/api/client/pay', data)
export const getVehicles = (customerId: number) => request.get(`/api/vehicle/customer/${customerId}`)
export const addVehicle = (data: any) => request.post('/api/vehicle', data)
export const createWorkOrderApi = (data: any) => request.post('/api/work-order', data)

export default request;
