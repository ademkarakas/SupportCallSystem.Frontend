import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services/notification.service';
import { CallApiService, CallRecord } from '../calls/services/call-api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-quick-access',
  imports: [CommonModule, MatIconModule],
  templateUrl: './quick-access.component.html',
  styleUrls: ['./quick-access.component.scss'],
})
export class QuickAccessComponent implements OnInit {
  router = inject(Router);
  notification = inject(NotificationService);
  callApi = inject(CallApiService);
  auth = inject(AuthService);

  recentCalls = signal<CallRecord[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadRecentCalls();
  }

  private loadRecentCalls() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.callApi.getHistoryByAgent(user.id).subscribe({
      next: (calls) => {
        // Get the 5 most recent calls
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
        this.notification.showInfo('Agent-Profil wird geladen...');
        break;
      case 'kunden':
        this.router.navigate(['/calls/history'], { queryParams: { view: 'all' } });
        break;
      case 'notizen':
        this.notification.showInfo('Manuelle Notizen-Funktion wird vorbereitet...');
        break;
      case 'hilfe':
        window.open('https://google.com', '_blank');
        break;
      case 'reports':
        this.router.navigate(['/reports']);
        break;
      case 'settings':
        this.notification.showInfo('Einstellungen werden geladen...');
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
