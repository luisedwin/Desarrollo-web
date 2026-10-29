import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS_EJEMPLAR, Ejemplar, EstadoEjemplar } from '../../models/ejemplar';
import { Libro } from '../../models/libro';
import { AuthService } from '../../services/auth.service';
import { EjemplarService } from '../../services/ejemplar.service';
import { LibroService } from '../../services/libro.service';

const CLASE_ESTADO: Record<EstadoEjemplar, string> = {
  DISPONIBLE: 'badge-verde',
  PRESTADO: 'badge-azul',
  MANTENIMIENTO: 'badge-amarillo',
  BAJA: 'badge-gris'
};

@Component({
  selector: 'app-ejemplar-lista',
  imports: [RouterLink],
  templateUrl: './ejemplar-lista.html',
  styleUrls: ['./ejemplar-lista.css']
})
export class EjemplarLista implements OnInit {
  private readonly ejemplarService = inject(EjemplarService);
  private readonly libroService = inject(LibroService);

  protected readonly esAdmin = inject(AuthService).esAdmin;

  // Query param opcional: /ejemplares?libroId=1
  readonly libroId = input<string>();

  protected readonly estados = ESTADOS_EJEMPLAR;
  protected readonly ejemplares = signal<Ejemplar[]>([]);
  protected readonly libros = signal<Libro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filtroLibro = signal<number | null>(null);
  protected readonly filtroEstado = signal<EstadoEjemplar | null>(null);
  protected readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');

  protected readonly totalEjemplares = computed(() => this.ejemplares().length);
  protected readonly totalDisponibles = computed(
    () => this.ejemplares().filter((e) => e.estado === 'DISPONIBLE').length
  );
  protected readonly totalPrestados = computed(
    () => this.ejemplares().filter((e) => e.estado === 'PRESTADO').length
  );
  protected readonly totalMantenimiento = computed(
    () => this.ejemplares().filter((e) => e.estado === 'MANTENIMIENTO' || e.estado === 'BAJA').length
  );

  ngOnInit(): void {
    const libroId = this.libroId();
    if (libroId) this.filtroLibro.set(+libroId);
    this.libroService.listar().subscribe((libros) => this.libros.set(libros));
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.ejemplarService.listar({ libroId: this.filtroLibro(), estado: this.filtroEstado() }).subscribe({
      next: (ejemplares) => {
        this.ejemplares.set(ejemplares);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  protected cambiarLibro(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.filtroLibro.set(valor ? +valor : null);
    this.cargar();
  }

  protected cambiarEstado(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as EstadoEjemplar | '';
    this.filtroEstado.set(valor || null);
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.filtroLibro.set(null);
    this.filtroEstado.set(null);
    this.cargar();
  }

  protected cambiarVista(modo: 'tarjetas' | 'tabla'): void {
    this.vista.set(modo);
  }

  protected textoEstado(estado: EstadoEjemplar): string {
    return this.estados.find((e) => e.valor === estado)?.texto ?? estado;
  }

  protected claseEstado(estado: EstadoEjemplar): string {
    return CLASE_ESTADO[estado];
  }

  protected eliminar(ejemplar: Ejemplar): void {
    if (!confirm(`¿Eliminar el ejemplar ${ejemplar.codigo}?`)) return;
    this.ejemplarService.eliminar(ejemplar.id).subscribe({
      next: () => this.ejemplares.update((lista) => lista.filter((e) => e.id !== ejemplar.id)),
      error: () =>
        this.error.set('No se puede eliminar: el ejemplar tiene préstamos registrados. Puedes darlo de baja.')
    });
  }
}
