import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ESTADOS_EJEMPLAR, EjemplarRequest, EstadoEjemplar } from '../../models/ejemplar';
import { Libro } from '../../models/libro';
import { EjemplarService } from '../../services/ejemplar.service';
import { LibroService } from '../../services/libro.service';
import { ToastService } from '../../services/toast.service';
import { obtenerTemaPortada } from '../../shared/book-theme';

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
  private readonly toast = inject(ToastService);

  readonly id = input<string>();
  // Query param opcional: /ejemplares/nuevo?libroId=1
  readonly libroId = input<string>();

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

  protected readonly vistaPrevia = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  );

  protected readonly libroSeleccionado = computed(() => {
    const id = this.vistaPrevia().libroId;
    return this.libros().find((l) => l.id === id) ?? null;
  });

  protected readonly colorPortada = computed(() =>
    obtenerTemaPortada(this.libroSeleccionado()?.id ?? 0).fondo
  );

  get esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    this.libroService.listar().subscribe((libros) => {
      this.libros.set(libros);
      const qLibroId = this.libroId();
      if (!this.id() && qLibroId && !this.form.controls.libroId.value) {
        this.form.controls.libroId.setValue(+qLibroId);
      }
    });

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

  protected textoEstado(estado: EstadoEjemplar): string {
    return ESTADOS_EJEMPLAR.find((e) => e.valor === estado)?.texto ?? estado;
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
      next: () => {
        this.toast.exito(
          this.esEdicion ? 'Ejemplar actualizado' : 'Ejemplar registrado',
          `La copia ${datos.codigo} se guardó en el inventario.`
        );
        this.router.navigate(['/ejemplares']);
      },
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
