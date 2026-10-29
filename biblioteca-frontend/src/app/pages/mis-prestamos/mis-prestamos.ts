import { Component, OnInit, inject, signal } from '@angular/core';
import { Prestamo } from '../../models/prestamo';
import { PrestamoService } from '../../services/prestamo.service';
import { FechaPipe } from '../../shared/fechas';

@Component({
  selector: 'app-mis-prestamos',
  imports: [FechaPipe],
  templateUrl: './mis-prestamos.html'
})
export class MisPrestamos implements OnInit {
  private readonly prestamoService = inject(PrestamoService);

  protected readonly prestamos = signal<Prestamo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
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
}
