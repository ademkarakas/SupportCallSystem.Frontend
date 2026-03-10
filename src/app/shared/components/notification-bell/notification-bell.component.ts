import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  NotificationInboxService,
  AppNotification,
} from '../../../core/services/notification-inbox.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent {
  private readonly router = inject(Router);
  readonly inbox = inject(NotificationInboxService);

  readonly preview = computed(() => this.inbox.notifications().slice(0, 6));

  openInbox(): void {
    this.router.navigate(['/notifications']);
  }

  markAllRead(): void {
    this.inbox.markAllAsRead();
  }

  onItemClick(notif: AppNotification): void {
    this.inbox.markAsRead(notif.id);
    if (notif.callId && (notif.type === 'summary_ready' || notif.type === 'incoming_call')) {
      this.router.navigate(['/calls/detail'], { queryParams: { id: notif.callId } });
    }
  }

  dismiss(notif: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.inbox.dismiss(notif.id);
  }

  iconFor(type: AppNotification['type']): string {
    const map: Record<string, string> = {
      incoming_call: 'call',
      summary_ready: 'auto_awesome',
      transcription_error: 'error_outline',
    };
    return map[type] ?? 'notifications';
  }

  colorClassFor(type: AppNotification['type']): string {
    const map: Record<string, string> = {
      incoming_call: 'notif-call',
      summary_ready: 'notif-summary',
      transcription_error: 'notif-error',
    };
    return map[type] ?? '';
  }

  relativeTime(date: Date): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Gerade eben';
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
    return `vor ${Math.floor(diff / 86400)} Tagen`;
  }
}
