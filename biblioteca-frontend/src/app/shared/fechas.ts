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

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

// Diferencia en días enteros entre hoy y una fecha yyyy-MM-dd (positivo = faltan días, negativo = vencido)
export function diasHasta(fechaIsoStr: string | null | undefined): number {
  if (!fechaIsoStr) return 0;
  const destino = parseLocalDate(fechaIsoStr);
  if (!destino) return 0;
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((destino.getTime() - hoySinHora.getTime()) / msPorDia);
}

export function textoPlazo(fechaPrevista: string, devuelto: boolean, vencido: boolean): string {
  if (devuelto) return 'Entrega completada';
  const dias = diasHasta(fechaPrevista);
  if (vencido || dias < 0) {
    const atraso = Math.abs(dias);
    return atraso <= 1 ? 'Vencido hace 1 día' : `Vencido hace ${atraso} días`;
  }
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `Faltan ${dias} días`;
}

export function progresoPlazo(fechaInicio: string, fechaPrevista: string, devuelto: boolean): number {
  if (devuelto) return 100;
  const inicio = parseLocalDate(fechaInicio);
  const fin = parseLocalDate(fechaPrevista);
  if (!inicio || !fin) return 0;
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const total = Math.max(1, fin.getTime() - inicio.getTime());
  const transcurrido = hoySinHora.getTime() - inicio.getTime();
  return Math.max(6, Math.min(100, Math.round((transcurrido / total) * 100)));
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
