import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { SettingsService } from '../../core/services/settings.service';
import { MenuItem } from '../../shared/models/domain.models';

@Component({
  selector: 'app-admin-order-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-order-page.component.html'
})
export class AdminOrderPageComponent implements OnInit {
  menuItems = signal<MenuItem[]>([]);
  adminTableNumber = signal<number | null>(null);
  adminQuantityMap = signal<Record<string, number>>({});
  adminMessage = signal('');
  adminOrdering = signal(false);

  adminCartItems = computed(() => {
    const quantities = this.adminQuantityMap();
    return this.menuItems()
      .map((item) => ({ item, qty: quantities[item.id] ?? 0 }))
      .filter((entry) => entry.qty > 0);
  });

  adminCartSubtotal = computed(() =>
    this.adminCartItems().reduce((sum, entry) => sum + entry.qty * Number(entry.item.price), 0)
  );

  adminCartTax = computed(() => (this.adminCartSubtotal() * this.settingsService.taxPercent()) / 100);

  adminCartTotal = computed(() => this.adminCartSubtotal() + this.adminCartTax());

  constructor(
    private readonly menuService: MenuService,
    private readonly orderService: OrderService,
    public readonly settingsService: SettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.settingsService.loadTaxPercent();
    this.menuItems.set(await this.menuService.getAllMenuItems());
  }

  updateAdminTable(rawValue: string | number): void {
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    this.adminTableNumber.set(Number.isFinite(value) ? value : null);
  }

  adminIncrement(itemId: string): void {
    const current = this.adminQuantityMap()[itemId] ?? 0;
    this.adminQuantityMap.update((prev) => ({ ...prev, [itemId]: current + 1 }));
  }

  adminDecrement(itemId: string): void {
    const current = this.adminQuantityMap()[itemId] ?? 0;
    const next = Math.max(0, current - 1);
    this.adminQuantityMap.update((prev) => ({ ...prev, [itemId]: next }));
  }

  async placeAdminOrder(): Promise<void> {
    this.adminMessage.set('');
    const tableNo = this.adminTableNumber();
    if (!tableNo) {
      this.adminMessage.set('Enter a valid table number.');
      return;
    }

    const items = this.adminCartItems().map(({ item, qty }) => ({ menu_item_id: item.id, qty }));
    if (!items.length) {
      this.adminMessage.set('Select at least one item.');
      return;
    }

    this.adminOrdering.set(true);
    try {
      const table = await this.menuService.getTableByNumber(tableNo);
      if (!table) {
        this.adminMessage.set(`Table ${tableNo} not found.`);
        return;
      }

      const existingOrder = await this.orderService.getOpenOrderForTable(table.id);
      const orderId = existingOrder?.id ?? (await this.orderService.placeOrder(table.id, items));

      if (existingOrder) {
        await this.orderService.addItemsToOrder(existingOrder.id, items);
      }

      this.adminQuantityMap.set({});
      this.adminMessage.set(`Order ${orderId} updated successfully.`);
    } finally {
      this.adminOrdering.set(false);
    }
  }
}
