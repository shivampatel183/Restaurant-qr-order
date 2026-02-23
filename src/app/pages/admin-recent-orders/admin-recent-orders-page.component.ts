import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { OrderService } from '../../core/services/order.service';
import { SettingsService } from '../../core/services/settings.service';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';
import { OrderWithDetails } from '../../shared/models/domain.models';

@Component({
  selector: 'app-admin-recent-orders-page',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderStatusBadgeComponent],
  templateUrl: './admin-recent-orders-page.component.html'
})
export class AdminRecentOrdersPageComponent implements OnInit {
  orders = signal<OrderWithDetails[]>([]);

  recentOrders = computed(() =>
    [...this.orders()]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30)
  );

  constructor(
    private readonly orderService: OrderService,
    public readonly settingsService: SettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.orders.set(await this.orderService.getOrders());
  }

  getOrderSubtotal(order: OrderWithDetails): number {
    return (order.order_items ?? []).reduce(
      (sum, item) => sum + item.qty * Number(item.menu_item?.price ?? 0),
      0
    );
  }

  getOrderTax(order: OrderWithDetails): number {
    return (this.getOrderSubtotal(order) * this.settingsService.taxPercent()) / 100;
  }

  getOrderTotal(order: OrderWithDetails): number {
    return this.getOrderSubtotal(order) + this.getOrderTax(order);
  }
}
