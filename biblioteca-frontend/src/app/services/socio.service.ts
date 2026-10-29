import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Socio } from '../models/socio';

@Injectable({ providedIn: 'root' })
export class SocioService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/socios';

  listar(): Observable<Socio[]> {
    return this.http.get<Socio[]>(this.url);
  }

  obtener(id: number): Observable<Socio> {
    return this.http.get<Socio>(`${this.url}/${id}`);
  }

  crear(socio: Socio): Observable<Socio> {
    return this.http.post<Socio>(this.url, socio);
  }

  actualizar(id: number, socio: Socio): Observable<Socio> {
    return this.http.put<Socio>(`${this.url}/${id}`, socio);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
