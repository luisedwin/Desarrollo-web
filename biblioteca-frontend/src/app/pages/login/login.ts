import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (sesion) => this.router.navigate([sesion.rol === 'ADMIN' ? '/libros' : '/libros']),
      error: (err) => {
        this.enviando.set(false);
        this.error.set(
          err.status === 401 ? 'Email o contraseña incorrectos.' : 'No se pudo conectar con el servidor.'
        );
      }
    });
  }

  // Detecta si el correo escrito corresponde al administrador
  protected esCorreoAdmin(): boolean {
    const email = this.form.controls.email.value?.trim().toLowerCase();
    return email === 'admin@biblioteca.com';
  }

  // Permite autocompletar ÚNICAMENTE como usuario/lector para cualquier correo de usuario
  protected autocompletarUsuario(): void {
    const emailActual = this.form.controls.email.value?.trim().toLowerCase();

    // Bloqueo explícito: el administrador no puede usar autocompletado
    if (emailActual === 'admin@biblioteca.com') {
      this.error.set('El autocompletado no está permitido para el Administrador. Ingresa la contraseña manualmente.');
      return;
    }

    // Si ya escribió un correo de usuario, se mantiene; si está vacío, usa la cuenta demo
    const emailFinal = emailActual && emailActual.includes('@')
      ? emailActual
      : 'usuario@biblioteca.com';

    this.form.setValue({
      email: emailFinal,
      password: 'usuario1234'
    });
    this.entrar();
  }

  protected invalido(campo: 'email' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
