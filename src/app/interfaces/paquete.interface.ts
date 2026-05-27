export interface Paquete {
  id: string;
  nombre: string;
  dias: number;
  activo?: boolean;
  orden?: number | null;
}
