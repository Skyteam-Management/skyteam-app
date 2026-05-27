import { Injectable, inject, signal } from '@angular/core';
import { Client } from '../../interfaces/client.interface';
import { SupabaseService } from '../../services/supabase.service';

interface ClienteViewRow {
  id: string;
  nombre: string;
  telefono: string | null;
  lider: string | null;
  paquete: string | null;
  fecha_inicio: string | null;
  created_at: string | null;
  updated_at: string | null;
  paquete_nombre: string | null;
  paquete_dias: number | null;
  fecha_vencimiento: string | null;
  expirado: boolean | null;
  lider_nombre: string | null;
  lider_apellido: string | null;
}

interface ClienteWriteRow {
  id: string;
  nombre: string;
  telefono: string | null;
  lider: string | null;
  paquete: string | null;
  fecha_inicio: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private supabase = inject(SupabaseService);

  private readonly _clients = signal<Client[]>([]);
  readonly clients = this._clients.asReadonly();

  constructor() {
    this.refresh();
  }

  async addClient(client: Client) {
    const row = this.toRow(client, crypto.randomUUID());
    const { error } = await this.supabase.client.from('clientes').insert(row);
    if (error) throw error;
    await this.refresh();
  }

  async updateClient(id: string, client: Client) {
    const row = this.toRow(client);
    delete (row as Partial<ClienteWriteRow>).id;
    const { error } = await this.supabase.client.from('clientes').update(row).eq('id', id);
    if (error) throw error;
    await this.refresh();
  }

  async deleteClient(id: string) {
    const { error } = await this.supabase.client.from('clientes').delete().eq('id', id);
    if (error) throw error;
    await this.refresh();
  }

  private async refresh() {
    const { data, error } = await this.supabase.client
      .from('clientes_view')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) {
      console.error('clients refresh failed', error);
      return;
    }
    this._clients.set((data as ClienteViewRow[]).map((r) => this.fromView(r)));
  }

  private fromView(row: ClienteViewRow): Client {
    return {
      id: row.id,
      nombre: row.nombre,
      telefono: row.telefono ?? '',
      lider: row.lider ?? '',
      paquete: row.paquete ?? '',
      fechaInicio: row.fecha_inicio,
      paqueteNombre: row.paquete_nombre ?? '',
      paqueteDias: row.paquete_dias,
      fechaVencimiento: row.fecha_vencimiento,
      expirado: row.expirado ?? false,
      liderNombre: row.lider_nombre ?? '',
      liderApellido: row.lider_apellido ?? '',
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
    };
  }

  private toRow(client: Client, id?: string): ClienteWriteRow {
    const fecha = client.fechaInicio;
    let fechaInicio: string | null;
    if (!fecha) {
      fechaInicio = null;
    } else if (fecha instanceof Date) {
      // DB column is `date`, so send a YYYY-MM-DD literal to avoid timezone drift.
      fechaInicio = fecha.toISOString().slice(0, 10);
    } else {
      fechaInicio = fecha.slice(0, 10);
    }
    return {
      id: id ?? (client.id ?? ''),
      nombre: client.nombre,
      telefono: client.telefono ?? null,
      lider: client.lider || null,
      paquete: client.paquete || null,
      fecha_inicio: fechaInicio,
    };
  }
}
