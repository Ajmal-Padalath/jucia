import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartExtra = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  id: string;
  foodItemId: string;
  name: string;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  spiceLevel?: "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";
  size?: string;
  selectedExtras?: CartExtra[];
  specialInstructions?: string;
};

type CartState = {
  items: CartItem[];
  tableId: string | null;
  tableNumber: number | null;
  couponCode: string | null;
  discount: number;
  setTable: (tableId: string, tableNumber: number) => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  setCoupon: (code: string | null, discount: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
};

function itemKey(item: Omit<CartItem, "id" | "quantity">) {
  return JSON.stringify({
    foodItemId: item.foodItemId,
    spiceLevel: item.spiceLevel,
    size: item.size,
    selectedExtras: item.selectedExtras,
    specialInstructions: item.specialInstructions,
  });
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      tableNumber: null,
      couponCode: null,
      discount: 0,
      setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),
      addItem: (item) => {
        const items = get().items;
        const key = itemKey(item);
        const existing = items.find((i) => itemKey(i) === key);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, id: crypto.randomUUID() }],
          });
        }
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        });
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setCoupon: (code, discount) => set({ couponCode: code, discount }),
      clearCart: () =>
        set({ items: [], couponCode: null, discount: 0 }),
      subtotal: () =>
        get().items.reduce((sum, item) => {
          const extras =
            item.selectedExtras?.reduce((e, x) => e + x.price, 0) ?? 0;
          return sum + (item.unitPrice + extras) * item.quantity;
        }, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "restaurant-cart" }
  )
);
