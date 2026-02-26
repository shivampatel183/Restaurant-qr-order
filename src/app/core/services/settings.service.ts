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
      .limit(1);

    if (!error && data?.length) {
      const settings = data[0] as AppSettings;
      this.taxPercentSignal.set(Number(settings.tax_percent) ?? 0);
      this.restaurantNameSignal.set(settings.restaurant_name || this.restaurantNameSignal());
      this.loaded = true;
      return;
    }

    this.loaded = true;
  }

  async updateTaxPercent(value: number): Promise<void> {
    const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0;
    await this.ensureSettingsRow();

    const { data, error } = await this.supabaseService
      .getClient()
      .from('app_settings')
      .update({ tax_percent: sanitized, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('id');

    if (error) {
      throw error;
    }

    if (!data?.length) {
      throw new Error('Failed to save tax settings. app_settings row with id=1 was not found.');
    }

    this.taxPercentSignal.set(sanitized);
  }

  async updateRestaurantName(name: string): Promise<void> {
    const sanitized = name.trim() || 'Restaurant QR Order';
    await this.ensureSettingsRow();

    const { data, error } = await this.supabaseService
      .getClient()
      .from('app_settings')
      .update({ restaurant_name: sanitized, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('id');

    if (error) {
      throw error;
    }

    if (!data?.length) {
      throw new Error('Failed to save restaurant name. app_settings row with id=1 was not found.');
    }

    this.restaurantNameSignal.set(sanitized);
  }

  private async ensureSettingsRow(): Promise<void> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('app_settings')
      .select('id')
      .eq('id', 1)
      .limit(1);

    if (error) {
      throw error;
    }

    if (data?.length) {
      return;
    }

    const basePayload = {
      id: 1,
      tax_percent: this.taxPercentSignal(),
      restaurant_name: this.restaurantNameSignal(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await client.from('app_settings').insert(basePayload);

    if (!insertError) {
      return;
    }

    // Some schemas require restaurant_id on app_settings.
    if (insertError.message?.toLowerCase().includes('restaurant_id')) {
      const restaurantId = await this.resolveRestaurantId();
      if (!restaurantId) {
        throw new Error(
          `Cannot create app settings row. ${insertError.message}. No accessible restaurant_id found from existing data.`
        );
      }

      const { error: retryError } = await client.from('app_settings').insert({
        ...basePayload,
        restaurant_id: restaurantId
      });

      if (!retryError) {
        return;
      }

      throw new Error(`Cannot create default app settings row. ${retryError.message}`);
    }

    throw new Error(`Cannot create default app settings row. ${insertError.message}`);
  }

  private async resolveRestaurantId(): Promise<string | null> {
    const client = this.supabaseService.getClient();
    const sources = ['tables', 'menu_items', 'orders'];

    for (const table of sources) {
      const { data, error } = await client
        .from(table)
        .select('restaurant_id')
        .limit(1);

      if (error) {
        continue;
      }

      const id = ((data as Array<{ restaurant_id?: string }> | null) ?? [])[0]?.restaurant_id;
      if (id) {
        return id;
      }
    }

    return null;
  }
}
