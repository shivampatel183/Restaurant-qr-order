import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

import { OrderService } from '../../core/services/order.service';
import { OrderStatus, OrderWithDetails } from '../../shared/models/domain.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';

@Component({
  selector: 'app-kitchen-page',
  standalone: true,
  imports: [CommonModule, DatePipe, OrderStatusBadgeComponent],
  templateUrl: './kitchen-page.component.html'
})
export class KitchenPageComponent implements OnInit, OnDestroy {
  orders = signal<OrderWithDetails[]>([]);
  pendingOrders = computed(() => this.orders().filter((order) => order.status === 'pending'));
  servedOrders = computed(() => this.orders().filter((order) => order.status === 'served'));
  paidOrders = computed(() => this.orders().filter((order) => order.status === 'paid'));
  canceledOrders = computed(() => this.orders().filter((order) => order.status === 'canceled'));

  constructor(private readonly orderService: OrderService) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();

    this.orderService.subscribeToOrderInserts((newOrder) => {
      void this.refresh();
    });
  }

  ngOnDestroy(): void {
    this.orderService.unsubscribeFromOrderInserts();
  }

  async setStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.orderService.updateStatus(orderId, status);
    this.orders.update((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }

  private async refresh(): Promise<void> {
    const current = await this.orderService.getOrders();
    this.orders.set(current);
  }
}
