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

// H5 客户与员工是两套身份，必须用独立实例携带各自的 Token，避免同浏览器互相污染
const clientRequest = axios.create({
  timeout: 10000,
});

clientRequest.interceptors.request.use((config) => {
  const customer = getCustomer();
  if (customer?.token) {
    config.headers.Authorization = `Bearer ${customer.token}`;
  }
  return config;
});

clientRequest.interceptors.response.use(
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
      clearCustomer();
      ElMessage.warning('登录已失效，请重新登录');
      if (window.location.pathname !== '/h5/login') {
        window.location.href = '/h5/login';
      }
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

export const clientRegister = (data: any) => clientRequest.post('/api/client/register', data)
export const clientLogin = (data: any) => clientRequest.post('/api/client/login', data)
export const getMyOrders = () => clientRequest.get('/api/client/orders')
export const getOrderDetail = (id: number) => clientRequest.get(`/api/client/orders/${id}`)
export const getQuote = (workOrderId: number) => clientRequest.get(`/api/quote/work-order/${workOrderId}`)
export const confirmQuote = (id: number) => clientRequest.put(`/api/quote/${id}/confirm`)
export const rejectQuote = (id: number, remark?: string) => clientRequest.put(`/api/quote/${id}/reject`, remark ? { remark } : {})
export const clientPay = (data: any) => clientRequest.post('/api/client/pay', data)
export const getVehicles = (customerId: number) => clientRequest.get(`/api/vehicle/customer/${customerId}`)
export const addVehicle = (data: any) => clientRequest.post('/api/vehicle', data)
export const createWorkOrderApi = (data: any) => clientRequest.post('/api/work-order', data)

// ===== H5 配件商城 =====
export const getMallParts = (params?: any) => clientRequest.get('/api/client/parts', { params })
export const getMallCategories = () => clientRequest.get('/api/client/part-categories')
export const createClientSalesOrder = (data: any) => clientRequest.post('/api/client/sales-order', data)
export const getMySalesOrders = () => clientRequest.get('/api/client/sales-orders')
export const getMySalesOrderDetail = (id: number) => clientRequest.get(`/api/client/sales-orders/${id}`)
export const payClientSalesOrder = (id: number, paymentMethod: number) =>
  clientRequest.post(`/api/client/sales-orders/${id}/pay`, { paymentMethod })

export default request;
