import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS_EJEMPLAR, Ejemplar, EstadoEjemplar } from '../../models/ejemplar';
import { Libro } from '../../models/libro';
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';
import { EjemplarService } from '../../services/ejemplar.service';
import { LibroService } from '../../services/libro.service';
import { ToastService } from '../../services/toast.service';
import { obtenerTemaPortada } from '../../shared/book-theme';

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
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly esAdmin = inject(AuthService).esAdmin;

  // Query param opcional: /ejemplares?libroId=1
  readonly libroId = input<string>();

  protected readonly estados = ESTADOS_EJEMPLAR;
  protected readonly ejemplares = signal<Ejemplar[]>([]);
  protected readonly libros = signal<Libro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtroLibro = signal<number | null>(null);
  protected readonly filtroEstado = signal<EstadoEjemplar | null>(null);
  protected readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');

  protected readonly ejemplaresFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.ejemplares();
    return this.ejemplares().filter(
      (e) =>
        e.codigo?.toLowerCase().includes(texto) ||
        e.ubicacion?.toLowerCase().includes(texto) ||
        e.libro?.titulo?.toLowerCase().includes(texto) ||
        e.libro?.autor?.toLowerCase().includes(texto)
    );
  });

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

  protected buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected limpiarBusqueda(): void {
    this.busqueda.set('');
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
    this.busqueda.set('');
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

  protected colorLibro(libroId: number | undefined): string {
    return obtenerTemaPortada(libroId).fondo;
  }

  protected async eliminar(ejemplar: Ejemplar): Promise<void> {
    const aceptado = await this.confirm.preguntar({
      titulo: 'Eliminar ejemplar físico',
      mensaje: `¿Seguro que deseas retirar del inventario el ejemplar "${ejemplar.codigo}" de "${ejemplar.libro.titulo}"?`,
      detalle: ejemplar.ubicacion ? `Ubicación: ${ejemplar.ubicacion}` : `Código: ${ejemplar.codigo}`,
      textoConfirmar: 'Eliminar ejemplar',
      variante: 'peligro'
    });
    if (!aceptado) return;

    this.ejemplarService.eliminar(ejemplar.id).subscribe({
      next: () => {
        this.ejemplares.update((lista) => lista.filter((e) => e.id !== ejemplar.id));
        this.toast.exito('Ejemplar eliminado', `La copia ${ejemplar.codigo} fue retirada del inventario.`);
      },
      error: () => {
        const msg = 'No se puede eliminar: el ejemplar tiene préstamos registrados. Puedes cambiar su estado a "De baja".';
        this.error.set(msg);
        this.toast.error('No se pudo eliminar', msg);
      }
    });
  }
}
