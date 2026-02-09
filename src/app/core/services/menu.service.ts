import { Injectable } from '@angular/core';
import { DiningTable, MenuCategory, MenuItem } from '../../shared/models/domain.models';
import { SupabaseService } from './supabase.service';
import { MenuCategory, MenuItem } from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getActiveTables(): Promise<DiningTable[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('table_no', { ascending: true });

    if (error) {
      throw error;
    }

    return data as DiningTable[];
  }

  async getCategories(): Promise<MenuCategory[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('menu_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return data as MenuCategory[];
  }

  async getAvailableMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data as MenuItem[];
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data as MenuItem[];
  }

  async upsertMenuItem(item: Partial<MenuItem>): Promise<void> {
    const { error } = await this.supabaseService.getClient().from('menu_items').upsert(item);

    if (error) {
      throw error;
    }
  }

  async setAvailability(itemId: string, isAvailable: boolean): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId);

    if (error) {
      throw error;
    }
  }
}
