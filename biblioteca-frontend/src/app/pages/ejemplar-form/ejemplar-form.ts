import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ESTADOS_EJEMPLAR, EjemplarRequest, EstadoEjemplar } from '../../models/ejemplar';
import { Libro } from '../../models/libro';
import { EjemplarService } from '../../services/ejemplar.service';
import { LibroService } from '../../services/libro.service';

@Component({
  selector: 'app-ejemplar-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ejemplar-form.html'
})
export class EjemplarForm implements OnInit {
  private readonly ejemplarService = inject(EjemplarService);
  private readonly libroService = inject(LibroService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly id = input<string>();

  // "Prestado" no se elige a mano: lo ponen los préstamos
  protected readonly estados = ESTADOS_EJEMPLAR.filter((e) => e.valor !== 'PRESTADO');
  protected readonly libros = signal<Libro[]>([]);
  protected readonly prestado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    libroId: [null as number | null, Validators.required],
    codigo: ['', [Validators.required, Validators.maxLength(30)]],
    estado: ['DISPONIBLE' as EstadoEjemplar, Validators.required],
    ubicacion: ['', Validators.maxLength(100)]
  });

  get esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    this.libroService.listar().subscribe((libros) => this.libros.set(libros));

    const id = this.id();
    if (id) {
      this.ejemplarService.obtener(+id).subscribe({
        next: (ejemplar) => {
          this.form.patchValue({
            libroId: ejemplar.libro.id,
            codigo: ejemplar.codigo,
            estado: ejemplar.estado,
            ubicacion: ejemplar.ubicacion ?? ''
          });
          if (ejemplar.estado === 'PRESTADO') {
            this.prestado.set(true);
            this.form.controls.estado.disable();
          }
        },
        error: () => this.error.set('No se encontró el ejemplar.')
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
    const datos: EjemplarRequest = {
      libroId: valores.libroId!,
      codigo: valores.codigo.trim(),
      estado: valores.estado,
      ubicacion: valores.ubicacion.trim() || null
    };
    const id = this.id();
    const peticion = id ? this.ejemplarService.actualizar(+id, datos) : this.ejemplarService.crear(datos);

    peticion.subscribe({
      next: () => this.router.navigate(['/ejemplares']),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(typeof err.error === 'string' ? err.error : 'No se pudo guardar el ejemplar.');
      }
    });
  }

  protected invalido(campo: 'libroId' | 'codigo'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
