export interface Client {
  id?: string;
  nombre: string;
  telefono: string;
  lider: string;
  liderNombre?: string;
  paquete: string;
  fechaInicio: string | Date | null;
}
