import { Injectable, inject, effect } from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './auth.service';
import { SessionTimeoutDialogComponent } from '../../shared/components/session-timeout-dialog/session-timeout-dialog.component';

const IDLE_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  private activitySub: Subscription | null = null;
  private dialogOpen = false;

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  private start(): void {
    this.stop();

    this.activitySub = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart'),
    )
      .pipe(debounceTime(IDLE_TIMEOUT_MS))
      .subscribe(() => {
        if (!this.dialogOpen) {
          this.showWarning();
        }
      });
  }

  private stop(): void {
    this.activitySub?.unsubscribe();
    this.activitySub = null;
    this.dialogOpen = false;
  }

  private showWarning(): void {
    this.dialogOpen = true;

    const dialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      width: '420px',
      disableClose: true,
      panelClass: 'session-timeout-dialog',
    });

    dialogRef.afterClosed().subscribe((stayLoggedIn: boolean) => {
      this.dialogOpen = false;
      if (stayLoggedIn) {
        this.start();
      } else {
        this.authService.logout();
      }
    });
  }
}
