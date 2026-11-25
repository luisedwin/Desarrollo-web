import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Libro } from '../../models/libro';
import { LibroService } from '../../services/libro.service';
import { ToastService } from '../../services/toast.service';
import { obtenerTemaPortada } from '../../shared/book-theme';

@Component({
  selector: 'app-libro-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './libro-form.html'
})
export class LibroForm implements OnInit {
  private readonly libroService = inject(LibroService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

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

  protected readonly vistaPrevia = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  );

  protected readonly temaPreview = computed(() =>
    obtenerTemaPortada(this.id() ? +this.id()! : this.vistaPrevia().titulo || 'Athenaeum')
  );

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
      next: () => {
        this.toast.exito(
          this.esEdicion ? 'Obra actualizada' : 'Obra registrada',
          `"${libro.titulo}" se guardó correctamente en el catálogo.`
        );
        this.router.navigate(['/libros']);
      },
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
