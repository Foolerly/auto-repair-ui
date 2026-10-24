import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface CartItem {
  partId: number;
  partName: string;
  unitPrice: number;
  qty: number;
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);

  function add(item: CartItem) {
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