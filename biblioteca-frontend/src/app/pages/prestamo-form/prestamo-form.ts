import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Ejemplar } from '../../models/ejemplar';
import { Socio } from '../../models/socio';
import { EjemplarService } from '../../services/ejemplar.service';
import { PrestamoService } from '../../services/prestamo.service';
import { SocioService } from '../../services/socio.service';
import { sumarDias } from '../../shared/fechas';

const DIAS_PRESTAMO = 14;

@Component({
  selector: 'app-prestamo-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './prestamo-form.html'
})
export class PrestamoForm implements OnInit {
  private readonly prestamoService = inject(PrestamoService);
  private readonly socioService = inject(SocioService);
  private readonly ejemplarService = inject(EjemplarService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly hoy = sumarDias(0);
  protected readonly socios = signal<Socio[]>([]);
  protected readonly ejemplares = signal<Ejemplar[]>([]);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    socioId: [null as number | null, Validators.required],
    ejemplarId: [null as number | null, Validators.required],
    fechaDevolucionPrevista: [sumarDias(DIAS_PRESTAMO), Validators.required]
  });

  ngOnInit(): void {
    // Solo se ofrecen socios activos y ejemplares disponibles
    this.socioService.listar().subscribe((socios) => this.socios.set(socios.filter((s) => s.activo)));
    this.ejemplarService
      .listar({ estado: 'DISPONIBLE' })
      .subscribe((ejemplares) => this.ejemplares.set(ejemplares));
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    if (valores.fechaDevolucionPrevista < this.hoy) {
      this.error.set('La fecha de devolución no puede estar en el pasado.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    this.prestamoService
      .crear({
        socioId: valores.socioId!,
        ejemplarId: valores.ejemplarId!,
        fechaDevolucionPrevista: valores.fechaDevolucionPrevista
      })
      .subscribe({
        next: () => this.router.navigate(['/prestamos']),
        error: (err) => {
          this.guardando.set(false);
          this.error.set(typeof err.error === 'string' ? err.error : 'No se pudo registrar el préstamo.');
          // Puede que otro usuario lo haya prestado mientras tanto: refrescamos la lista
          this.ejemplarService
            .listar({ estado: 'DISPONIBLE' })
            .subscribe((ejemplares) => this.ejemplares.set(ejemplares));
        }
      });
  }

  protected invalido(campo: 'socioId' | 'ejemplarId' | 'fechaDevolucionPrevista'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
