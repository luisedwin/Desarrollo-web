import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmacion = grupo.get('confirmacion')?.value;
  return password && confirmacion && password !== confirmacion ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html'
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      documento: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z-]{6,20}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telefono: ['', [Validators.pattern(/^[0-9 +-]{6,20}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmacion: ['', Validators.required]
    },
    { validators: passwordsIguales }
  );

  protected crearCuenta(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    const { confirmacion, ...valores } = this.form.getRawValue();
    this.auth.registrar({ ...valores, telefono: valores.telefono.trim() || null }).subscribe({
      next: () => this.router.navigate(['/libros']),
      error: (err) => {
        this.enviando.set(false);
        this.error.set(typeof err.error === 'string' ? err.error : 'No se pudo crear la cuenta.');
      }
    });
  }

  protected invalido(campo: 'nombre' | 'apellido' | 'documento' | 'email' | 'telefono' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  protected confirmacionInvalida(): boolean {
    const control = this.form.controls.confirmacion;
    return control.touched && (control.invalid || this.form.hasError('noCoinciden'));
  }
}
