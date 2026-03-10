import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const WARNING_SECONDS = 300; // 5 minutes

@Component({
  selector: 'app-session-timeout-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './session-timeout-dialog.component.html',
  styleUrls: ['./session-timeout-dialog.component.scss'],
})
export class SessionTimeoutDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<SessionTimeoutDialogComponent>);

  countdown = signal(WARNING_SECONDS);
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      const next = this.countdown() - 1;
      if (next <= 0) {
        this.clearTimer();
        this.dialogRef.close(false);
      } else {
        this.countdown.set(next);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  stayLoggedIn(): void {
    this.clearTimer();
    this.dialogRef.close(true);
  }

  logout(): void {
    this.clearTimer();
    this.dialogRef.close(false);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get minutesLeft(): number {
    return Math.floor(this.countdown() / 60);
  }

  get secondsLeft(): string {
    return String(this.countdown() % 60).padStart(2, '0');
  }
}
