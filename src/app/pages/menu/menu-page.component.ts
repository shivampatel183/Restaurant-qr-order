import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { DiningTable, MenuCategory, MenuItem, OrderItem } from '../../shared/models/domain.models';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './menu-page.component.html'
})
export class MenuPageComponent implements OnInit {
  tableNo = signal<number | null>(null);
  activeTable = signal<DiningTable | null>(null);
  categories = signal<MenuCategory[]>([]);
  items = signal<MenuItem[]>([]);
  quantityMap = signal<Record<string, number>>({});
  placingOrder = signal(false);
  orderMessage = signal('');

  groupedItems = computed(() => {
    const grouped = new Map<string, MenuItem[]>();
    this.categories().forEach((category) => grouped.set(category.id, []));
    this.items().forEach((item) => grouped.set(item.category_id, [...(grouped.get(item.category_id) ?? []), item]));
    return grouped;
  });

  cartItems = computed(() =>
    this.items()
      .filter((item) => (this.quantityMap()[item.id] ?? 0) > 0)
      .map((item) => ({ item, qty: this.quantityMap()[item.id] ?? 0 }))
  );

  cartTotal = computed(() => this.cartItems().reduce((sum, row) => sum + row.item.price * row.qty, 0));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly menuService: MenuService,
    private readonly orderService: OrderService
  ) {}

  async ngOnInit(): Promise<void> {
    const tableParam = Number(this.route.snapshot.queryParamMap.get('table'));
    this.tableNo.set(Number.isFinite(tableParam) ? tableParam : null);

    const [tables, categories, items] = await Promise.all([
      this.menuService.getActiveTables(),
      this.menuService.getCategories(),
      this.menuService.getAvailableMenuItems()
    ]);

    this.activeTable.set(tables.find((table) => table.table_no === this.tableNo()) ?? null);
    this.categories.set(categories);
    this.items.set(items);

    if (!this.activeTable()) {
      this.orderMessage.set('Invalid or inactive table number. Scan a valid QR code.');
    }
  }

  updateQty(itemId: string, qty: number): void {
    this.quantityMap.update((prev) => ({ ...prev, [itemId]: Math.max(0, qty) }));
  }

  async placeOrder(): Promise<void> {
    if (!this.activeTable()) {
      this.orderMessage.set('Cannot place order without a valid table.');
      return;
    }

    const items: OrderItem[] = this.cartItems().map((row) => ({ menu_item_id: row.item.id, qty: row.qty }));

    if (!items.length) {
      this.orderMessage.set('Select at least one item before placing your order.');
      return;
    }

    this.placingOrder.set(true);
    this.orderMessage.set('');

    try {
      const orderId = await this.orderService.placeOrder(this.activeTable()!.id, items);
      this.quantityMap.set({});
      this.orderMessage.set(`Order ${orderId.slice(0, 8)} placed successfully.`);
    } catch {
      this.orderMessage.set('Could not place order. Please try again.');
    } finally {
      this.placingOrder.set(false);
    }
  }
}
