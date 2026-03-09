import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminApiService, CustomerWithHistoryDto } from '../../services/admin-api.service';

@Component({
  selector: 'app-customer-detail-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Kundendetails</h2>
    <mat-dialog-content>
      @if (isLoading()) {
        <div class="loading">Wird geladen...</div>
      } @else if (customer()) {
        <div class="customer-info">
          <div class="info-row">
            <span class="info-label">Name</span>
              <span class="info-value">{{ customer()!.fullName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Telefon</span>
            <span class="info-value">{{ customer()!.phoneNumber }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Firma</span>
            <span class="info-value">{{ customer()!.company || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">E-Mail</span>
            <span class="info-value">{{ customer()!.email || '—' }}</span>
          </div>
          @if (customer()!.notes) {
            <div class="info-row">
              <span class="info-label">Notizen</span>
              <span class="info-value notes">{{ customer()!.notes }}</span>
            </div>
          }
          @if (customer()!.tags.length) {
            <div class="info-row">
              <span class="info-label">Tags</span>
              <div class="tags">
                @for (tag of customer()!.tags; track tag) {
                  <span class="tag-chip">{{ tag }}</span>
                }
              </div>
            </div>
          }
        </div>

        <h3 class="section-title">
          <mat-icon>history</mat-icon>
          Anrufhistorie ({{ customer()!.recentCalls.length }})
        </h3>

        <div class="call-history">
          @for (call of customer()!.recentCalls; track call.id) {
            <div class="history-item">
              <div class="history-header">
                <span class="history-date">{{ call.startTime | date: 'dd.MM.yyyy HH:mm' }}</span>
                <span
                  class="history-badge"
                  [class.badge-approved]="call.summaryStatus === 'Approved'"
                >
                  {{ call.summaryStatus }}
                </span>
              </div>
              <div class="history-meta">
                <span>{{ getCategoryLabel(call.category) }}</span>
                <span>{{ formatDuration(call.durationSeconds) }}</span>
              </div>
              @if (call.summary) {
                <p class="history-summary">{{ call.summary }}</p>
              }
            </div>
          } @empty {
            <p class="empty">Keine Anrufe vorhanden.</p>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Schließen</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .customer-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      .info-row {
        display: flex;
        gap: 1rem;
      }
      .info-label {
        font-weight: 600;
        color: var(--text-secondary);
        min-width: 80px;
        font-size: 0.875rem;
      }
      .info-value {
        font-size: 0.875rem;
      }
      .info-value.notes {
        white-space: pre-wrap;
      }
      .tags {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }
      .tag-chip {
        background: var(--surface-hover);
        padding: 0.125rem 0.5rem;
        border-radius: 8px;
        font-size: 0.75rem;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        margin-bottom: 0.75rem;
        mat-icon {
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }
      }
      .call-history {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 300px;
        overflow-y: auto;
      }
      .history-item {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.75rem;
      }
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
      }
      .history-date {
        font-weight: 500;
        font-size: 0.875rem;
      }
      .history-badge {
        font-size: 0.7rem;
        padding: 0.125rem 0.5rem;
        border-radius: 8px;
        background: var(--surface-hover);
      }
      .history-badge.badge-approved {
        background: rgba(34, 197, 94, 0.15);
        color: #16a34a;
      }
      .history-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
      .history-summary {
        margin: 0.5rem 0 0;
        font-size: 0.825rem;
        color: var(--text-secondary);
        line-height: 1.4;
      }
      .loading,
      .empty {
        text-align: center;
        color: var(--text-secondary);
        padding: 2rem 0;
      }
    `,
  ],
})
export class CustomerDetailDialogComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  readonly data = inject<{ customerId: string }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CustomerDetailDialogComponent>);

  customer = signal<CustomerWithHistoryDto | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.adminApi.getCustomerWithHistory(this.data.customerId).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
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

  formatDuration(seconds: number): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
}
