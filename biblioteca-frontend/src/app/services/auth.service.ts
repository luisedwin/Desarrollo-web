import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, RegistroRequest, Sesion } from '../models/auth';

const CLAVE_SESION = 'biblioteca.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = '/api/v1/auth';

  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);
  readonly esAdmin = computed(() => this.sesionActual()?.rol === 'ADMIN');

  get token(): string | null {
    return this.sesionActual()?.token ?? null;
  }

  login(datos: LoginRequest): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.url}/login`, datos).pipe(tap((s) => this.guardar(s)));
  }

  registrar(datos: RegistroRequest): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.url}/registro`, datos).pipe(tap((s) => this.guardar(s)));
  }

  cerrarSesion(): void {
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // Sin acceso a localStorage: basta con limpiar la sesión en memoria
    }
    this.sesionActual.set(null);
    this.router.navigate(['/login']);
  }

  private guardar(sesion: Sesion): void {
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Si el navegador bloquea localStorage, la sesión dura hasta recargar la página
    }
    this.sesionActual.set(sesion);
  }

  // Recupera la sesión al recargar la página, descartándola si el token ya expiró
  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = localStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const sesion = JSON.parse(texto) as Sesion;
      if (new Date(sesion.expiraEn).getTime() <= Date.now()) {
        localStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      return null;
    }
  }
}
