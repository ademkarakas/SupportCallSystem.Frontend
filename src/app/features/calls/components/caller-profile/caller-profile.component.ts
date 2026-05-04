import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CallApiService, CallRecord } from '../../services/call-api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-caller-profile',
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatPaginatorModule],
  templateUrl: './caller-profile.component.html',
  styleUrls: ['./caller-profile.component.scss'],
})
export class CallerProfileComponent implements OnInit {
  private readonly callApi = inject(CallApiService);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // State
  calls = signal<CallRecord[]>([]);
  isLoading = signal(false);
  searchedPhone = signal('');

  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);

  // Computed stats
  totalCalls = computed(() => this.calls().length);

  callerName = computed(() => {
    for (const c of this.calls()) {
      if (c.customerName) return c.customerName;
    }
    return null;
  });

  lastCallDate = computed(() => {
    const sorted = [...this.calls()].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
    return sorted.length > 0 ? sorted[0].startTime : null;
  });

  mostFrequentCategory = computed(() => {
    const counts: Record<string, number> = {};
    for (const c of this.calls()) {
      if (c.category) {
        counts[c.category] = (counts[c.category] ?? 0) + 1;
      }
    }
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  });

  sortedCalls = computed(() =>
    [...this.calls()].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ),
  );

  paginatedCalls = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.sortedCalls().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const phone = params['phone'];
      if (phone) {
        this.loadCalls(phone);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  goBack(): void {
    window.history.back();
  }

  navigateToDetail(callId: string): void {
    this.router.navigate(['/calls/detail'], { queryParams: { id: callId } });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      Unknown: 'Unbekannt',
      TechnicalIssue: 'Technisches Problem',
      BillingQuestion: 'Abrechnung',
      AccessCredentials: 'Zugangsdaten',
      GeneralInquiry: 'Allgemeine Anfrage',
      Complaint: 'Beschwerde',
      FeatureRequest: 'Funktionswunsch',
    };
    return map[category] ?? category ?? 'Unbekannt';
  }

  getSummaryStatusClass(status: string): string {
    if (status === 'Approved') return 'badge-active';
    if (status === 'Draft') return 'badge-warning';
    return 'badge-neutral';
  }

  getSummaryStatusLabel(status: string): string {
    const map: Record<string, string> = {
      None: 'Kein',
      Draft: 'Entwurf',
      Approved: 'Genehmigt',
    };
    return map[status] ?? status ?? '—';
  }

  getAccentClass(status: string): string {
    if (status === 'Approved') return 'approved';
    if (status === 'Draft') return 'draft';
    return 'none';
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '--';
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || '--';
  }

  getAvatarClass(name: string | null | undefined): string {
    if (!name) return 'avatar-tone-1';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash + (name.codePointAt(i) ?? 0)) % 4;
    }
    return `avatar-tone-${hash + 1}`;
  }

  private loadCalls(phone: string): void {
    this.isLoading.set(true);
    this.searchedPhone.set(phone);
    this.currentPage.set(0);
    this.callApi.getCallsByPhone(phone).subscribe({
      next: (data) => {
        this.calls.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.showError('Anrufhistorie konnte nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }
}
