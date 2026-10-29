import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Libro } from '../../models/libro';
import { AuthService } from '../../services/auth.service';
import { LibroService } from '../../services/libro.service';

@Component({
  selector: 'app-libro-lista',
  imports: [RouterLink],
  templateUrl: './libro-lista.html',
  styleUrls: ['./libro-lista.css']
})
export class LibroLista implements OnInit {
  private readonly libroService = inject(LibroService);

  // Los lectores solo consultan; crear, editar y eliminar es del admin
  protected readonly esAdmin = inject(AuthService).esAdmin;

  protected readonly libros = signal<Libro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly vista = signal<'grid' | 'tabla'>('grid');

  protected readonly totalLibros = computed(() => this.libros().length);
  protected readonly totalAutores = computed(() => {
    const autores = this.libros()
      .map((l) => l.autor?.trim())
      .filter((a): a is string => Boolean(a));
    return new Set(autores).size;
  });

  protected readonly librosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.libros();
    return this.libros().filter(
      (l) => l.titulo?.toLowerCase().includes(texto) || l.autor?.toLowerCase().includes(texto) || l.isbn?.toLowerCase().includes(texto)
    );
  });

  private readonly paletasPortadas = [
    'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)', // Indigo Profundo
    'linear-gradient(145deg, #14532d 0%, #064e3b 100%)', // Verde Esmeralda Editorial
    'linear-gradient(145deg, #7c2d12 0%, #451a03 100%)', // Cuero Borgoña
    'linear-gradient(145deg, #581c87 0%, #3b0764 100%)', // Amatista Imperial
    'linear-gradient(145deg, #1e3a8a 0%, #0f172a 100%)', // Zafiro Real
    'linear-gradient(145deg, #701a75 0%, #4a044e 100%)'  // Magenta Clásico
  ];

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.libroService.listar().subscribe({
      next: (libros) => {
        this.libros.set(libros);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor. ¿Está corriendo Spring Boot en el puerto 8080?');
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

  protected cambiarVista(modo: 'grid' | 'tabla'): void {
    this.vista.set(modo);
  }

  protected obtenerGradiente(id: number | null | undefined): string {
    const idx = Math.abs(Number(id || 0)) % this.paletasPortadas.length;
    return this.paletasPortadas[idx];
  }

  protected eliminar(libro: Libro): void {
    if (libro.id == null || !confirm(`¿Eliminar "${libro.titulo}"?`)) return;
    this.libroService.eliminar(libro.id).subscribe({
      next: () => this.libros.update((lista) => lista.filter((l) => l.id !== libro.id)),
      error: (err) =>
        this.error.set(typeof err.error === 'string' ? err.error : 'No se pudo eliminar el libro.')
    });
  }
}
