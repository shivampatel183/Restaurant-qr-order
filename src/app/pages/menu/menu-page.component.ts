import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { MenuCategory, MenuItem, OrderItem } from '../../shared/models/domain.models';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './menu-page.component.html'
})
export class MenuPageComponent implements OnInit {
  tableId = signal('');
  categories = signal<MenuCategory[]>([]);
  items = signal<MenuItem[]>([]);
  quantityMap = signal<Record<string, number>>({});
  placingOrder = signal(false);
  orderMessage = signal('');

  groupedItems = computed(() => {
    const map = new Map<string, MenuItem[]>();
    this.categories().forEach((category) => map.set(category.id, []));
    this.items().forEach((item) => {
      const current = map.get(item.category_id) ?? [];
      map.set(item.category_id, [...current, item]);
    });
    return map;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly menuService: MenuService,
    private readonly orderService: OrderService
  ) {}

  async ngOnInit(): Promise<void> {
    this.tableId.set(this.route.snapshot.queryParamMap.get('table') ?? 'unknown');
    this.categories.set(await this.menuService.getCategories());
    this.items.set(await this.menuService.getAvailableMenuItems());
  }

  updateQty(itemId: string, qty: string): void {
    this.quantityMap.update((prev) => ({ ...prev, [itemId]: Number(qty) }));
  }

  async placeOrder(): Promise<void> {
    const items: OrderItem[] = Object.entries(this.quantityMap())
      .filter(([, qty]) => qty > 0)
      .map(([menu_item_id, qty]) => ({ menu_item_id, qty }));

    if (!items.length || !this.tableId()) {
      this.orderMessage.set('Select at least one item before placing your order.');
      return;
    }

    this.placingOrder.set(true);
    this.orderMessage.set('');

    try {
      const orderId = await this.orderService.placeOrder(this.tableId(), items);
      this.quantityMap.set({});
      this.orderMessage.set(`Order ${orderId} placed successfully.`);
    } catch {
      this.orderMessage.set('Could not place order. Please try again.');
    } finally {
      this.placingOrder.set(false);
    }
  }
}
