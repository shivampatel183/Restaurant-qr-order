import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { DiningTable, MenuCategory, MenuItem, OrderWithDetails } from '../../shared/models/domain.models';
import QRCode from 'qrcode';
import { SettingsService } from '../../core/services/settings.service';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderStatusBadgeComponent],
  templateUrl: './admin-page.component.html'
})
export class AdminPageComponent implements OnInit {
  categories = signal<MenuCategory[]>([]);
  menuItems = signal<MenuItem[]>([]);
  orders = signal<OrderWithDetails[]>([]);
  tables = signal<DiningTable[]>([]);
  draft = signal<Partial<MenuItem>>({ name: '', price: 0, category_id: '' });
  categoryDraft = signal({ name: '', sort_order: 0 });
  saving = signal(false);
  taxDraft = signal(0);
  tableCountDraft = signal(0);
  restaurantNameDraft = signal('');
  qrMap = signal<Record<number, string>>({});
  qrLoading = signal<Record<number, boolean>>({});
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

  monthlyRevenue = computed(() => this.buildMonthlyRevenue());
  monthlyOrderCounts = computed(() => this.buildMonthlyOrderCounts());
  topItems = computed(() => this.buildTopItems());
  maxMonthlyRevenue = computed(() => Math.max(...this.monthlyRevenue(), 1));
  maxMonthlyOrders = computed(() => Math.max(...this.monthlyOrderCounts(), 1));
  currentYear = new Date().getFullYear();

  constructor(
    private readonly menuService: MenuService,
    private readonly orderService: OrderService,
    public readonly settingsService: SettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.settingsService.loadTaxPercent();
    this.taxDraft.set(this.settingsService.taxPercent());
    this.restaurantNameDraft.set(this.settingsService.restaurantName());
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.categories.set(await this.menuService.getCategories());
    this.menuItems.set(await this.menuService.getAllMenuItems());
    this.orders.set(await this.orderService.getOrders());
    const tables = await this.menuService.getTables();
    this.tables.set(tables);
    const activeCount = tables.filter((table) => table.is_active).length;
    this.tableCountDraft.set(activeCount);
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

  updateDraftName(name: string): void {
    this.draft.update((value) => ({ ...value, name }));
  }

  updateDraftCategoryId(categoryId: string): void {
    this.draft.update((value) => ({ ...value, category_id: categoryId }));
  }

  updateDraftPrice(rawPrice: string | number): void {
    const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
    this.draft.update((value) => ({ ...value, price }));
  }

  updateTaxDraft(rawValue: string | number): void {
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    this.taxDraft.set(Number.isFinite(value) ? value : 0);
  }

  async saveTaxPercent(): Promise<void> {
    await this.settingsService.updateTaxPercent(this.taxDraft());
    this.taxDraft.set(this.settingsService.taxPercent());
  }

  updateRestaurantName(name: string): void {
    this.restaurantNameDraft.set(name);
  }

  async saveRestaurantName(): Promise<void> {
    await this.settingsService.updateRestaurantName(this.restaurantNameDraft());
    this.restaurantNameDraft.set(this.settingsService.restaurantName());
  }

  updateCategoryName(name: string): void {
    this.categoryDraft.update((prev) => ({ ...prev, name }));
  }

  updateCategorySortOrder(rawValue: string | number): void {
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    this.categoryDraft.update((prev) => ({ ...prev, sort_order: Number.isFinite(value) ? value : 0 }));
  }

  async saveCategory(): Promise<void> {
    const { name, sort_order } = this.categoryDraft();
    if (!name.trim()) {
      return;
    }

    await this.menuService.createCategory(name.trim(), sort_order);
    this.categoryDraft.set({ name: '', sort_order: 0 });
    await this.refresh();
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.menuService.deleteCategory(categoryId);
    await this.refresh();
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    await this.menuService.deleteMenuItem(itemId);
    await this.refresh();
  }

  updateTableCount(rawValue: string | number): void {
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    this.tableCountDraft.set(Number.isFinite(value) ? value : 0);
  }

  async saveTableCount(): Promise<void> {
    await this.menuService.setTableCount(this.tableCountDraft());
    await this.refresh();
  }

  async downloadQr(tableNo: number): Promise<void> {
    if (this.qrLoading()[tableNo]) {
      return;
    }

    this.qrLoading.update((prev) => ({ ...prev, [tableNo]: true }));
    try {
      const url = `${window.location.origin}/menu?table=${tableNo}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      this.qrMap.update((prev) => ({ ...prev, [tableNo]: dataUrl }));

      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `table-${tableNo}-qr.png`;
      anchor.click();
    } finally {
      this.qrLoading.update((prev) => ({ ...prev, [tableNo]: false }));
    }
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
      await this.refresh();
    } finally {
      this.adminOrdering.set(false);
    }
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
    const now = new Date();
    const currentYear = now.getFullYear();
    const totals = Array.from({ length: 12 }, () => 0);
    this.orders().forEach((order) => {
      if (order.status === 'canceled') {
        return;
      }
      const created = new Date(order.created_at);
      if (created.getFullYear() !== currentYear) {
        return;
      }
      const month = created.getMonth();
      totals[month] += this.getOrderTotal(order);
    });
    return totals;
  }

  private buildMonthlyOrderCounts(): number[] {
    const now = new Date();
    const currentYear = now.getFullYear();
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


  get paidCount(): number {
    return this.orders().filter((order) => order.status === 'paid').length;
  }
}
