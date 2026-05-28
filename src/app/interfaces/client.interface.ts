export interface Client {
  id?: string;
  nombre: string;
  telefono: string;
  lider: string;
  paquete: string;
  fechaInicio: string | Date | null;

  // Read-only enrichment from clientes_view. Never sent on writes.
  paqueteNombre?: string;
  paqueteDias?: number | null;
  fechaVencimiento?: string | null;
  expirado?: boolean;
  liderNombre?: string;
  liderApellido?: string;
  createdAt?: string;
  updatedAt?: string;
}
