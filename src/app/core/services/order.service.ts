import { Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import { Order, OrderItem, OrderStatus, OrderWithDetails } from '../../shared/models/domain.models';

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

    const enrichedItems = items.map((item) => ({ ...item, order_id: order.id }));
    const { error: itemError } = await client.from('order_items').insert(enrichedItems);

    if (itemError) {
      throw itemError;
    }

    return order.id;
  }

  async getOpenOrderForTable(tableId: string): Promise<Order | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .in('status', ['pending'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as Order) ?? null;
  }

  async getOpenOrderWithDetails(tableId: string): Promise<OrderWithDetails | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .select(
        '*, table:tables (id, table_no), order_items:order_items (id, qty, note, menu_item:menu_items (id, name, price))'
      )
      .eq('table_id', tableId)
      .in('status', ['pending'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as OrderWithDetails) ?? null;
  }

  async getOpenOrdersWithDetails(tableId: string): Promise<OrderWithDetails[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .select(
        '*, table:tables (id, table_no), order_items:order_items (id, qty, note, menu_item:menu_items (id, name, price))'
      )
      .eq('table_id', tableId)
      .in('status', ['pending', 'served'])
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data as OrderWithDetails[]) ?? [];
  }

  async addItemsToOrder(orderId: string, items: OrderItem[]): Promise<void> {
    const enrichedItems = items.map((item) => ({ ...item, order_id: orderId }));
    const { error } = await this.supabaseService.getClient().from('order_items').insert(enrichedItems);

    if (error) {
      throw error;
    }
  }

  async getOrders(): Promise<OrderWithDetails[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .select(
        '*, table:tables (id, table_no), order_items:order_items (id, qty, note, menu_item:menu_items (id, name, price))'
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as OrderWithDetails[];
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await this.supabaseService.getClient().from('orders').update({ status }).eq('id', orderId);

    if (error) {
      throw error;
    }
  }

  subscribeToOrderInserts(onInsert: (order: Order) => void): void {
    this.ordersChannel = this.supabaseService
      .getClient()
      .channel('orders-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        onInsert(payload.new as Order);
      })
      .subscribe();
  }

  unsubscribeFromOrderInserts(): void {
    if (this.ordersChannel) {
      this.supabaseService.getClient().removeChannel(this.ordersChannel);
      this.ordersChannel = undefined;
    }
  }
}
