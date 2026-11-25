import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';
import { obtenerIniciales } from './shared/book-theme';
import { ConfirmDialog } from './shared/confirm-dialog';
import { ToastContainer } from './shared/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);

  protected readonly anioActual = new Date().getFullYear();

  protected iniciales(nombre: string): string {
    return obtenerIniciales(nombre);
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.toast.info('Sesión finalizada', 'Has salido de Athenaeum de forma segura.');
  }
}
