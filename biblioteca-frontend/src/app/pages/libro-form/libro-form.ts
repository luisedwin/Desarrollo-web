import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Libro } from '../../models/libro';
import { LibroService } from '../../services/libro.service';

@Component({
  selector: 'app-libro-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './libro-form.html'
})
export class LibroForm implements OnInit {
  private readonly libroService = inject(LibroService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Viene del parámetro :id de la ruta (gracias a withComponentInputBinding)
  readonly id = input<string>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly anioActual = new Date().getFullYear();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    autor: ['', [Validators.required, Validators.maxLength(150)]],
    isbn: ['', [Validators.pattern(/^[0-9-]{10,17}$/)]],
    anioPublicacion: [null as number | null, [Validators.min(0), Validators.max(this.anioActual)]]
  });

  get esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.libroService.obtener(+id).subscribe({
        next: (libro) => this.form.patchValue(libro),
        error: () => this.error.set('No se encontró el libro.')
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

    const libro: Libro = this.form.getRawValue();
    const id = this.id();
    const peticion = id ? this.libroService.actualizar(+id, libro) : this.libroService.crear(libro);

    peticion.subscribe({
      next: () => this.router.navigate(['/libros']),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(typeof err.error === 'string' ? err.error : 'No se pudo guardar el libro.');
      }
    });
  }

  protected invalido(campo: 'titulo' | 'autor' | 'isbn' | 'anioPublicacion'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
