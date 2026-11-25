import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Ejemplar } from '../../models/ejemplar';
import { Libro } from '../../models/libro';
import { Prestamo } from '../../models/prestamo';
import { Socio } from '../../models/socio';
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';
import { EjemplarService } from '../../services/ejemplar.service';
import { LibroService } from '../../services/libro.service';
import { PrestamoService } from '../../services/prestamo.service';
import { SocioService } from '../../services/socio.service';
import { ToastService } from '../../services/toast.service';
import { obtenerGradienteAvatar, obtenerIniciales, obtenerTemaPortada } from '../../shared/book-theme';
import { FechaPipe, diasHasta, textoPlazo } from '../../shared/fechas';

@Component({
  selector: 'app-panel',
  imports: [RouterLink, FechaPipe],
  templateUrl: './panel.html',
  styleUrls: ['./panel.css']
})
export class Panel implements OnInit {
  private readonly libroService = inject(LibroService);
  private readonly ejemplarService = inject(EjemplarService);
  private readonly socioService = inject(SocioService);
  private readonly prestamoService = inject(PrestamoService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly sesion = this.auth.sesion;
  protected readonly libros = signal<Libro[]>([]);
  protected readonly ejemplares = signal<Ejemplar[]>([]);
  protected readonly socios = signal<Socio[]>([]);
  protected readonly prestamos = signal<Prestamo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly devolviendo = signal<number | null>(null);

  protected readonly fechaHoyTexto = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  protected readonly totalLibros = computed(() => this.libros().length);
  protected readonly totalAutores = computed(
    () => new Set(this.libros().map((l) => l.autor?.trim().toLowerCase()).filter(Boolean)).size
  );

  protected readonly totalEjemplares = computed(() => this.ejemplares().length);
  protected readonly disponibles = computed(
    () => this.ejemplares().filter((e) => e.estado === 'DISPONIBLE').length
  );
  protected readonly prestadosEj = computed(
    () => this.ejemplares().filter((e) => e.estado === 'PRESTADO').length
  );
  protected readonly mantenimiento = computed(
    () => this.ejemplares().filter((e) => e.estado === 'MANTENIMIENTO').length
  );
  protected readonly baja = computed(
    () => this.ejemplares().filter((e) => e.estado === 'BAJA').length
  );

  protected readonly totalSocios = computed(() => this.socios().length);
  protected readonly sociosActivos = computed(() => this.socios().filter((s) => s.activo).length);

  protected readonly prestamosActivos = computed(() =>
    this.prestamos().filter((p) => !p.fechaDevolucionReal)
  );
  protected readonly prestamosVencidos = computed(() =>
    this.prestamosActivos().filter((p) => p.vencido || diasHasta(p.fechaDevolucionPrevista) < 0)
  );
  protected readonly prestamosDevueltos = computed(() =>
    this.prestamos().filter((p) => Boolean(p.fechaDevolucionReal))
  );

  protected readonly tasaDisponibilidad = computed(() => {
    const total = this.totalEjemplares();
    return total ? Math.round((this.disponibles() / total) * 100) : 0;
  });

  protected readonly pctDisponible = computed(() => this.porcentaje(this.disponibles(), this.totalEjemplares()));
  protected readonly pctPrestado = computed(() => this.porcentaje(this.prestadosEj(), this.totalEjemplares()));
  protected readonly pctMantenimiento = computed(() => this.porcentaje(this.mantenimiento(), this.totalEjemplares()));
  protected readonly pctBaja = computed(() => this.porcentaje(this.baja(), this.totalEjemplares()));

  protected readonly prestamosAtencion = computed(() =>
    [...this.prestamosActivos()]
      .sort((a, b) => diasHasta(a.fechaDevolucionPrevista) - diasHasta(b.fechaDevolucionPrevista))
      .slice(0, 5)
  );

  protected readonly librosDestacados = computed(() => {
    const conteo = new Map<number, { total: number; disp: number }>();
    for (const ej of this.ejemplares()) {
      const id = ej.libro?.id;
      if (id == null) continue;
      const actual = conteo.get(id) ?? { total: 0, disp: 0 };
      actual.total++;
      if (ej.estado === 'DISPONIBLE') actual.disp++;
      conteo.set(id, actual);
    }
    return this.libros()
      .map((libro) => ({
        libro,
        total: libro.id != null ? (conteo.get(libro.id)?.total ?? 0) : 0,
        disp: libro.id != null ? (conteo.get(libro.id)?.disp ?? 0) : 0,
        tema: obtenerTemaPortada(libro.id ?? libro.titulo)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      libros: this.libroService.listar(),
      ejemplares: this.ejemplarService.listar(),
      socios: this.socioService.listar(),
      prestamos: this.prestamoService.listar(false)
    }).subscribe({
      next: ({ libros, ejemplares, socios, prestamos }) => {
        this.libros.set(libros);
        this.ejemplares.set(ejemplares);
        this.socios.set(socios);
        this.prestamos.set(prestamos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las métricas del panel. Verifica la conexión con el backend.');
        this.cargando.set(false);
      }
    });
  }

  protected async devolver(prestamo: Prestamo): Promise<void> {
    const aceptado = await this.confirm.preguntar({
      titulo: 'Confirmar devolución',
      mensaje: `¿Registrar la devolución de "${prestamo.ejemplar.libro.titulo}" entregado por ${prestamo.socio.nombre} ${prestamo.socio.apellido}?`,
      detalle: `Ejemplar ${prestamo.ejemplar.codigo}`,
      textoConfirmar: 'Registrar devolución',
      variante: 'dorado'
    });
    if (!aceptado) return;

    this.devolviendo.set(prestamo.id);
    this.prestamoService.registrarDevolucion(prestamo.id).subscribe({
      next: () => {
        this.devolviendo.set(null);
        this.toast.exito('Devolución registrada', `El ejemplar ${prestamo.ejemplar.codigo} vuelve a estar disponible.`);
        this.cargar();
      },
      error: (err) => {
        this.devolviendo.set(null);
        const msg = typeof err.error === 'string' ? err.error : 'No se pudo registrar la devolución.';
        this.toast.error('Error al devolver', msg);
      }
    });
  }

  protected plazo(p: Prestamo): string {
    return textoPlazo(p.fechaDevolucionPrevista, Boolean(p.fechaDevolucionReal), p.vencido);
  }

  protected esUrgente(p: Prestamo): boolean {
    return !p.fechaDevolucionReal && (p.vencido || diasHasta(p.fechaDevolucionPrevista) <= 2);
  }

  protected iniciales(nombre: string, apellido: string): string {
    return obtenerIniciales(nombre, apellido);
  }

  protected gradienteAvatar(id: number | undefined): string {
    return obtenerGradienteAvatar(id);
  }

  private porcentaje(parte: number, total: number): number {
    if (!total) return 0;
    return Math.round((parte / total) * 100);
  }
}
