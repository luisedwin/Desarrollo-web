import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (confirmService.estado(); as dialogo) {
      <div class="modal-backdrop" (click)="confirmService.responder(false)" role="presentation">
        <div
          class="confirm-modal"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="'confirm-titulo'"
          (click)="$event.stopPropagation()"
        >
          <div class="confirm-header">
            <div class="confirm-icon" [class]="'icon-' + dialogo.variante">
              @if (dialogo.variante === 'peligro') {
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              } @else if (dialogo.variante === 'dorado') {
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              } @else {
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              }
            </div>
            <div class="confirm-texto">
              <h2 id="confirm-titulo">{{ dialogo.titulo }}</h2>
              <p>{{ dialogo.mensaje }}</p>
              @if (dialogo.detalle) {
                <div class="confirm-detalle">{{ dialogo.detalle }}</div>
              }
            </div>
          </div>

          <div class="confirm-acciones">
            <button type="button" class="btn" (click)="confirmService.responder(false)">
              {{ dialogo.textoCancelar }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-peligro-solid]="dialogo.variante === 'peligro'"
              [class.btn-dorado]="dialogo.variante === 'dorado'"
              [class.btn-primario]="dialogo.variante === 'primario'"
              (click)="confirmService.responder(true)"
            >
              {{ dialogo.textoConfirmar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1300;
      background: rgba(5, 7, 12, 0.72);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeOverlay 0.2s ease forwards;
    }

    .confirm-modal {
      width: 100%;
      max-width: 450px;
      background: var(--bg-card);
      border: 1px solid var(--border-medium);
      border-radius: 20px;
      padding: 26px;
      box-shadow: var(--shadow-xl);
      animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .confirm-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
    }

    .confirm-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid transparent;
    }

    .icon-peligro {
      background: var(--accent-danger-bg);
      color: var(--accent-danger);
      border-color: rgba(244, 63, 94, 0.28);
    }

    .icon-dorado {
      background: var(--accent-gold-soft);
      color: var(--accent-gold);
      border-color: rgba(229, 169, 60, 0.3);
    }

    .icon-primario {
      background: var(--accent-primary-soft);
      color: var(--accent-primary);
      border-color: rgba(79, 125, 243, 0.3);
    }

    .confirm-texto h2 {
      font-size: 1.28rem;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    .confirm-texto p {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .confirm-detalle {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      font-size: 0.82rem;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .confirm-acciones {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @keyframes fadeOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalPop {
      from { opacity: 0; transform: translateY(10px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class ConfirmDialog {
  protected readonly confirmService = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  protected cerrarConEscape(): void {
    if (this.confirmService.estado()) {
      this.confirmService.responder(false);
    }
  }
}
