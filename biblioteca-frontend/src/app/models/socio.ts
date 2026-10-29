export interface Socio {
  id?: number;
  nombre: string;
  apellido: string;
  documento: string;
  email: string | null;
  telefono: string | null;
  fechaRegistro?: string;
  activo: boolean;
}
