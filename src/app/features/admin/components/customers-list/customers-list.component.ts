import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { AdminApiService, CustomerDetailDto, PagedResult } from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customers-list',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatPaginatorModule,
  ],
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.scss'],
})
export class CustomersListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly searchSubject = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  customers = signal<CustomerDetailDto[]>([]);
  isLoading = signal(true);
  search = '';
  page = 1;
  pageSize = 20;
  totalPages = signal(1);
  totalCount = signal(0);
  includeDeleted = false;

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => {
          this.page = 1;
          this.isLoading.set(true);
          return this.adminApi
            .getAllCustomers(this.page, this.pageSize, this.search, this.includeDeleted)
            .pipe(
              catchError(() => {
                this.notification.showError('Kunden konnten nicht geladen werden.');
                this.isLoading.set(false);
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (!result) return;
        this.customers.set(result.items);
        this.totalPages.set(result.totalPages);
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
      });
    this.loadCustomers();
  }

  onSearchInput(value: string) {
    this.search = value;
    this.searchSubject.next(value);
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.adminApi
      .getAllCustomers(this.page, this.pageSize, this.search, this.includeDeleted)
      .subscribe({
        next: (result: PagedResult<CustomerDetailDto>) => {
          this.customers.set(result.items);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.isLoading.set(false);
        },
        error: () => {
          this.notification.showError('Kunden konnten nicht geladen werden.');
          this.isLoading.set(false);
        },
      });
  }

  onSearch() {
    this.page = 1;
    this.loadCustomers();
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.onSearch();
  }

  onIncludeDeletedChange() {
    this.page = 1;
    this.loadCustomers();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCustomers();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadCustomers();
    }
  }

  nextPage() {
    if (this.page < this.totalPages()) {
      this.page++;
      this.loadCustomers();
    }
  }

  viewCustomer(customer: CustomerDetailDto) {
    this.router.navigate(['/admin/customers', customer.id, 'edit']);
  }

  createCustomer() {
    this.router.navigate(['/admin/customers/new']);
  }

  deleteCustomer(customer: CustomerDetailDto) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Kunde löschen',
        message: `Möchten Sie den Kunden "${customer.fullName}" wirklich löschen? (Soft-Delete)`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminApi.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.notification.showSuccess('Kunde wurde gelöscht.');
            this.loadCustomers();
          },
          error: () => this.notification.showError('Kunde konnte nicht gelöscht werden.'),
        });
      }
    });
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
}
