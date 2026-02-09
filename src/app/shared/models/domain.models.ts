export type OrderStatus = 'pending' | 'preparing' | 'served' | 'paid';

export interface DiningTable {
  id: string;
  table_no: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  is_available: boolean;
  image_url?: string | null;
  created_at: string;
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
