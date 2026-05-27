import { Injectable, computed, inject, signal } from '@angular/core';
import { Paquete } from '../../interfaces/paquete.interface';
import { SupabaseService } from '../../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class PaqueteService {
  private supabase = inject(SupabaseService);

  private readonly _paquetes = signal<Paquete[]>([]);
  readonly paquetes = this._paquetes.asReadonly();
  readonly activos = computed(() => this._paquetes().filter((p) => p.activo !== false));

  constructor() {
    this.refresh();
  }

  async addPaquete(paquete: Omit<Paquete, 'id'> & { id?: string }) {
    const row = { ...paquete, id: paquete.id || crypto.randomUUID() };
    const { error } = await this.supabase.client.from('paquetes').insert(row);
    if (error) throw error;
    await this.refresh();
  }

  async updatePaquete(id: string, paquete: Partial<Paquete>) {
    const { id: _ignored, ...rest } = paquete;
    const { error } = await this.supabase.client.from('paquetes').update(rest).eq('id', id);
    if (error) throw error;
    await this.refresh();
  }

  async deletePaquete(id: string) {
    const { error } = await this.supabase.client.from('paquetes').delete().eq('id', id);
    if (error) throw error;
    await this.refresh();
  }

  private async refresh() {
    const { data, error } = await this.supabase.client
      .from('paquetes')
      .select('*')
      .order('orden', { ascending: true, nullsFirst: false })
      .order('dias', { ascending: true });
    if (error) {
      console.error('paquetes refresh failed', error);
      return;
    }
    this._paquetes.set((data ?? []) as Paquete[]);
  }
}
