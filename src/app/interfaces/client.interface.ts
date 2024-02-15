export interface Client {
  id?: string;
  idCliente: string;
  nombre: string;
  apellido: string;
  telefono: string;
  lider: string;
  liderNombre?: string;
  fechaInicio: string | null;
}