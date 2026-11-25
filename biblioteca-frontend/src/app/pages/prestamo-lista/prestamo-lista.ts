import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Prestamo } from '../../models/prestamo';
import { ConfirmService } from '../../services/confirm.service';
import { PrestamoService } from '../../services/prestamo.service';
import { ToastService } from '../../services/toast.service';
import { obtenerGradienteAvatar, obtenerIniciales, obtenerTemaPortada } from '../../shared/book-theme';
import { FechaPipe, diasHasta, progresoPlazo, textoPlazo } from '../../shared/fechas';

type FiltroPrestamo = 'ACTIVOS' | 'VENCIDOS' | 'DEVUELTOS' | 'TODOS';

@Component({
  selector: 'app-prestamo-lista',
  imports: [RouterLink, FechaPipe],
  templateUrl: './prestamo-lista.html',
  styleUrls: ['./prestamo-lista.css']
})
export class PrestamoLista implements OnInit {
  private readonly prestamoService = inject(PrestamoService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly prestamos = signal<Prestamo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtro = signal<FiltroPrestamo>('ACTIVOS');
  protected readonly devolviendo = signal<number | null>(null);
  protected readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');

  protected readonly totalPrestamos = computed(() => this.prestamos().length);
  protected readonly totalActivos = computed(
    () => this.prestamos().filter((p) => !p.fechaDevolucionReal).length
  );
  protected readonly totalVencidos = computed(
    () =>
      this.prestamos().filter(
        (p) => !p.fechaDevolucionReal && (p.vencido || diasHasta(p.fechaDevolucionPrevista) < 0)
      ).length
  );
  protected readonly totalDevueltos = computed(
    () => this.prestamos().filter((p) => Boolean(p.fechaDevolucionReal)).length
  );

  protected readonly prestamosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtro = this.filtro();

    return this.prestamos().filter((p) => {
      const devuelto = Boolean(p.fechaDevolucionReal);
      const vencido = !devuelto && (p.vencido || diasHasta(p.fechaDevolucionPrevista) < 0);

      if (filtro === 'ACTIVOS' && devuelto) return false;
      if (filtro === 'VENCIDOS' && !vencido) return false;
      if (filtro === 'DEVUELTOS' && !devuelto) return false;

      if (!texto) return true;
      const corpus =
        `${p.socio.nombre} ${p.socio.apellido} ${p.socio.documento} ${p.ejemplar.codigo} ${p.ejemplar.libro.titulo} ${p.ejemplar.libro.autor}`.toLowerCase();
      return corpus.includes(texto);
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.prestamoService.listar(false).subscribe({
      next: (prestamos) => {
        this.prestamos.set(prestamos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  protected buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  protected cambiarFiltro(nuevo: FiltroPrestamo): void {
    this.filtro.set(nuevo);
  }

  protected cambiarVista(modo: 'tarjetas' | 'tabla'): void {
    this.vista.set(modo);
  }

  protected textoPlazo(p: Prestamo): string {
    return textoPlazo(p.fechaDevolucionPrevista, Boolean(p.fechaDevolucionReal), p.vencido);
  }

  protected progreso(p: Prestamo): number {
    return progresoPlazo(p.fechaPrestamo, p.fechaDevolucionPrevista, Boolean(p.fechaDevolucionReal));
  }

  protected claseProgreso(p: Prestamo): string {
    if (p.fechaDevolucionReal) return 'fill-exito';
    if (p.vencido || diasHasta(p.fechaDevolucionPrevista) < 0) return 'fill-peligro';
    if (diasHasta(p.fechaDevolucionPrevista) <= 2) return 'fill-aviso';
    return '';
  }

  protected esVencido(p: Prestamo): boolean {
    return !p.fechaDevolucionReal && (p.vencido || diasHasta(p.fechaDevolucionPrevista) < 0);
  }

  protected iniciales(p: Prestamo): string {
    return obtenerIniciales(p.socio.nombre, p.socio.apellido);
  }

  protected gradienteAvatar(p: Prestamo): string {
    return obtenerGradienteAvatar(p.socio.id ?? p.socio.documento);
  }

  protected colorLibro(p: Prestamo): string {
    return obtenerTemaPortada(p.ejemplar.libro.id).fondo;
  }

  protected async devolver(prestamo: Prestamo): Promise<void> {
    const libro = prestamo.ejemplar.libro.titulo;
    const aceptado = await this.confirm.preguntar({
      titulo: 'Registrar devolución',
      mensaje: `¿Confirmar la devolución de "${libro}" entregada por ${prestamo.socio.nombre} ${prestamo.socio.apellido}?`,
      detalle: `Ejemplar ${prestamo.ejemplar.codigo} · Préstamo #${prestamo.id}`,
      textoConfirmar: 'Confirmar devolución',
      variante: 'dorado'
    });
    if (!aceptado) return;

    this.devolviendo.set(prestamo.id);
    this.prestamoService.registrarDevolucion(prestamo.id).subscribe({
      next: () => {
        this.devolviendo.set(null);
        this.toast.exito('Devolución completada', `"${libro}" (${prestamo.ejemplar.codigo}) ya está disponible.`);
        this.cargar();
      },
      error: (err) => {
        this.devolviendo.set(null);
        const msg = typeof err.error === 'string' ? err.error : 'No se pudo registrar la devolución.';
        this.error.set(msg);
        this.toast.error('Error al devolver', msg);
      }
    });
  }
}
