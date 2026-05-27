export type HistorialTabla = 'lideres' | 'paquetes' | 'clientes';
export type HistorialAccion = 'insert' | 'update' | 'delete';

export interface Historial {
  id: number;
  tabla: HistorialTabla;
  registroId: string;
  accion: HistorialAccion;
  actorId: string | null;
  actorEmail: string | null;
  datos: Record<string, unknown> | null;
  createdAt: string;
}
