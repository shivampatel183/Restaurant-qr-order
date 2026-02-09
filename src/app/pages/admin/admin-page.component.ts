import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { SupabaseService } from '../../core/services/supabase.service';
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
  draft = signal<Partial<MenuItem>>({ name: '', price: 0, category_id: '', image_url: '' });
  saving = signal(false);

  email = signal('');
  password = signal('');
  sessionEmail = signal<string>('');

  constructor(
    private readonly menuService: MenuService,
    private readonly orderService: OrderService,
    private readonly supabaseService: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    const { data } = await this.supabaseService.getClient().auth.getSession();
    this.sessionEmail.set(data.session?.user.email ?? '');
    await this.refresh();
  }

  async signIn(): Promise<void> {
    const { error, data } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({ email: this.email(), password: this.password() });

    if (!error) {
      this.sessionEmail.set(data.user?.email ?? '');
    }
  }

  async signOut(): Promise<void> {
    await this.supabaseService.getClient().auth.signOut();
    this.sessionEmail.set('');
  }

  async refresh(): Promise<void> {
    this.menuItems.set(await this.menuService.getAllMenuItems());
    this.orders.set(await this.orderService.getOrders());
  }

  async saveMenuItem(): Promise<void> {
    this.saving.set(true);
    try {
      await this.menuService.upsertMenuItem(this.draft());
      this.draft.set({ name: '', price: 0, category_id: '', image_url: '' });
      await this.refresh();
    } finally {
      this.saving.set(false);
    }
  }

  async toggleAvailability(item: MenuItem): Promise<void> {
    await this.menuService.setAvailability(item.id, !item.is_available);
    await this.refresh();
  }

  setDraftPrice(value: string | number): void {
    this.draft.update((current) => ({ ...current, price: Number(value) || 0 }));
  }

  get paidCount(): number {
    return this.orders().filter((order) => order.status === 'paid').length;
  }
}
