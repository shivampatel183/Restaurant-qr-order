import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';

import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../shared/models/domain.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';

@Component({
  selector: 'app-kitchen-page',
  standalone: true,
  imports: [CommonModule, DatePipe, OrderStatusBadgeComponent],
  templateUrl: './kitchen-page.component.html'
})
export class KitchenPageComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);

  constructor(private readonly orderService: OrderService) {}

  async ngOnInit(): Promise<void> {
    const current = await this.orderService.getOrders();
    this.orders.set(current);

    this.orderService.subscribeToOrderInserts((newOrder) => {
      this.orders.update((existing) => [newOrder, ...existing]);
    });
  }

  ngOnDestroy(): void {
    this.orderService.unsubscribeFromOrderInserts();
  }

  async setStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.orderService.updateStatus(orderId, status);
    this.orders.update((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }
}
