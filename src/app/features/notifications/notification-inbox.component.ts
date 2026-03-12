import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  NotificationInboxService,
  AppNotification,
  NotificationType,
  NotificationSettings,
} from '../../core/services/notification-inbox.service';

type FilterTab = 'all' | 'unread' | 'incoming_call' | 'summary_ready' | 'transcription_error';

@Component({
  selector: 'app-notification-inbox',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSlideToggleModule, MatTooltipModule, MatPaginatorModule],
  templateUrl: './notification-inbox.component.html',
  styleUrls: ['./notification-inbox.component.scss'],
})
export class NotificationInboxComponent {
  private readonly router = inject(Router);
  readonly inbox = inject(NotificationInboxService);

  activeTab = signal<FilterTab>('all');
  showSettings = signal(false);

  pageIndex = signal(0);
  pageSize = signal(15);

  readonly paginated = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const all = this.inbox.notifications();
    if (tab === 'all') return all;
    if (tab === 'unread') return all.filter((n) => !n.read);
    return all.filter((n) => n.type === tab);
  });

  readonly tabs: { key: FilterTab; label: string; icon: string }[] = [
    { key: 'all', label: 'Alle', icon: 'inbox' },
    { key: 'unread', label: 'Ungelesen', icon: 'mark_email_unread' },
    { key: 'incoming_call', label: 'Anrufe', icon: 'call' },
    { key: 'summary_ready', label: 'KI-Zusammenfassungen', icon: 'auto_awesome' },
    { key: 'transcription_error', label: 'Fehler', icon: 'error_outline' },
  ];

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  tabCount(tab: FilterTab): number {
    const all = this.inbox.notifications();
    if (tab === 'all') return all.length;
    if (tab === 'unread') return all.filter((n) => !n.read).length;
    return all.filter((n) => n.type === tab).length;
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

  markAllRead(): void {
    this.inbox.markAllAsRead();
  }

  clearAll(): void {
    this.inbox.clearAll();
  }

  iconFor(type: NotificationType): string {
    const map: Record<string, string> = {
      incoming_call: 'call',
      summary_ready: 'auto_awesome',
      transcription_error: 'error_outline',
    };
    return map[type] ?? 'notifications';
  }

  colorClassFor(type: NotificationType): string {
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

  toggleSettings(): void {
    this.showSettings.update((v) => !v);
  }

  updateSetting(key: keyof NotificationSettings, value: boolean): void {
    this.inbox.updateSettings({ [key]: value });
  }
}


