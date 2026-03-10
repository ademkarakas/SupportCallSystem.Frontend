import { Component, inject, OnInit, viewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CallApiService, CallRecord } from '../../services/call-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-call-history',
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './call-history.component.html',
  styleUrls: ['./call-history.component.scss'],
})
export class CallHistoryComponent implements OnInit, AfterViewInit {
  callApi = inject(CallApiService);
  auth = inject(AuthService);
  notification = inject(NotificationService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  dataSource = new MatTableDataSource<CallRecord>([]);
  displayedColumns: string[] = [
    'customer',
    'category',
    'summaryStatus',
    'startTime',
    'duration',
    'summary',
    'actions',
  ];

  paginator = viewChild.required(MatPaginator);
  sort = viewChild.required(MatSort);

  isLoading = false;
  isMobile = false;

  // Filter state
  filterText = '';
  filterCategory = '';
  filterStatus = '';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;

  readonly categories = [
    'TechnicalIssue',
    'BillingQuestion',
    'AccessCredentials',
    'GeneralInquiry',
    'Complaint',
    'FeatureRequest',
    'Unknown',
  ];

  readonly summaryStatuses = [
    { value: 'None', label: 'Kein' },
    { value: 'Draft', label: 'Entwurf' },
    { value: 'Approved', label: 'Genehmigt' },
  ];

  readonly categoryLabels: Record<string, string> = {
    TechnicalIssue: 'Technisches Problem',
    BillingQuestion: 'Abrechnung',
    AccessCredentials: 'Zugangsdaten',
    GeneralInquiry: 'Allgemeine Anfrage',
    Complaint: 'Beschwerde',
    FeatureRequest: 'Feature-Anfrage',
    Unknown: 'Unbekannt',
  };

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit() {
    this.checkMobile();
    this.setupFilterPredicate();
    this.route.queryParams.subscribe((params) => {
      const customerId = params['customerId'];
      if (customerId) {
        this.loadCustomerHistory(customerId);
      } else {
        this.loadAgentHistory();
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator();
    this.dataSource.sort = this.sort();
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (call: CallRecord, filter: string) => {
      try {
        const f = JSON.parse(filter);
        if (
          f.text &&
          !(
            (call.customerName || '').toLowerCase().includes(f.text) ||
            (call.category || '').toLowerCase().includes(f.text) ||
            (call.approvedSummary || '').toLowerCase().includes(f.text) ||
            (call.callerNumber || '').toLowerCase().includes(f.text)
          )
        )
          return false;
        if (f.category && (call.category || 'Unknown') !== f.category) return false;
        if (f.status && (call.summaryStatus || 'None') !== f.status) return false;
        if (f.dateFrom) {
          if (new Date(call.startTime) < new Date(f.dateFrom)) return false;
        }
        if (f.dateTo) {
          const toDate = new Date(f.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (new Date(call.startTime) > toDate) return false;
        }
        return true;
      } catch {
        return true;
      }
    };
  }

  applyFilters() {
    this.dataSource.filter = JSON.stringify({
      text: this.filterText.trim().toLowerCase(),
      category: this.filterCategory,
      status: this.filterStatus,
      dateFrom: this.filterDateFrom?.toISOString() ?? null,
      dateTo: this.filterDateTo?.toISOString() ?? null,
    });
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters() {
    this.filterText = '';
    this.filterCategory = '';
    this.filterStatus = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filterText ||
      this.filterCategory ||
      this.filterStatus ||
      this.filterDateFrom ||
      this.filterDateTo
    );
  }

  loadAgentHistory() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.isLoading = true;
    this.callApi.getHistoryByAgent(user.id).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: () => {
        this.notification.showError('Could not retrieve call logs.');
        this.isLoading = false;
      },
    });
  }

  loadCustomerHistory(customerId: string) {
    this.isLoading = true;
    this.callApi.getCallHistory(customerId).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: () => {
        this.notification.showError('Could not retrieve call logs.');
        this.isLoading = false;
      },
    });
  }

  navigateToDetail(callId: string) {
    this.router.navigate(['/calls/detail'], { queryParams: { id: callId } });
  }

  viewCallerProfile(callerNumber: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!callerNumber) {
      this.notification.showError('Keine Telefonnummer für diesen Anruf gespeichert.');
      return;
    }
    this.router.navigate(['/calls/caller-profile'], { queryParams: { phone: callerNumber } });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  getSummaryStatusLabel(status: string | number): string {
    const map: Record<string, string> = {
      None: 'Kein',
      '0': 'Kein',
      Draft: 'Entwurf',
      '1': 'Entwurf',
      Approved: 'Genehmigt',
      '2': 'Genehmigt',
    };
    return map[String(status)] ?? String(status);
  }

  getSummaryStatusClass(status: string | number): string {
    const s = String(status);
    if (s === 'Approved' || s === '2') return 'status-approved';
    if (s === 'Draft' || s === '1') return 'status-draft';
    return 'status-none';
  }

  exportToCsv() {
    const data = this.dataSource.filteredData;
    if (data.length === 0) {
      this.notification.showError('Keine Daten zum Exportieren.');
      return;
    }
    const headers = [
      'Kunde',
      'Telefon',
      'Kategorie',
      'Status',
      'Datum',
      'Dauer (s)',
      'Zusammenfassung',
    ];
    const rows = data.map((call) => [
      call.customerName || 'Manueller Eintrag',
      call.callerNumber || '',
      call.category || 'Unknown',
      this.getSummaryStatusLabel(call.summaryStatus),
      new Date(call.startTime).toLocaleString('de-DE'),
      String(call.durationSeconds),
      `"${(call.approvedSummary || '').replaceAll('"', '""')}"`,
    ]);
    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anrufhistorie_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
