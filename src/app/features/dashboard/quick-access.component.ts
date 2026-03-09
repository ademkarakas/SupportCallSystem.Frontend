import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { CallApiService, CallRecord } from '../calls/services/call-api.service';
import { AuthService } from '../../core/services/auth.service';
import { UserSettingsDialogComponent } from '../../shared/components/user-settings-dialog/user-settings-dialog.component';

@Component({
  selector: 'app-quick-access',
  imports: [CommonModule, MatIconModule, MatDialogModule],
  templateUrl: './quick-access.component.html',
  styleUrls: ['./quick-access.component.scss'],
})
export class QuickAccessComponent implements OnInit {
  router = inject(Router);
  notification = inject(NotificationService);
  callApi = inject(CallApiService);
  auth = inject(AuthService);
  dialog = inject(MatDialog);

  recentCalls = signal<CallRecord[]>([]);
  isLoading = signal(true);

  isAdmin = this.auth.isAdmin.bind(this.auth);

  ngOnInit() {
    this.loadRecentCalls();
  }

  private loadRecentCalls() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.callApi.getHistoryByAgent(user.id).subscribe({
      next: (calls) => {
        this.recentCalls.set(calls.slice(0, 5));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  quickAccess(type: string) {
    switch (type) {
      case 'agent':
        this.dialog.open(UserSettingsDialogComponent, {
          width: '600px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          panelClass: 'user-settings-dialog',
        });
        break;
      case 'kunden':
        this.router.navigate(['/calls/caller-profile']);
        break;
      case 'notizen':
        this.router.navigate(['/calls/history']);
        break;
      case 'hilfe':
        window.open('https://google.com', '_blank');
        break;
      case 'admin':
        this.router.navigate(['/admin']);
        break;
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  navigateToCall(callId: string) {
    this.router.navigate(['/calls/detail'], { queryParams: { id: callId } });
  }
}
