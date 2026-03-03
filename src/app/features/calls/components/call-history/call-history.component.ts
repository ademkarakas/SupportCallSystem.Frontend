import { Component, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { CallApiService, CallRecord } from '../../services/call-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-call-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
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
    'startTime',
    'customer',
    'category',
    'duration',
    'summary',
    'actions',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const view = params['view'];
      const customerId = params['customerId'];

      if (view === 'all') {
        this.loadAgentHistory();
      } else if (customerId) {
        this.loadCustomerHistory(customerId);
      } else {
        this.loadAgentHistory(); // Default to agent history for security/privacy
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadAgentHistory() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.callApi.getHistoryByAgent(user.id).subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: () => this.notification.showError('Could not retrieve call logs.'),
    });
  }

  loadCustomerHistory(customerId: string) {
    this.callApi.getCallHistory(customerId).subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: () => this.notification.showError('Could not retrieve call logs.'),
    });
  }

  loadHistory() {
    // Legacy method - redirecting
    this.loadAgentHistory();
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
}
