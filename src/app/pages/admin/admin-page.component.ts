import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { MenuItem, Order } from '../../shared/models/domain.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderStatusBadgeComponent],
  templateUrl: './admin-page.component.html'
})
export class AdminPageComponent implements OnInit {
  menuItems = signal<MenuItem[]>([]);
  orders = signal<Order[]>([]);
  draft = signal<Partial<MenuItem>>({ name: '', price: 0, category_id: '' });
  saving = signal(false);

  constructor(
    private readonly menuService: MenuService,
    private readonly orderService: OrderService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.menuItems.set(await this.menuService.getAvailableMenuItems());
    this.orders.set(await this.orderService.getOrders());
  }

  async saveMenuItem(): Promise<void> {
    this.saving.set(true);
    try {
      await this.menuService.upsertMenuItem(this.draft());
      this.draft.set({ name: '', price: 0, category_id: '' });
      await this.refresh();
    } finally {
      this.saving.set(false);
    }
  }

  async toggleAvailability(item: MenuItem): Promise<void> {
    await this.menuService.setAvailability(item.id, !item.is_available);
    await this.refresh();
  }

  get paidCount(): number {
    return this.orders().filter((order) => order.status === 'paid').length;
  }
}
