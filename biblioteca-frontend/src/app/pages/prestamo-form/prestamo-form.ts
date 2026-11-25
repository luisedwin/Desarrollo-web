import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Ejemplar } from '../../models/ejemplar';
import { Socio } from '../../models/socio';
import { EjemplarService } from '../../services/ejemplar.service';
import { PrestamoService } from '../../services/prestamo.service';
import { SocioService } from '../../services/socio.service';
import { ToastService } from '../../services/toast.service';
import { FechaPipe, diasHasta, sumarDias } from '../../shared/fechas';

const DIAS_PRESTAMO = 14;

@Component({
  selector: 'app-prestamo-form',
  imports: [ReactiveFormsModule, RouterLink, FechaPipe],
  templateUrl: './prestamo-form.html'
})
export class PrestamoForm implements OnInit {
  private readonly prestamoService = inject(PrestamoService);
  private readonly socioService = inject(SocioService);
  private readonly ejemplarService = inject(EjemplarService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  // Query param opcional: /prestamos/nuevo?ejemplarId=5
  readonly ejemplarId = input<string>();

  protected readonly hoy = sumarDias(0);
  protected readonly plazosRapidos = [7, 14, 21, 30];
  protected readonly socios = signal<Socio[]>([]);
  protected readonly ejemplares = signal<Ejemplar[]>([]);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    socioId: [null as number | null, Validators.required],
    ejemplarId: [null as number | null, Validators.required],
    fechaDevolucionPrevista: [sumarDias(DIAS_PRESTAMO), Validators.required]
  });

  protected readonly vistaPrevia = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  );

  protected readonly socioSeleccionado = computed(() => {
    const id = this.vistaPrevia().socioId;
    return this.socios().find((s) => s.id === id) ?? null;
  });

  protected readonly ejemplarSeleccionado = computed(() => {
    const id = this.vistaPrevia().ejemplarId;
    return this.ejemplares().find((e) => e.id === id) ?? null;
  });

  protected readonly diasSeleccionados = computed(() =>
    Math.max(0, diasHasta(this.vistaPrevia().fechaDevolucionPrevista))
  );

  ngOnInit(): void {
    this.socioService.listar().subscribe((socios) => this.socios.set(socios.filter((s) => s.activo)));
    this.ejemplarService.listar({ estado: 'DISPONIBLE' }).subscribe((ejemplares) => {
      this.ejemplares.set(ejemplares);
      const qEj = this.ejemplarId();
      if (qEj && ejemplares.some((e) => e.id === +qEj)) {
        this.form.controls.ejemplarId.setValue(+qEj);
      }
    });
  }

  protected aplicarPlazo(dias: number): void {
    this.form.controls.fechaDevolucionPrevista.setValue(sumarDias(dias));
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
        next: () => {
          const socio = this.socioSeleccionado();
          const ej = this.ejemplarSeleccionado();
          this.toast.exito(
            'Préstamo registrado',
            socio && ej
              ? `"${ej.libro.titulo}" (${ej.codigo}) entregado a ${socio.nombre} ${socio.apellido}.`
              : 'La entrega se registró correctamente.'
          );
          this.router.navigate(['/prestamos']);
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(typeof err.error === 'string' ? err.error : 'No se pudo registrar el préstamo.');
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
