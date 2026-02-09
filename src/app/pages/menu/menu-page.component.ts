import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { SettingsService } from '../../core/services/settings.service';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';
import { MenuCategory, MenuItem, OrderItem, OrderWithDetails } from '../../shared/models/domain.models';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, OrderStatusBadgeComponent],
  templateUrl: './menu-page.component.html'
})
export class MenuPageComponent implements OnInit {
  tableId = signal('');
  tableNumber = signal<number | null>(null);
  openOrders = signal<OrderWithDetails[]>([]);
  selectingTable = signal(false);
  tableInput = signal<number | null>(null);
  categories = signal<MenuCategory[]>([]);
  items = signal<MenuItem[]>([]);
  quantityMap = signal<Record<string, number>>({});
  placingOrder = signal(false);
  orderMessage = signal('');
  popupMessage = signal('');
  popupVisible = signal(false);

  groupedItems = computed(() => {
    const map = new Map<string, MenuItem[]>();
    this.categories().forEach((category) => map.set(category.id, []));
    this.items().forEach((item) => {
      const current = map.get(item.category_id) ?? [];
      map.set(item.category_id, [...current, item]);
    });
    return map;
  });

  cartItems = computed(() => {
    const quantities = this.quantityMap();
    return this.items()
      .map((item) => ({ item, qty: quantities[item.id] ?? 0 }))
      .filter((entry) => entry.qty > 0);
  });

  cartTotalQty = computed(() => this.cartItems().reduce((sum, entry) => sum + entry.qty, 0));

  cartSubtotal = computed(() =>
    this.cartItems().reduce((sum, entry) => sum + entry.qty * Number(entry.item.price), 0)
  );

  cartTaxAmount = computed(() => (this.cartSubtotal() * this.settingsService.taxPercent()) / 100);

  cartTotalAmount = computed(() => this.cartSubtotal() + this.cartTaxAmount());

  openOrderSubtotal = computed(() =>
    this.openOrders().reduce(
      (sum, order) =>
        sum +
        (order.order_items ?? []).reduce(
          (orderSum, item) => orderSum + item.qty * Number(item.menu_item?.price ?? 0),
          0
        ),
      0
    )
  );

  openOrderTax = computed(() => (this.openOrderSubtotal() * this.settingsService.taxPercent()) / 100);

  openOrderTotal = computed(() => this.openOrderSubtotal() + this.openOrderTax());

  constructor(
    private readonly route: ActivatedRoute,
    private readonly menuService: MenuService,
    private readonly orderService: OrderService,
    public readonly settingsService: SettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.settingsService.loadTaxPercent();
    await this.resolveTableId();
    this.categories.set(await this.menuService.getCategories());
    this.items.set(await this.menuService.getAvailableMenuItems());
    await this.refreshOpenOrders();
  }

  updateQty(itemId: string, qty: number): void {
    const nextQty = Math.max(0, qty);
    this.quantityMap.update((prev) => ({ ...prev, [itemId]: nextQty }));
  }

  increment(itemId: string): void {
    const current = this.quantityMap()[itemId] ?? 0;
    this.updateQty(itemId, current + 1);
  }

  decrement(itemId: string): void {
    const current = this.quantityMap()[itemId] ?? 0;
    this.updateQty(itemId, current - 1);
  }

  clearItem(itemId: string): void {
    this.updateQty(itemId, 0);
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
      const existingOrder = await this.orderService.getOpenOrderForTable(this.tableId());
      const orderId = existingOrder?.id ?? (await this.orderService.placeOrder(this.tableId(), items));

      if (existingOrder) {
        await this.orderService.addItemsToOrder(existingOrder.id, items);
      }

      this.quantityMap.set({});
      await this.refreshOpenOrders();
      this.orderMessage.set(`Order ${orderId} updated successfully.`);
      this.showPopup('Thanks for your order! Enjoy your meal.');
    } catch {
      this.orderMessage.set('Could not place order. Please try again.');
    } finally {
      this.placingOrder.set(false);
    }
  }

  private async resolveTableId(): Promise<void> {
    const tableParam = (this.route.snapshot.queryParamMap.get('table') ?? '').trim();
    if (!tableParam) {
      this.tableId.set('');
      this.tableNumber.set(null);
      this.selectingTable.set(true);
      this.orderMessage.set('Missing table information. Please scan the QR code again.');
      return;
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(tableParam)) {
      this.tableId.set(tableParam);
      const table = await this.menuService.getTableById(tableParam);
      this.tableNumber.set(table?.table_no ?? null);
      this.selectingTable.set(false);
      return;
    }

    const tableNo = Number(tableParam);
    if (Number.isNaN(tableNo)) {
      this.tableId.set('');
      this.tableNumber.set(null);
      this.selectingTable.set(true);
      this.orderMessage.set('Invalid table information. Please scan the QR code again.');
      return;
    }

    const table = await this.menuService.getTableByNumber(tableNo);
    if (!table) {
      this.tableId.set('');
      this.tableNumber.set(null);
      this.selectingTable.set(true);
      this.orderMessage.set(`Table ${tableNo} not found. Please contact staff.`);
      return;
    }

    this.tableId.set(table.id);
    this.tableNumber.set(table.table_no);
    this.selectingTable.set(false);
  }

  async setTableFromInput(): Promise<void> {
    const tableNo = this.tableInput();
    if (!tableNo) {
      this.orderMessage.set('Enter a valid table number.');
      return;
    }

    const table = await this.menuService.getTableByNumber(tableNo);
    if (!table) {
      this.orderMessage.set(`Table ${tableNo} not found.`);
      return;
    }

    this.tableId.set(table.id);
    this.tableNumber.set(table.table_no);
    this.selectingTable.set(false);
    await this.refreshOpenOrders();
  }

  downloadBill(): void {
    if (!this.openOrders().length) {
      this.showPopup('No active orders found for this table.');
      return;
    }

    const tableNo = this.tableNumber() ?? 'N/A';
    const lines: string[] = [];
    lines.push(`Restaurant QR Order`);
    lines.push(`Table #${tableNo}`);
    lines.push(`Date: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('Items:');

    this.openOrders().forEach((order) => {
      lines.push(`Order ${order.id.slice(0, 8)} (${order.status})`);
      (order.order_items ?? []).forEach((item) => {
        const name = item.menu_item?.name ?? 'Item';
        const price = Number(item.menu_item?.price ?? 0);
        const amount = price * item.qty;
        lines.push(`- ${name} x${item.qty} = ${amount.toFixed(2)}`);
      });
      lines.push('');
    });

    lines.push(`Subtotal: ${this.openOrderSubtotal().toFixed(2)}`);
    lines.push(`Tax: ${this.openOrderTax().toFixed(2)}`);
    lines.push(`Total: ${this.openOrderTotal().toFixed(2)}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `table-${tableNo}-bill.txt`;
    anchor.click();
    URL.revokeObjectURL(url);

    this.showPopup('Bill downloaded. Thank you for dining with us!');
  }

  closePopup(): void {
    this.popupVisible.set(false);
    this.popupMessage.set('');
  }

  private showPopup(message: string): void {
    this.popupMessage.set(message);
    this.popupVisible.set(true);
    window.setTimeout(() => this.closePopup(), 3000);
  }

  private async refreshOpenOrders(): Promise<void> {
    const tableId = this.tableId();
    if (!tableId) {
      this.openOrders.set([]);
      return;
    }

    const orders = await this.orderService.getOpenOrdersWithDetails(tableId);
    this.openOrders.set(orders);
  }
}
