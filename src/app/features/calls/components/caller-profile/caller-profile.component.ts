import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CallApiService, CallRecord } from '../../services/call-api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-caller-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule],
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
  searchInput = '';

  // Computed stats
  totalCalls = computed(() => this.calls().length);

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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const phone = params['phone'];
      if (phone) {
        this.searchInput = phone;
        this.loadCalls(phone);
      }
    });
  }

  onSearch(): void {
    const trimmed = this.searchInput.trim();
    if (!trimmed) {
      this.notification.showError('Bitte geben Sie eine Telefonnummer ein.');
      return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { phone: trimmed },
      queryParamsHandling: 'merge',
    });
    this.loadCalls(trimmed);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  clearSearch(): void {
    this.searchInput = '';
    this.calls.set([]);
    this.searchedPhone.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { phone: null },
      queryParamsHandling: 'merge',
    });
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
    return status === 'Approved' ? 'badge-active' : 'badge-neutral';
  }

  private loadCalls(phone: string): void {
    this.isLoading.set(true);
    this.searchedPhone.set(phone);
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
