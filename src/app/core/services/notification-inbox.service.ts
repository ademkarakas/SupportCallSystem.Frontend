import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { SignalRService } from './signalr.service';
import { AuthService } from './auth.service';

export type NotificationType = 'incoming_call' | 'summary_ready' | 'transcription_error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  callId?: string;
  data?: unknown;
}

export interface NotificationSettings {
  showIncomingCall: boolean;
  showSummaryReady: boolean;
  showTranscriptionError: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  showIncomingCall: true,
  showSummaryReady: true,
  showTranscriptionError: true,
};

const STORAGE_KEY_PREFIX = 'notif_inbox_';
const SETTINGS_KEY_PREFIX = 'notif_settings_';
const MAX_STORED = 100;

@Injectable({ providedIn: 'root' })
export class NotificationInboxService {
  private readonly signalR = inject(SignalRService);
  private readonly auth = inject(AuthService);

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _settings = signal<NotificationSettings>(DEFAULT_SETTINGS);

  readonly notifications = this._notifications.asReadonly();
  readonly settings = this._settings.asReadonly();

  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);

  readonly unreadCallCount = computed(
    () => this._notifications().filter((n) => !n.read && n.type === 'incoming_call').length,
  );

  constructor() {
    // Load persisted state for the current user (effect runs after auth resolves)
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadFromStorage(user.id);
      }
    });

    // Subscribe to SignalR events
    this.signalR.incomingCall$.subscribe((event) => {
      if (!event) return;
      if (!this._settings().showIncomingCall) return;
      this.push({
        type: 'incoming_call',
        title: 'Eingehender Anruf',
        message: `Anruf von ${event.callerNumber ?? 'Unbekannte Nummer'}${event.customer?.firstName ? ' – ' + event.customer.firstName + ' ' + event.customer.lastName : ''}`,
        callId: event.callId,
        data: event,
      });
    });

    this.signalR.summaryDraft$.subscribe((event) => {
      if (!this._settings().showSummaryReady) return;
      this.push({
        type: 'summary_ready',
        title: 'KI-Zusammenfassung bereit',
        message: 'Eine neue Gesprächszusammenfassung wartet auf Genehmigung.',
        callId: event.callId,
        data: event,
      });
    });

    this.signalR.transcriptionError$.subscribe((event) => {
      if (!this._settings().showTranscriptionError) return;
      this.push({
        type: 'transcription_error',
        title: 'Transkriptionsfehler',
        message: event.error ?? 'Fehler bei der Sprachtranskription.',
        callId: event.callId,
        data: event,
      });
    });
  }

  private push(partial: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const notif: AppNotification = {
      ...partial,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    this._notifications.update((list) => {
      const updated = [notif, ...list].slice(0, MAX_STORED);
      this.saveToStorage(updated);
      return updated;
    });
  }

  markAsRead(id: string): void {
    this._notifications.update((list) => {
      const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      this.saveToStorage(updated);
      return updated;
    });
  }

  markAllAsRead(): void {
    this._notifications.update((list) => {
      const updated = list.map((n) => ({ ...n, read: true }));
      this.saveToStorage(updated);
      return updated;
    });
  }

  dismiss(id: string): void {
    this._notifications.update((list) => {
      const updated = list.filter((n) => n.id !== id);
      this.saveToStorage(updated);
      return updated;
    });
  }

  clearAll(): void {
    this._notifications.set([]);
    this.saveToStorage([]);
  }

  updateSettings(patch: Partial<NotificationSettings>): void {
    this._settings.update((s) => {
      const updated = { ...s, ...patch };
      this.saveSettings(updated);
      return updated;
    });
  }

  // ---- persistence ----
  private storageKey(): string | null {
    const user = this.auth.currentUser();
    return user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;
  }

  private settingsKey(): string | null {
    const user = this.auth.currentUser();
    return user ? `${SETTINGS_KEY_PREFIX}${user.id}` : null;
  }

  private saveToStorage(list: AppNotification[]): void {
    const key = this.storageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // storage full — ignore
    }
  }

  private saveSettings(s: NotificationSettings): void {
    const key = this.settingsKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(s));
  }

  private loadFromStorage(userId: string): void {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (raw) {
        const list: AppNotification[] = JSON.parse(raw);
        // Re-hydrate Date objects
        this._notifications.set(list.map((n) => ({ ...n, timestamp: new Date(n.timestamp) })));
      }
      const rawSettings = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${userId}`);
      if (rawSettings) {
        this._settings.set({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) });
      }
    } catch {
      // corrupt storage — reset
      this._notifications.set([]);
    }
  }
}
