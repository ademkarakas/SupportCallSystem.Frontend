import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
  ],
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.scss'],
})
export class CustomersListComponent implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

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
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadCustomers();
      });
    this.loadCustomers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
}
