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
  monthlyRevenue = computed(() => this.buildMonthlyRevenue());
  monthlyOrderCounts = computed(() => this.buildMonthlyOrderCounts());
  topItems = computed(() => this.buildTopItems());
  maxMonthlyRevenue = computed(() => Math.max(...this.monthlyRevenue(), 1));
  maxMonthlyOrders = computed(() => Math.max(...this.monthlyOrderCounts(), 1));
  currentYear = new Date().getFullYear();

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

  private buildMonthlyRevenue(): number[] {
    const currentYear = new Date().getFullYear();
    const totals = Array.from({ length: 12 }, () => 0);
    this.orders().forEach((order) => {
      if (order.status === 'canceled') {
        return;
      }
      const created = new Date(order.created_at);
      if (created.getFullYear() !== currentYear) {
        return;
      }
      totals[created.getMonth()] += this.getOrderTotal(order);
    });
    return totals;
  }

  private buildMonthlyOrderCounts(): number[] {
    const currentYear = new Date().getFullYear();
    const counts = Array.from({ length: 12 }, () => 0);
    this.orders().forEach((order) => {
      if (order.status === 'canceled') {
        return;
      }
      const created = new Date(order.created_at);
      if (created.getFullYear() !== currentYear) {
        return;
      }
      counts[created.getMonth()] += 1;
    });
    return counts;
  }

  private buildTopItems(): Array<{ name: string; qty: number }> {
    const map = new Map<string, number>();
    this.orders().forEach((order) => {
      if (order.status === 'canceled') {
        return;
      }
      (order.order_items ?? []).forEach((item) => {
        const name = item.menu_item?.name ?? 'Item';
        map.set(name, (map.get(name) ?? 0) + item.qty);
      });
    });
    return Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }
}
