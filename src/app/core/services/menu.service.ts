import { Injectable } from '@angular/core';
import { DiningTable, MenuCategory, MenuItem } from '../../shared/models/domain.models';
import { SupabaseService } from './supabase.service';

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

  async getTables(): Promise<DiningTable[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .order('table_no', { ascending: true });

    if (error) {
      throw error;
    }

    return data as DiningTable[];
  }

  async setTableCount(tableCount: number): Promise<void> {
    const count = Math.max(0, Math.floor(tableCount));
    const existing = await this.getTables();
    const existingByNo = new Map(existing.map((table) => [table.table_no, table]));

    const toInsert: Array<{ table_no: number; is_active: boolean }> = [];
    const toActivate: number[] = [];
    const toDeactivate: number[] = [];

    for (let i = 1; i <= count; i += 1) {
      const table = existingByNo.get(i);
      if (!table) {
        toInsert.push({ table_no: i, is_active: true });
      } else if (!table.is_active) {
        toActivate.push(i);
      }
    }

    existing.forEach((table) => {
      if (table.table_no > count && table.is_active) {
        toDeactivate.push(table.table_no);
      }
    });

    const client = this.supabaseService.getClient();

    if (toInsert.length) {
      const { error } = await client.from('tables').insert(toInsert);
      if (error) {
        throw error;
      }
    }

    if (toActivate.length) {
      const { error } = await client
        .from('tables')
        .update({ is_active: true })
        .in('table_no', toActivate);
      if (error) {
        throw error;
      }
    }

    if (toDeactivate.length) {
      const { error } = await client
        .from('tables')
        .update({ is_active: false })
        .in('table_no', toDeactivate);
      if (error) {
        throw error;
      }
    }
  }

  async getTableByNumber(tableNo: number): Promise<DiningTable | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .eq('table_no', tableNo)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as DiningTable) ?? null;
  }

  async getTableById(tableId: string): Promise<DiningTable | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as DiningTable) ?? null;
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

  async createCategory(name: string, sortOrder: number): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_categories')
      .insert({ name, sort_order: sortOrder });

    if (error) {
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_categories')
      .delete()
      .eq('id', categoryId)
      ;

    if (error) {
      throw error;
    }
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      ;

    if (error) {
      throw error;
    }
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
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .upsert(item);

    if (error) {
      throw error;
    }
  }

  async setAvailability(itemId: string, isAvailable: boolean): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId)
      ;

    if (error) {
      throw error;
    }
  }
}
