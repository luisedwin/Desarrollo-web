import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  titulo: string;
  mensaje: string;
  detalle?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: 'peligro' | 'dorado' | 'primario';
}

interface ConfirmState extends ConfirmOptions {
  resolver: (aceptado: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly estadoActual = signal<ConfirmState | null>(null);
  readonly estado = this.estadoActual.asReadonly();

  preguntar(opciones: ConfirmOptions): Promise<boolean> {
    const anterior = this.estadoActual();
    if (anterior) {
      anterior.resolver(false);
    }

    return new Promise<boolean>((resolve) => {
      this.estadoActual.set({
        textoConfirmar: 'Confirmar',
        textoCancelar: 'Cancelar',
        variante: 'primario',
        ...opciones,
        resolver: resolve
      });
    });
  }

  responder(aceptado: boolean): void {
    const actual = this.estadoActual();
    if (!actual) return;
    this.estadoActual.set(null);
    actual.resolver(aceptado);
  }
}
