export interface Client {
  id?: string;
  idCliente: string;
  nombre: string;
  telefono: string;
  lider: string;
  liderNombre?: string;
  paquete: string;
  fechaInicio: string | null;
}