import { Routes } from '@angular/router';
import { adminGuard, autenticadoGuard, invitadoGuard } from './auth/guards';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { LibroLista } from './pages/libro-lista/libro-lista';
import { LibroForm } from './pages/libro-form/libro-form';
import { EjemplarLista } from './pages/ejemplar-lista/ejemplar-lista';
import { EjemplarForm } from './pages/ejemplar-form/ejemplar-form';
import { SocioLista } from './pages/socio-lista/socio-lista';
import { SocioForm } from './pages/socio-form/socio-form';
import { PrestamoLista } from './pages/prestamo-lista/prestamo-lista';
import { PrestamoForm } from './pages/prestamo-form/prestamo-form';
import { MisPrestamos } from './pages/mis-prestamos/mis-prestamos';

export const routes: Routes = [
  { path: '', redirectTo: 'libros', pathMatch: 'full' },

  // Públicas (solo sin sesión)
  { path: 'login', component: Login, title: 'Iniciar sesión', canActivate: [invitadoGuard] },
  { path: 'registro', component: Registro, title: 'Crear cuenta', canActivate: [invitadoGuard] },

  // Cualquier usuario con sesión
  { path: 'libros', component: LibroLista, title: 'Libros', canActivate: [autenticadoGuard] },
  { path: 'ejemplares', component: EjemplarLista, title: 'Ejemplares', canActivate: [autenticadoGuard] },
  { path: 'mis-prestamos', component: MisPrestamos, title: 'Mis préstamos', canActivate: [autenticadoGuard] },

  // Solo administradores
  { path: 'libros/nuevo', component: LibroForm, title: 'Nuevo libro', canActivate: [adminGuard] },
  { path: 'libros/:id/editar', component: LibroForm, title: 'Editar libro', canActivate: [adminGuard] },
  { path: 'ejemplares/nuevo', component: EjemplarForm, title: 'Nuevo ejemplar', canActivate: [adminGuard] },
  { path: 'ejemplares/:id/editar', component: EjemplarForm, title: 'Editar ejemplar', canActivate: [adminGuard] },
  { path: 'socios', component: SocioLista, title: 'Socios', canActivate: [adminGuard] },
  { path: 'socios/nuevo', component: SocioForm, title: 'Nuevo socio', canActivate: [adminGuard] },
  { path: 'socios/:id/editar', component: SocioForm, title: 'Editar socio', canActivate: [adminGuard] },
  { path: 'prestamos', component: PrestamoLista, title: 'Préstamos', canActivate: [adminGuard] },
  { path: 'prestamos/nuevo', component: PrestamoForm, title: 'Nuevo préstamo', canActivate: [adminGuard] },

  { path: '**', redirectTo: 'libros' }
];
