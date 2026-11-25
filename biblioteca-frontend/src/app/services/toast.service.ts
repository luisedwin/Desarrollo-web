import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'exito' | 'error' | 'info' | 'aviso';

export interface ToastItem {
  id: number;
  tipo: ToastTipo;
  titulo: string;
  mensaje?: string;
  duracion: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguienteId = 1;
  private readonly items = signal<ToastItem[]>([]);
  readonly toasts = this.items.asReadonly();

  mostrar(tipo: ToastTipo, titulo: string, mensaje?: string, duracion = 4200): void {
    const id = this.siguienteId++;
    this.items.update((actuales) => [...actuales.slice(-3), { id, tipo, titulo, mensaje, duracion }]);
    if (duracion > 0) {
      setTimeout(() => this.cerrar(id), duracion);
    }
  }

  exito(titulo: string, mensaje?: string): void {
    this.mostrar('exito', titulo, mensaje);
  }

  error(titulo: string, mensaje?: string): void {
    this.mostrar('error', titulo, mensaje, 5500);
  }

  info(titulo: string, mensaje?: string): void {
    this.mostrar('info', titulo, mensaje);
  }

  aviso(titulo: string, mensaje?: string): void {
    this.mostrar('aviso', titulo, mensaje, 4800);
  }

  cerrar(id: number): void {
    this.items.update((actuales) => actuales.filter((t) => t.id !== id));
  }
}
