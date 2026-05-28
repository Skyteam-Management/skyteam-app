import { Injectable, inject, signal } from '@angular/core';
import { Historial, HistorialAccion, HistorialTabla } from '../../interfaces/historial.interface';
import { SupabaseService } from '../../services/supabase.service';

interface HistorialRow {
  id: number;
  tabla: HistorialTabla;
  registro_id: string;
  accion: HistorialAccion;
  actor_id: string | null;
  actor_email: string | null;
  datos: Record<string, unknown> | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private supabase = inject(SupabaseService);

  private readonly _entries = signal<Historial[]>([]);
  readonly entries = this._entries.asReadonly();
  readonly loading = signal(false);

  async refresh(limit = 500) {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('historial')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        console.error('historial refresh failed', error);
        return;
      }
      this._entries.set((data as HistorialRow[]).map(this.fromRow));
    } finally {
      this.loading.set(false);
    }
  }

  private fromRow(r: HistorialRow): Historial {
    return {
      id: r.id,
      tabla: r.tabla,
      registroId: r.registro_id,
      accion: r.accion,
      actorId: r.actor_id,
      actorEmail: r.actor_email,
      datos: r.datos,
      createdAt: r.created_at,
    };
  }
}
