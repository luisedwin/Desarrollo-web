import { Routes } from '@angular/router';
import { adminGuard, autenticadoGuard, invitadoGuard } from './auth/guards';

export const routes: Routes = [
  { path: '', redirectTo: 'libros', pathMatch: 'full' },

  // Públicas (solo sin sesión)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Iniciar sesión · Athenaeum',
    canActivate: [invitadoGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
    title: 'Crear cuenta · Athenaeum',
    canActivate: [invitadoGuard]
  },

  // Cualquier usuario con sesión
  {
    path: 'libros',
    loadComponent: () => import('./pages/libro-lista/libro-lista').then((m) => m.LibroLista),
    title: 'Catálogo · Athenaeum',
    canActivate: [autenticadoGuard]
  },
  {
    path: 'ejemplares',
    loadComponent: () => import('./pages/ejemplar-lista/ejemplar-lista').then((m) => m.EjemplarLista),
    title: 'Ejemplares · Athenaeum',
    canActivate: [autenticadoGuard]
  },
  {
    path: 'mis-prestamos',
    loadComponent: () => import('./pages/mis-prestamos/mis-prestamos').then((m) => m.MisPrestamos),
    title: 'Mis préstamos · Athenaeum',
    canActivate: [autenticadoGuard]
  },

  // Solo administradores
  {
    path: 'panel',
    loadComponent: () => import('./pages/panel/panel').then((m) => m.Panel),
    title: 'Panel Ejecutivo · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'libros/nuevo',
    loadComponent: () => import('./pages/libro-form/libro-form').then((m) => m.LibroForm),
    title: 'Nueva obra · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'libros/:id/editar',
    loadComponent: () => import('./pages/libro-form/libro-form').then((m) => m.LibroForm),
    title: 'Editar obra · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'ejemplares/nuevo',
    loadComponent: () => import('./pages/ejemplar-form/ejemplar-form').then((m) => m.EjemplarForm),
    title: 'Nuevo ejemplar · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'ejemplares/:id/editar',
    loadComponent: () => import('./pages/ejemplar-form/ejemplar-form').then((m) => m.EjemplarForm),
    title: 'Editar ejemplar · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'socios',
    loadComponent: () => import('./pages/socio-lista/socio-lista').then((m) => m.SocioLista),
    title: 'Socios · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'socios/nuevo',
    loadComponent: () => import('./pages/socio-form/socio-form').then((m) => m.SocioForm),
    title: 'Nuevo socio · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'socios/:id/editar',
    loadComponent: () => import('./pages/socio-form/socio-form').then((m) => m.SocioForm),
    title: 'Editar socio · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'prestamos',
    loadComponent: () => import('./pages/prestamo-lista/prestamo-lista').then((m) => m.PrestamoLista),
    title: 'Préstamos · Athenaeum',
    canActivate: [adminGuard]
  },
  {
    path: 'prestamos/nuevo',
    loadComponent: () => import('./pages/prestamo-form/prestamo-form').then((m) => m.PrestamoForm),
    title: 'Nuevo préstamo · Athenaeum',
    canActivate: [adminGuard]
  },

  { path: '**', redirectTo: 'libros' }
];
