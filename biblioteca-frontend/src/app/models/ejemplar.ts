import { Libro } from './libro';

export type EstadoEjemplar = 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'BAJA';

export const ESTADOS_EJEMPLAR: { valor: EstadoEjemplar; texto: string }[] = [
  { valor: 'DISPONIBLE', texto: 'Disponible' },
  { valor: 'PRESTADO', texto: 'Prestado' },
  { valor: 'MANTENIMIENTO', texto: 'Mantenimiento' },
  { valor: 'BAJA', texto: 'De baja' }
];

export interface Ejemplar {
  id: number;
  libro: Libro;
  codigo: string;
  estado: EstadoEjemplar;
  ubicacion: string | null;
}

// Lo que se envía al backend para crear o editar (el libro va solo por su ID)
export interface EjemplarRequest {
  libroId: number;
  codigo: string;
  estado: EstadoEjemplar;
  ubicacion: string | null;
}
