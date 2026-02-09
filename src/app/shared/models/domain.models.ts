export type OrderStatus = 'pending' | 'preparing' | 'served' | 'paid';

export interface DiningTable {
  id: string;
  table_no: number;
  is_active: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface Order {
  id: string;
  table_id: string;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  qty: number;
  note?: string;
}
