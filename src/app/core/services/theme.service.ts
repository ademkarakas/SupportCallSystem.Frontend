import { Injectable, signal } from '@angular/core';

/**
 * ThemeService
 *
 * Manages application theme (light/dark mode).
 * Features:
 * - Persists theme preference in localStorage
 * - Detects system preference on first visit
 * - Smooth transitions between themes
 * - Signal-based reactive state
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private readonly TRANSITION_DURATION = 200; // milliseconds

  /** Signal indicating if dark mode is active */
  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  /**
   * Toggle between light and dark mode with smooth transition
   */
  toggleTheme(): void {
    const newMode = !this.isDarkMode();

    // Add transitioning class for smooth color changes
    document.documentElement.classList.add('transitioning');

    // Update theme
    this.isDarkMode.set(newMode);
    this.applyTheme(newMode);

    // Persist preference
    localStorage.setItem(this.THEME_KEY, newMode ? 'dark' : 'light');

    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('transitioning');
    }, this.TRANSITION_DURATION);
  }

  /**
   * Set theme explicitly (useful for preferences page)
   */
  setTheme(isDark: boolean): void {
    if (this.isDarkMode() === isDark) return;
    this.toggleTheme();
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Apply theme to document element
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
