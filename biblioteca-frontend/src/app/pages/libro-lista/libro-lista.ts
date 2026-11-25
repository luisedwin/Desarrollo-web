import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ESTADOS_EJEMPLAR, Ejemplar, EstadoEjemplar } from '../../models/ejemplar';
import { Libro } from '../../models/libro';
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';
import { EjemplarService } from '../../services/ejemplar.service';
import { LibroService } from '../../services/libro.service';
import { ToastService } from '../../services/toast.service';
import { BookCoverTheme, obtenerTemaPortada } from '../../shared/book-theme';

type FiltroCatalogo = 'TODOS' | 'DISPONIBLES' | 'CLASICOS' | 'CONTEMPORANEOS';
type OrdenCatalogo = 'recientes' | 'titulo' | 'autor' | 'anio' | 'disponibilidad';

const CLASE_ESTADO: Record<EstadoEjemplar, string> = {
  DISPONIBLE: 'badge-verde',
  PRESTADO: 'badge-azul',
  MANTENIMIENTO: 'badge-amarillo',
  BAJA: 'badge-gris'
};

@Component({
  selector: 'app-libro-lista',
  imports: [RouterLink],
  templateUrl: './libro-lista.html',
  styleUrls: ['./libro-lista.css']
})
export class LibroLista implements OnInit {
  private readonly libroService = inject(LibroService);
  private readonly ejemplarService = inject(EjemplarService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  @ViewChild('buscadorRef') private buscadorRef?: ElementRef<HTMLInputElement>;

  protected readonly esAdmin = this.auth.esAdmin;
  protected readonly sesion = this.auth.sesion;

  protected readonly libros = signal<Libro[]>([]);
  protected readonly ejemplares = signal<Ejemplar[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtro = signal<FiltroCatalogo>('TODOS');
  protected readonly orden = signal<OrdenCatalogo>('recientes');
  protected readonly vista = signal<'grid' | 'tabla'>('grid');
  protected readonly libroSeleccionado = signal<Libro | null>(null);

  protected readonly primerNombre = computed(() => {
    const nombre = this.sesion()?.nombre?.trim() ?? '';
    return nombre.split(/\s+/)[0] || 'Lector';
  });

  protected readonly ejemplaresPorLibro = computed(() => {
    const mapa = new Map<number, Ejemplar[]>();
    for (const ej of this.ejemplares()) {
      const libroId = ej.libro?.id;
      if (libroId == null) continue;
      const lista = mapa.get(libroId) ?? [];
      lista.push(ej);
      mapa.set(libroId, lista);
    }
    return mapa;
  });

  protected readonly totalLibros = computed(() => this.libros().length);

  protected readonly totalAutores = computed(() => {
    const autores = this.libros()
      .map((l) => l.autor?.trim().toLowerCase())
      .filter((a): a is string => Boolean(a));
    return new Set(autores).size;
  });

  protected readonly totalEjemplares = computed(() => this.ejemplares().length);

  protected readonly totalDisponibles = computed(
    () => this.ejemplares().filter((e) => e.estado === 'DISPONIBLE').length
  );

  protected readonly porcentajeDisponibilidad = computed(() => {
    const total = this.totalEjemplares();
    if (!total) return 0;
    return Math.round((this.totalDisponibles() / total) * 100);
  });

  protected readonly ejemplaresDelSeleccionado = computed(() => {
    const libro = this.libroSeleccionado();
    if (!libro?.id) return [];
    return this.ejemplaresPorLibro().get(libro.id) ?? [];
  });

  protected readonly librosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtro = this.filtro();
    const orden = this.orden();
    const mapa = this.ejemplaresPorLibro();

    const filtrados = this.libros().filter((libro) => {
      const coincideTexto =
        !texto ||
        libro.titulo?.toLowerCase().includes(texto) ||
        libro.autor?.toLowerCase().includes(texto) ||
        libro.isbn?.toLowerCase().includes(texto) ||
        String(libro.anioPublicacion ?? '').includes(texto);

      if (!coincideTexto) return false;

      if (filtro === 'DISPONIBLES') {
        const copias = libro.id != null ? (mapa.get(libro.id) ?? []) : [];
        return copias.some((e) => e.estado === 'DISPONIBLE');
      }
      if (filtro === 'CLASICOS') {
        return libro.anioPublicacion != null && libro.anioPublicacion < 1980;
      }
      if (filtro === 'CONTEMPORANEOS') {
        return libro.anioPublicacion != null && libro.anioPublicacion >= 1980;
      }
      return true;
    });

    return [...filtrados].sort((a, b) => {
      switch (orden) {
        case 'titulo':
          return (a.titulo ?? '').localeCompare(b.titulo ?? '', 'es');
        case 'autor':
          return (a.autor ?? '').localeCompare(b.autor ?? '', 'es');
        case 'anio':
          return (b.anioPublicacion ?? -9999) - (a.anioPublicacion ?? -9999);
        case 'disponibilidad':
          return this.contarDisponibles(b.id) - this.contarDisponibles(a.id);
        default:
          return (b.id ?? 0) - (a.id ?? 0);
      }
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  @HostListener('document:keydown', ['$event'])
  protected manejarAtajos(evento: KeyboardEvent): void {
    if (evento.key === 'Escape' && this.libroSeleccionado()) {
      this.cerrarDetalle();
      return;
    }
    const target = evento.target as HTMLElement | null;
    const escribiendo =
      target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
    if (evento.key === '/' && !escribiendo && !this.libroSeleccionado()) {
      evento.preventDefault();
      this.buscadorRef?.nativeElement.focus();
    }
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      libros: this.libroService.listar(),
      ejemplares: this.ejemplarService.listar().pipe(catchError(() => of([] as Ejemplar[])))
    }).subscribe({
      next: ({ libros, ejemplares }) => {
        this.libros.set(libros);
        this.ejemplares.set(ejemplares);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(
          'No se pudo conectar con el servidor. Verifica que Spring Boot esté activo en el puerto 8080.'
        );
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

  protected cambiarFiltro(nuevo: FiltroCatalogo): void {
    this.filtro.set(nuevo);
  }

  protected cambiarOrden(evento: Event): void {
    this.orden.set((evento.target as HTMLSelectElement).value as OrdenCatalogo);
  }

  protected cambiarVista(modo: 'grid' | 'tabla'): void {
    this.vista.set(modo);
  }

  protected abrirDetalle(libro: Libro): void {
    this.libroSeleccionado.set(libro);
  }

  protected cerrarDetalle(): void {
    this.libroSeleccionado.set(null);
  }

  protected temaPortada(libro: Libro): BookCoverTheme {
    return obtenerTemaPortada(libro.id ?? libro.titulo);
  }

  protected contarCopias(libroId: number | undefined): number {
    if (libroId == null) return 0;
    return (this.ejemplaresPorLibro().get(libroId) ?? []).length;
  }

  protected contarDisponibles(libroId: number | undefined): number {
    if (libroId == null) return 0;
    return (this.ejemplaresPorLibro().get(libroId) ?? []).filter((e) => e.estado === 'DISPONIBLE').length;
  }

  protected textoEstado(estado: EstadoEjemplar): string {
    return ESTADOS_EJEMPLAR.find((e) => e.valor === estado)?.texto ?? estado;
  }

  protected claseEstado(estado: EstadoEjemplar): string {
    return CLASE_ESTADO[estado];
  }

  protected copiarIsbn(isbn: string, evento: Event): void {
    evento.stopPropagation();
    if (!isbn) return;
    navigator.clipboard?.writeText(isbn).then(
      () => this.toast.info('ISBN copiado', isbn),
      () => this.toast.info('Código ISBN', isbn)
    );
  }

  protected async eliminar(libro: Libro, evento?: Event): Promise<void> {
    evento?.stopPropagation();
    if (libro.id == null) return;

    const aceptado = await this.confirm.preguntar({
      titulo: 'Eliminar obra del catálogo',
      mensaje: `¿Deseas eliminar "${libro.titulo}" de ${libro.autor}? Esta acción no se puede deshacer.`,
      detalle: libro.isbn ? `ISBN: ${libro.isbn}` : `ID de catálogo #${libro.id}`,
      textoConfirmar: 'Eliminar obra',
      variante: 'peligro'
    });

    if (!aceptado) return;

    this.libroService.eliminar(libro.id).subscribe({
      next: () => {
        this.libros.update((lista) => lista.filter((l) => l.id !== libro.id));
        if (this.libroSeleccionado()?.id === libro.id) {
          this.cerrarDetalle();
        }
        this.toast.exito('Obra eliminada', `"${libro.titulo}" fue retirada del catálogo.`);
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : 'No se pudo eliminar el libro.';
        this.error.set(msg);
        this.toast.error('No se pudo eliminar', msg);
      }
    });
  }
}
