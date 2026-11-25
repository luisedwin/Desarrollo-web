import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Socio } from '../../models/socio';
import { ConfirmService } from '../../services/confirm.service';
import { SocioService } from '../../services/socio.service';
import { ToastService } from '../../services/toast.service';
import { obtenerGradienteAvatar, obtenerIniciales } from '../../shared/book-theme';
import { FechaPipe } from '../../shared/fechas';

@Component({
  selector: 'app-socio-lista',
  imports: [RouterLink, FechaPipe],
  templateUrl: './socio-lista.html',
  styleUrls: ['./socio-lista.css']
})
export class SocioLista implements OnInit {
  private readonly socioService = inject(SocioService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly socios = signal<Socio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtroActivo = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  protected readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');

  protected readonly totalSocios = computed(() => this.socios().length);
  protected readonly totalActivos = computed(() => this.socios().filter((s) => s.activo).length);
  protected readonly totalInactivos = computed(() => this.socios().filter((s) => !s.activo).length);

  protected readonly porcentajeActivos = computed(() => {
    const total = this.totalSocios();
    return total ? Math.round((this.totalActivos() / total) * 100) : 0;
  });

  protected readonly sociosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtro = this.filtroActivo();

    return this.socios().filter((s) => {
      const coincideTexto =
        !texto ||
        `${s.nombre} ${s.apellido} ${s.documento} ${s.email ?? ''} ${s.telefono ?? ''}`
          .toLowerCase()
          .includes(texto);
      const coincideEstado =
        filtro === 'TODOS' ||
        (filtro === 'ACTIVOS' && s.activo) ||
        (filtro === 'INACTIVOS' && !s.activo);
      return coincideTexto && coincideEstado;
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.socioService.listar().subscribe({
      next: (socios) => {
        this.socios.set(socios);
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

  protected cambiarFiltroEstado(nuevo: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.filtroActivo.set(nuevo);
  }

  protected cambiarVista(modo: 'tarjetas' | 'tabla'): void {
    this.vista.set(modo);
  }

  protected iniciales(socio: Socio): string {
    return obtenerIniciales(socio.nombre, socio.apellido);
  }

  protected gradienteAvatar(socio: Socio): string {
    return obtenerGradienteAvatar(socio.id ?? socio.documento);
  }

  protected copiarDocumento(documento: string): void {
    navigator.clipboard?.writeText(documento).then(
      () => this.toast.info('Documento copiado', documento),
      () => this.toast.info('Documento', documento)
    );
  }

  protected async eliminar(socio: Socio): Promise<void> {
    if (socio.id == null) return;
    const aceptado = await this.confirm.preguntar({
      titulo: 'Eliminar socio lector',
      mensaje: `¿Deseas eliminar la ficha de ${socio.nombre} ${socio.apellido}?`,
      detalle: `DNI: ${socio.documento}`,
      textoConfirmar: 'Eliminar socio',
      variante: 'peligro'
    });
    if (!aceptado) return;

    this.socioService.eliminar(socio.id).subscribe({
      next: () => {
        this.socios.update((lista) => lista.filter((s) => s.id !== socio.id));
        this.toast.exito('Socio eliminado', `${socio.nombre} ${socio.apellido} fue retirado del padrón.`);
      },
      error: () => {
        const msg = 'No se puede eliminar: el socio tiene préstamos registrados. Puedes marcarlo como inactivo.';
        this.error.set(msg);
        this.toast.error('No se pudo eliminar', msg);
      }
    });
  }
}
