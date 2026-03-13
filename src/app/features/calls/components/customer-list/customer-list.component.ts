import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CallApiService, CallRecord } from '../../services/call-api.service';
import { AdminApiService } from '../../../admin/services/admin-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface CustomerListItem {
  key: string;
  fullName: string;
  phoneNumber: string;
  totalCalls: number;
  lastCallTime: string;
}

@Component({
  selector: 'app-call-customers-list',
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatPaginatorModule],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
})
export class CallCustomersListComponent implements OnInit {
  private readonly callApi = inject(CallApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  isLoading = signal(true);
  searchInput = signal('');
  customers = signal<CustomerListItem[]>([]);
  pageIndex = signal(0);
  pageSize = signal(15);
  readonly pageSizeOptions = [15, 30, 50];

  filteredCustomers = computed(() => {
    const query = this.searchInput().trim().toLowerCase();
    if (!query) return this.customers();

    return this.customers().filter(
      (customer) =>
        customer.fullName.toLowerCase().includes(query) || customer.phoneNumber.includes(query),
    );
  });

  pagedCustomers = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredCustomers().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadCustomersFromSql();
  }

  onSearch(value: string): void {
    this.searchInput.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  openProfile(customer: CustomerListItem): void {
    this.router.navigate(['/calls/caller-profile'], {
      queryParams: { phone: customer.phoneNumber },
    });
  }

  private loadCustomersFromSql(): void {
    this.isLoading.set(true);

    this.adminApi.getAllCustomers(1, 500, '', false).subscribe({
      next: (result) => {
        const rows = result.items
          .filter((customer) => !!customer.phoneNumber)
          .map((customer) => ({
            key: customer.id,
            fullName: customer.fullName || `${customer.firstName} ${customer.lastName}`.trim(),
            phoneNumber: customer.phoneNumber,
            totalCalls: customer.totalCallCount,
            lastCallTime: customer.createdAt,
          }));

        this.customers.set(rows);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadCustomersFallbackFromHistory();
      },
    });
  }

  private loadCustomersFallbackFromHistory(): void {
    const user = this.auth.currentUser();
    if (!user?.id) {
      this.notification.showError('Kundenliste konnte nicht geladen werden.');
      this.isLoading.set(false);
      return;
    }

    this.callApi.getHistoryByAgent(user.id).subscribe({
      next: (calls) => {
        this.customers.set(this.mapCustomerRows(calls));
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.showError('Kundenliste konnte nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  private mapCustomerRows(calls: CallRecord[]): CustomerListItem[] {
    const byPhone = new Map<string, CustomerListItem>();

    for (const call of calls) {
      const phone = call.callerNumber?.trim();
      if (!phone) continue;

      const existing = byPhone.get(phone);
      const callTime = new Date(call.startTime).toISOString();
      const customerName = call.customerName?.trim() || 'Unbekannter Kunde';

      if (!existing) {
        byPhone.set(phone, {
          key: phone,
          fullName: customerName,
          phoneNumber: phone,
          totalCalls: 1,
          lastCallTime: callTime,
        });
        continue;
      }

      existing.totalCalls += 1;
      if (new Date(callTime).getTime() > new Date(existing.lastCallTime).getTime()) {
        existing.lastCallTime = callTime;
        if (customerName !== 'Unbekannter Kunde') {
          existing.fullName = customerName;
        }
      }
    }

    return Array.from(byPhone.values()).sort(
      (a, b) => new Date(b.lastCallTime).getTime() - new Date(a.lastCallTime).getTime(),
    );
  }
}
