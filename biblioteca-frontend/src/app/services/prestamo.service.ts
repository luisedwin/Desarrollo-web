import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Prestamo, PrestamoRequest } from '../models/prestamo';

@Injectable({ providedIn: 'root' })
export class PrestamoService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/prestamos';

  listar(soloActivos = false): Observable<Prestamo[]> {
    const params = new HttpParams().set('activos', soloActivos);
    return this.http.get<Prestamo[]>(this.url, { params });
  }

  // Préstamos del usuario que inició sesión
  listarMios(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(`${this.url}/mios`);
  }

  crear(datos: PrestamoRequest): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.url, datos);
  }

  registrarDevolucion(id: number): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.url}/${id}/devolucion`, {});
  }
}
