import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

interface AppSettings {
  tax_percent: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly taxPercentSignal = signal<number>(environment.taxPercent ?? 0);
  private loaded = false;

  constructor(private readonly supabaseService: SupabaseService) {}

  get taxPercent() {
    return this.taxPercentSignal;
  }

  async loadTaxPercent(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('app_settings')
      .select('tax_percent')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      this.taxPercentSignal.set(Number((data as AppSettings).tax_percent) ?? 0);
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
}
