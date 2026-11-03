import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface MallCartItem {
  partId: number;
  partName: string;
  unitPrice: number;
  qty: number;
}

/**
 * 客户商城购物车。刻意与员工端"采购车"(stores/cart.ts) 分开，避免两端串味。
 * 注意：这里存的单价只用于展示，真正下单价格由服务端按客户类型解析。
 */
export const useMallCartStore = defineStore('mallCart', () => {
  const items = ref<MallCartItem[]>([]);

  function add(item: MallCartItem) {
    const exist = items.value.find(i => i.partId === item.partId);
    if (exist) exist.qty += item.qty;
    else items.value.push({ ...item });
  }

  function remove(partId: number) {
    items.value = items.value.filter(i => i.partId !== partId);
  }

  function clear() {
    items.value = [];
  }

  const count = computed(() => items.value.reduce((s, i) => s + i.qty, 0));
  const totalPrice = computed(() => items.value.reduce((s, i) => s + i.unitPrice * i.qty, 0));

  return { items, add, remove, clear, count, totalPrice };
});
