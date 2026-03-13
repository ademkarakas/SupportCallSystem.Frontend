import { Component, OnDestroy, signal, computed, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-call-timer',
  imports: [CommonModule, MatIcon],
  templateUrl: './call-timer.component.html',
  styleUrls: ['./call-timer.component.scss'],
})
export class CallTimerComponent implements OnDestroy {
  startTime = input.required<Date | string>();
  endTime = input<Date | string>();

  private readonly secondsElapsed = signal(0);
  public isActive = signal(true);

  public formattedTime = computed(() => {
    const s = this.secondsElapsed();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  private intervalId?: any;

  constructor() {
    // Watch for startTime/endTime changes and handle timer state
    effect(() => {
      const start = this.startTime();
      const end = this.endTime();

      // Reset timer whenever startTime changes (new call)
      this.stopTimer();
      this.secondsElapsed.set(0);

      const startMs = this.parseDateToMillis(start);
      const endMs = this.parseDateToMillis(end);

      if (!startMs) {
        this.isActive.set(false);
        this.secondsElapsed.set(0);
        return;
      }

      if (endMs) {
        this.isActive.set(false);
        this.secondsElapsed.set(Math.max(0, Math.floor((endMs - startMs) / 1000)));
      } else {
        this.isActive.set(true);
        this.startTimer();
      }
    });
  }

  private startTimer() {
    if (this.intervalId) return; // Prevent multiple timers
    this.updateElapsed();
    this.intervalId = setInterval(() => {
      this.updateElapsed();
    }, 1000);
  }

  private stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private updateElapsed() {
    const startMs = this.parseDateToMillis(this.startTime());
    if (!startMs) {
      this.secondsElapsed.set(0);
      return;
    }

    const nowMs = Date.now();
    this.secondsElapsed.set(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
  }

  private parseDateToMillis(value: Date | string | undefined): number | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
    const normalized = hasTimezone ? value : `${value}Z`;
    const parsed = Date.parse(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    const fallback = Date.parse(value);
    return Number.isNaN(fallback) ? null : fallback;
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}
