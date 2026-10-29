import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ejemplar, EjemplarRequest, EstadoEjemplar } from '../models/ejemplar';

@Injectable({ providedIn: 'root' })
export class EjemplarService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/ejemplares';

  listar(filtros: { libroId?: number | null; estado?: EstadoEjemplar | null } = {}): Observable<Ejemplar[]> {
    let params = new HttpParams();
    if (filtros.libroId) params = params.set('libroId', filtros.libroId);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return this.http.get<Ejemplar[]>(this.url, { params });
  }

  obtener(id: number): Observable<Ejemplar> {
    return this.http.get<Ejemplar>(`${this.url}/${id}`);
  }

  crear(datos: EjemplarRequest): Observable<Ejemplar> {
    return this.http.post<Ejemplar>(this.url, datos);
  }

  actualizar(id: number, datos: EjemplarRequest): Observable<Ejemplar> {
    return this.http.put<Ejemplar>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
