import { Ejemplar } from './ejemplar';
import { Socio } from './socio';

export type EstadoPrestamo = 'ACTIVO' | 'DEVUELTO' | 'VENCIDO';

export interface Prestamo {
  id: number;
  ejemplar: Ejemplar;
  socio: Socio;
  fechaPrestamo: string;
  fechaDevolucionPrevista: string;
  fechaDevolucionReal: string | null;
  estado: EstadoPrestamo;
  vencido: boolean;
}

export interface PrestamoRequest {
  ejemplarId: number;
  socioId: number;
  fechaDevolucionPrevista: string;
}
