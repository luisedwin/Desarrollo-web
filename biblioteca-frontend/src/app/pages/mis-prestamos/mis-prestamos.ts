import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Prestamo } from '../../models/prestamo';
import { PrestamoService } from '../../services/prestamo.service';
import { obtenerTemaPortada } from '../../shared/book-theme';
import { FechaPipe, diasHasta, progresoPlazo, textoPlazo } from '../../shared/fechas';

@Component({
  selector: 'app-mis-prestamos',
  imports: [RouterLink, FechaPipe],
  templateUrl: './mis-prestamos.html',
  styleUrls: ['./mis-prestamos.css']
})
export class MisPrestamos implements OnInit {
  private readonly prestamoService = inject(PrestamoService);

  protected readonly prestamos = signal<Prestamo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal<'ACTIVOS' | 'HISTORIAL' | 'TODOS'>('TODOS');
  protected readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');

  protected readonly activos = computed(() =>
    this.prestamos().filter((p) => !p.fechaDevolucionReal).length
  );
  protected readonly vencidos = computed(
    () =>
      this.prestamos().filter(
        (p) => !p.fechaDevolucionReal && (p.vencido || diasHasta(p.fechaDevolucionPrevista) < 0)
      ).length
  );
  protected readonly devueltos = computed(() =>
    this.prestamos().filter((p) => Boolean(p.fechaDevolucionReal)).length
  );

  protected readonly prestamosFiltrados = computed(() => {
    const filtro = this.filtro();
    return this.prestamos().filter((p) => {
      const devuelto = Boolean(p.fechaDevolucionReal);
      if (filtro === 'ACTIVOS') return !devuelto;
      if (filtro === 'HISTORIAL') return devuelto;
      return true;
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.prestamoService.listarMios().subscribe({
      next: (prestamos) => {
        this.prestamos.set(prestamos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus préstamos.');
        this.cargando.set(false);
      }
    });
  }

  protected esVencido(p: Prestamo): boolean {
    return !p.fechaDevolucionReal && (p.vencido || diasHasta(p.fechaDevolucionPrevista) < 0);
  }

  protected plazo(p: Prestamo): string {
    return textoPlazo(p.fechaDevolucionPrevista, Boolean(p.fechaDevolucionReal), p.vencido);
  }

  protected progreso(p: Prestamo): number {
    return progresoPlazo(p.fechaPrestamo, p.fechaDevolucionPrevista, Boolean(p.fechaDevolucionReal));
  }

  protected claseProgreso(p: Prestamo): string {
    if (p.fechaDevolucionReal) return 'fill-exito';
    if (this.esVencido(p)) return 'fill-peligro';
    if (diasHasta(p.fechaDevolucionPrevista) <= 2) return 'fill-aviso';
    return '';
  }

  protected colorLibro(p: Prestamo): string {
    return obtenerTemaPortada(p.ejemplar.libro.id).fondo;
  }
}
