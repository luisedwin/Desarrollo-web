import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

interface CitaLiteraria {
  texto: string;
  autor: string;
}

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
  private readonly toast = inject(ToastService);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mostrarPassword = signal(false);
  protected readonly citaActiva = signal(0);

  protected readonly citas: CitaLiteraria[] = [
    {
      texto: 'Un libro es una versión portátil de un amigo sabio, siempre dispuesto a conversar en silencio.',
      autor: 'Colección San Lorenzo'
    },
    {
      texto: 'Siempre imaginé que el Paraíso sería algún tipo de biblioteca.',
      autor: 'Jorge Luis Borges'
    },
    {
      texto: 'La lectura hace al hombre completo; la conversación, ágil; y el escribir, preciso.',
      autor: 'Francis Bacon'
    }
  ];

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected seleccionarCita(indice: number): void {
    this.citaActiva.set(indice);
  }

  protected togglePassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (sesion) => {
        this.toast.exito(
          `Bienvenido, ${sesion.nombre}`,
          sesion.rol === 'ADMIN' ? 'Sesión de administración activa.' : 'Explora el catálogo y tus préstamos.'
        );
        this.router.navigate(['/libros']);
      },
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

    if (emailActual === 'admin@biblioteca.com') {
      this.error.set('El autocompletado no está permitido para el Administrador. Ingresa la contraseña manualmente.');
      return;
    }

    const emailFinal =
      emailActual && emailActual.includes('@') ? emailActual : 'usuario@biblioteca.com';

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
