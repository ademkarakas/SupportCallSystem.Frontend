import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
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

  getActionClass(action: string): string {
    const a = action.toUpperCase();
    if (a.startsWith('USER')) return 'action-user';
    if (a.startsWith('CALL')) return 'action-call';
    if (a.startsWith('SECURITY') || a.startsWith('LOGIN') || a.startsWith('2FA'))
      return 'action-security';
    return 'action-system';
  }
}
