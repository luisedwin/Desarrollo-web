import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Agrega "Authorization: Bearer <token>" a cada petición a la API
// y cierra la sesión si el backend responde 401 (token vencido o inválido)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = req.url.includes('/api/v1/auth/login');
      if (error.status === 401 && token && !esLogin) {
        auth.cerrarSesion();
      }
      return throwError(() => error);
    })
  );
};
