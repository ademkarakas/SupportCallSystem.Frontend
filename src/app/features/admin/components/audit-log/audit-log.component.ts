import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AdminApiService, AuditLogDto } from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { finalize } from 'rxjs';

type ActionFilter = 'ALL' | 'USER' | 'CALL' | 'SECURITY' | 'SYSTEM';

@Component({
  selector: 'app-audit-log',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
})
export class AuditLogComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  isLoading = signal(false);
  entries = signal<AuditLogDto[]>([]);
  expandedId = signal<string | null>(null);
  activeFilter = signal<ActionFilter>('ALL');

  filterForm = this.fb.group({
    userId: [''],
    from: [''],
    to: [''],
  });

  readonly ACTION_FILTERS: ActionFilter[] = ['ALL', 'USER', 'CALL', 'SECURITY', 'SYSTEM'];

  pageIndex = signal(0);
  pageSize = signal(15);

  paginatedEntries = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredEntries().slice(start, start + this.pageSize());
  });

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  filteredEntries = computed(() => {
    const filter = this.activeFilter();
    const all = this.entries();
    if (filter === 'ALL') return all;
    return all.filter((e) => e.action.toUpperCase().startsWith(filter));
  });

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    const { userId, from, to } = this.filterForm.getRawValue();

    this.adminApi
      .getAuditLogs({
        page: 1,
        pageSize: 200,
        userId: userId ?? undefined,
        from: from ?? undefined,
        to: to ?? undefined,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (logs) => this.entries.set(logs),
        error: () => this.notification.showError('Audit-Log konnte nicht geladen werden'),
      });
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  setFilter(filter: ActionFilter): void {
    this.activeFilter.set(filter);
  }

  formatTimestamp(ts: string): string {
    return new Date(ts).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  translateAction(action: string): string {
    const map: Record<string, string> = {
      CREATE_USER: 'Benutzer erstellt',
      UPDATE_USER: 'Benutzer aktualisiert',
      DELETE_USER: 'Benutzer gel + [char]0xF6 + scht',
      USER_CREATED: 'Benutzer erstellt',
      USER_UPDATED: 'Benutzer aktualisiert',
      USER_DELETED: 'Benutzer gel + [char]0xF6 + scht',
      CALL_STARTED: 'Anruf gestartet',
      CALL_ENDED: 'Anruf beendet',
      LOGIN: 'Anmeldung',
      LOGOUT: 'Abmeldung',
      SECURITY_ALERT: 'Sicherheitswarnung',
      SYSTEM_ERROR: 'Systemfehler',
    };
    return map[action.toUpperCase()] ?? action;
  }

  getActionClass(action: string): string {
    const a = action.toUpperCase();
    if (a.startsWith('USER')) return 'action-user';
    if (a.startsWith('CALL')) return 'action-call';
    if (a.startsWith('SECURITY') || a.startsWith('LOGIN') || a.startsWith('2FA'))
      return 'action-security';
    return 'action-system';
  }

  readonly filterLabels: Record<ActionFilter, string> = {
    ALL: 'Alle',
    USER: 'Benutzer',
    CALL: 'Anruf',
    SECURITY: 'Sicherheit',
    SYSTEM: 'System',
  };
}
