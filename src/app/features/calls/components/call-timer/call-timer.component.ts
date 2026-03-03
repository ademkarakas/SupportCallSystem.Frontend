import { Component, OnInit, OnDestroy, signal, computed, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-call-timer',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './call-timer.component.html',
  styleUrls: ['./call-timer.component.scss'],
})
export class CallTimerComponent implements OnInit, OnDestroy {
  startTime = input.required<Date>();
  endTime = input<Date>();

  private secondsElapsed = signal(0);
  public isActive = signal(true);

  public formattedTime = computed(() => {
    const s = this.secondsElapsed();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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
      
      if (end) {
        this.isActive.set(false);
        this.secondsElapsed.set(
          Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000),
        );
      } else if (start) {
        this.isActive.set(true);
        this.startTimer();
      }
    });
  }

  ngOnInit() {
    // Logic is handled by the effect in constructor
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
    const now = new Date();
    const start = new Date(this.startTime());
    this.secondsElapsed.set(Math.floor((now.getTime() - start.getTime()) / 1000));
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}
