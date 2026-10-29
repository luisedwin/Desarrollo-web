import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Prestamo } from '../../models/prestamo';
import { PrestamoService } from '../../services/prestamo.service';
import { FechaPipe } from '../../shared/fechas';

@Component({
  selector: 'app-prestamo-lista',
  imports: [RouterLink, FechaPipe],
  templateUrl: './prestamo-lista.html',
  styleUrls: ['./prestamo-lista.css']
})
export class PrestamoLista implements OnInit {
  private readonly prestamoService = inject(PrestamoService);

  protected readonly prestamos = signal<Prestamo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly soloActivos = signal(true);
  protected readonly devolviendo = signal<number | null>(null);
  protected readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');

  protected readonly totalPrestamos = computed(() => this.prestamos().length);
  protected readonly totalActivos = computed(
    () => this.prestamos().filter((p) => !p.fechaDevolucionReal).length
  );
  protected readonly totalVencidos = computed(
    () => this.prestamos().filter((p) => !p.fechaDevolucionReal && p.vencido).length
  );
  protected readonly totalDevueltos = computed(
    () => this.prestamos().filter((p) => Boolean(p.fechaDevolucionReal)).length
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.prestamoService.listar(this.soloActivos()).subscribe({
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

  protected cambiarFiltro(evento: Event): void {
    this.soloActivos.set((evento.target as HTMLInputElement).checked);
    this.cargar();
  }

  protected cambiarVista(modo: 'tarjetas' | 'tabla'): void {
    this.vista.set(modo);
  }

  protected devolver(prestamo: Prestamo): void {
    const libro = prestamo.ejemplar.libro.titulo;
    if (!confirm(`¿Registrar la devolución de "${libro}" (${prestamo.ejemplar.codigo})?`)) return;
    this.devolviendo.set(prestamo.id);
    this.prestamoService.registrarDevolucion(prestamo.id).subscribe({
      next: () => {
        this.devolviendo.set(null);
        this.cargar();
      },
      error: (err) => {
        this.devolviendo.set(null);
        this.error.set(typeof err.error === 'string' ? err.error : 'No se pudo registrar la devolución.');
      }
    });
  }
}
