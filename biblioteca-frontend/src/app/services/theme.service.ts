import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'athenaeum_theme';
  readonly currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.currentTheme());

    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      try {
        localStorage.setItem(this.STORAGE_KEY, theme);
      } catch {
        // Fallback si localStorage no está disponible
      }
    });
  }

  toggleTheme(): void {
    this.currentTheme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }

  private applyTheme(theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#090b10' : '#f6f3ed');
      }
    }
  }

  private getInitialTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // Por defecto modo oscuro editorial
    }
    return 'dark';
  }
}
