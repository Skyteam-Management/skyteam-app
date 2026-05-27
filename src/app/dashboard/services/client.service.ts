import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '../../interfaces/client.interface';
import { SupabaseService } from '../../services/supabase.service';

interface ClienteRow {
  id: string;
  nombre: string;
  telefono: string | null;
  lider: string | null;
  paquete: string | null;
  fecha_inicio: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private clients$ = new BehaviorSubject<Client[]>([]);

  constructor(private supabase: SupabaseService) {
    this.refresh();
  }

  getClients(): Observable<Client[]> {
    return this.clients$.asObservable();
  }

  async getClient(id: string): Promise<Client | undefined> {
    const { data, error } = await this.supabase.client
      .from('clientes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.toClient(data as ClienteRow) : undefined;
  }

  async addClient(client: Client) {
    const row = this.toRow(client, crypto.randomUUID());
    const { error } = await this.supabase.client.from('clientes').insert(row);
    if (error) throw error;
    await this.refresh();
  }

  async updateClient(id: string, client: Client) {
    const row = this.toRow(client);
    delete (row as Partial<ClienteRow>).id;
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
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) {
      console.error('clients refresh failed', error);
      return;
    }
    this.clients$.next((data as ClienteRow[]).map((r) => this.toClient(r)));
  }

  private toClient(row: ClienteRow): Client {
    return {
      id: row.id,
      nombre: row.nombre,
      telefono: row.telefono ?? '',
      lider: row.lider ?? '',
      paquete: row.paquete ?? '',
      fechaInicio: row.fecha_inicio,
    };
  }

  private toRow(client: Client, id?: string): ClienteRow {
    const fecha = client.fechaInicio;
    return {
      id: id ?? (client.id ?? ''),
      nombre: client.nombre,
      telefono: client.telefono ?? null,
      lider: client.lider ?? null,
      paquete: client.paquete ?? null,
      fecha_inicio: fecha instanceof Date ? (fecha as Date).toISOString() : (fecha ?? null),
    };
  }
}
