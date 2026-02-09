import { Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import { Order, OrderItem, OrderStatus } from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private ordersChannel?: RealtimeChannel;

  constructor(private readonly supabaseService: SupabaseService) {}

  async placeOrder(tableId: string, items: OrderItem[]): Promise<string> {
    const client = this.supabaseService.getClient();

    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({ table_id: tableId, status: 'pending' })
      .select('id')
      .single();

    if (orderError || !order) {
      throw orderError;
    }

    const { error: itemError } = await client
      .from('order_items')
      .insert(items.map((item) => ({ ...item, order_id: order.id })));

    if (itemError) {
      throw itemError;
    }

    return order.id;
  }

  async getOrders(): Promise<Order[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Order[];
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await this.supabaseService.getClient().from('orders').update({ status }).eq('id', orderId);

    if (error) {
      throw error;
    }
  }

  subscribeToOrders(onChange: (order: Order) => void): void {
    this.ordersChannel = this.supabaseService
      .getClient()
      .channel('orders-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        onChange(payload.new as Order);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        onChange(payload.new as Order);
      })
      .subscribe();
  }

  unsubscribeFromOrders(): void {
    if (this.ordersChannel) {
      this.supabaseService.getClient().removeChannel(this.ordersChannel);
      this.ordersChannel = undefined;
    }
  }
}
