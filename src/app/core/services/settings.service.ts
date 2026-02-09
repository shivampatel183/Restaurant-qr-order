import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

interface AppSettings {
  tax_percent: number;
  restaurant_name: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly taxPercentSignal = signal<number>(environment.taxPercent ?? 0);
  private readonly restaurantNameSignal = signal<string>(environment.restaurantName ?? 'Restaurant QR Order');
  private loaded = false;

  constructor(private readonly supabaseService: SupabaseService) {}

  get taxPercent() {
    return this.taxPercentSignal;
  }

  get restaurantName() {
    return this.restaurantNameSignal;
  }

  async loadTaxPercent(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('app_settings')
      .select('tax_percent, restaurant_name')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      const settings = data as AppSettings;
      this.taxPercentSignal.set(Number(settings.tax_percent) ?? 0);
      this.restaurantNameSignal.set(settings.restaurant_name || this.restaurantNameSignal());
      this.loaded = true;
      return;
    }

    this.loaded = true;
  }

  async updateTaxPercent(value: number): Promise<void> {
    const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0;
    const { error } = await this.supabaseService
      .getClient()
      .from('app_settings')
      .update({ tax_percent: sanitized, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      throw error;
    }

    this.taxPercentSignal.set(sanitized);
  }

  async updateRestaurantName(name: string): Promise<void> {
    const sanitized = name.trim() || 'Restaurant QR Order';
    const { error } = await this.supabaseService
      .getClient()
      .from('app_settings')
      .update({ restaurant_name: sanitized, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      throw error;
    }

    this.restaurantNameSignal.set(sanitized);
  }
}
