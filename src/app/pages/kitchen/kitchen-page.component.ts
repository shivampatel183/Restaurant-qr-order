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
    this.orders.set(await this.orderService.getOrders());
    this.orderService.subscribeToOrders((incoming) => {
      this.orders.update((current) => {
        const idx = current.findIndex((order) => order.id === incoming.id);
        if (idx >= 0) {
          const next = [...current];
          next[idx] = incoming;
          return next;
        }
        return [incoming, ...current];
      });
    });
  }

  ngOnDestroy(): void {
    this.orderService.unsubscribeFromOrders();
  }

  async setStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.orderService.updateStatus(orderId, status);
  }
}
