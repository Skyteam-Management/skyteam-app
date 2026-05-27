import { Injectable, inject, signal } from '@angular/core';
import { Lider } from '../../interfaces/lider.interface';
import { SupabaseService } from '../../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class LiderService {
  private supabase = inject(SupabaseService);

  private readonly _lideres = signal<Lider[]>([]);
  readonly lideres = this._lideres.asReadonly();

  constructor() {
    this.refresh();
  }

  async getLider(id: string): Promise<Lider | undefined> {
    const { data, error } = await this.supabase.client
      .from('lideres')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  }

  async addLider(lider: Lider) {
    const row = { ...lider, id: lider.id || crypto.randomUUID() };
    const { error } = await this.supabase.client.from('lideres').insert(row);
    if (error) throw error;
    await this.refresh();
  }

  async updateLider(id: string, lider: Lider) {
    const { id: _ignored, ...rest } = lider;
    const { error } = await this.supabase.client.from('lideres').update(rest).eq('id', id);
    if (error) throw error;
    await this.refresh();
  }

  async deleteLider(id: string) {
    const { error } = await this.supabase.client.from('lideres').delete().eq('id', id);
    if (error) throw error;
    await this.refresh();
  }

  private async refresh() {
    const { data, error } = await this.supabase.client
      .from('lideres')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) {
      console.error('lideres refresh failed', error);
      return;
    }
    this._lideres.set((data ?? []) as Lider[]);
  }
}
