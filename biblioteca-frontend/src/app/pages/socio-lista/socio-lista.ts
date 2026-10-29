import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Socio } from '../../models/socio';
import { SocioService } from '../../services/socio.service';
import { FechaPipe } from '../../shared/fechas';

@Component({
  selector: 'app-socio-lista',
  imports: [RouterLink, FechaPipe],
  templateUrl: './socio-lista.html',
  styleUrls: ['./socio-lista.css']
})
export class SocioLista implements OnInit {
  private readonly socioService = inject(SocioService);

  protected readonly socios = signal<Socio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtroActivo = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  protected readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');

  protected readonly totalSocios = computed(() => this.socios().length);
  protected readonly totalActivos = computed(() => this.socios().filter((s) => s.activo).length);
  protected readonly totalInactivos = computed(() => this.socios().filter((s) => !s.activo).length);

  protected readonly sociosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtro = this.filtroActivo();

    return this.socios().filter((s) => {
      const coincideTexto = !texto || `${s.nombre} ${s.apellido} ${s.documento} ${s.email ?? ''}`.toLowerCase().includes(texto);
      const coincideEstado = filtro === 'TODOS' || (filtro === 'ACTIVOS' && s.activo) || (filtro === 'INACTIVOS' && !s.activo);
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

  protected eliminar(socio: Socio): void {
    if (socio.id == null || !confirm(`¿Eliminar a ${socio.nombre} ${socio.apellido}?`)) return;
    this.socioService.eliminar(socio.id).subscribe({
      next: () => this.socios.update((lista) => lista.filter((s) => s.id !== socio.id)),
      error: () =>
        this.error.set('No se puede eliminar: el socio tiene préstamos registrados. Puedes marcarlo como inactivo.')
    });
  }
}
