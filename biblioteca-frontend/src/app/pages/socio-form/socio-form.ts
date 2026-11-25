import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Socio } from '../../models/socio';
import { SocioService } from '../../services/socio.service';
import { ToastService } from '../../services/toast.service';
import { obtenerGradienteAvatar, obtenerIniciales } from '../../shared/book-theme';

@Component({
  selector: 'app-socio-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './socio-form.html'
})
export class SocioForm implements OnInit {
  private readonly socioService = inject(SocioService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly id = input<string>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    documento: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z-]{6,20}$/)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.pattern(/^[0-9 +-]{6,20}$/)]],
    activo: [true]
  });

  protected readonly vistaPrevia = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  );

  protected readonly inicialesPreview = computed(() =>
    obtenerIniciales(this.vistaPrevia().nombre || 'A', this.vistaPrevia().apellido)
  );

  protected readonly avatarPreview = computed(() =>
    obtenerGradienteAvatar(this.vistaPrevia().documento || this.vistaPrevia().nombre || '1')
  );

  get esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.socioService.obtener(+id).subscribe({
        next: (socio) =>
          this.form.patchValue({
            ...socio,
            email: socio.email ?? '',
            telefono: socio.telefono ?? ''
          }),
        error: () => this.error.set('No se encontró el socio.')
      });
    }
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    const valores = this.form.getRawValue();
    const socio: Socio = {
      ...valores,
      email: valores.email.trim() || null,
      telefono: valores.telefono.trim() || null
    };
    const id = this.id();
    const peticion = id ? this.socioService.actualizar(+id, socio) : this.socioService.crear(socio);

    peticion.subscribe({
      next: () => {
        this.toast.exito(
          this.esEdicion ? 'Socio actualizado' : 'Socio registrado',
          `${socio.nombre} ${socio.apellido} fue guardado en el directorio.`
        );
        this.router.navigate(['/socios']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err.status === 409
            ? 'Ya existe un socio con ese documento o email.'
            : typeof err.error === 'string'
              ? err.error
              : 'No se pudo guardar el socio.'
        );
      }
    });
  }

  protected invalido(campo: 'nombre' | 'apellido' | 'documento' | 'email' | 'telefono'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
