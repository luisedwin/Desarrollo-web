import { Pipe, PipeTransform } from '@angular/core';

// Fecha local en formato yyyy-MM-dd (el que usa <input type="date"> y el backend)
export function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function sumarDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fechaIso(fecha);
}

// Muestra '2026-10-01' como '01/10/2026' sin pasar por zonas horarias
// (DatePipe la interpretaría como UTC y en Perú saldría un día antes)
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '—';
    const [anio, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${anio}`;
  }
}
