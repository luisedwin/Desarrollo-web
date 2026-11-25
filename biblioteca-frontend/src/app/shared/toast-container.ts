import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-stack" role="region" aria-label="Notificaciones" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.tipo" role="status">
          <div class="toast-icon" aria-hidden="true">
            @switch (toast.tipo) {
              @case ('exito') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              }
              @case ('error') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              }
              @case ('aviso') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
              @default {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              }
            }
          </div>
          <div class="toast-body">
            <strong class="toast-titulo">{{ toast.titulo }}</strong>
            @if (toast.mensaje) {
              <span class="toast-mensaje">{{ toast.mensaje }}</span>
            }
          </div>
          <button type="button" class="toast-close" (click)="toastService.cerrar(toast.id)" aria-label="Cerrar notificación">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="toast-progress" [style.animation-duration.ms]="toast.duracion"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: min(400px, calc(100vw - 32px));
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px 16px;
      border-radius: 14px;
      background: var(--glass-strong);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-medium);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      animation: toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .toast-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-exito .toast-icon { background: var(--accent-success-bg); color: var(--accent-success); }
    .toast-error .toast-icon { background: var(--accent-danger-bg); color: var(--accent-danger); }
    .toast-aviso .toast-icon { background: var(--accent-warning-bg); color: var(--accent-warning); }
    .toast-info .toast-icon  { background: var(--accent-info-bg); color: var(--accent-info); }

    .toast-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
      padding-top: 1px;
    }

    .toast-titulo {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .toast-mensaje {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: inline-flex;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .toast-close:hover {
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }

    .toast-progress {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 3px;
      transform-origin: left center;
      animation: toastShrink linear forwards;
    }

    .toast-exito .toast-progress { background: var(--accent-success); }
    .toast-error .toast-progress { background: var(--accent-danger); }
    .toast-aviso .toast-progress { background: var(--accent-warning); }
    .toast-info .toast-progress  { background: var(--accent-info); }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateY(14px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes toastShrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    @media (max-width: 560px) {
      .toast-stack {
        right: 16px;
        left: 16px;
        bottom: 16px;
        max-width: none;
      }
    }
  `]
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
