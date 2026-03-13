import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { AdminApiService, UserDto } from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  users = signal<UserDto[]>([]);
  isLoading = signal(true);
  searchInput = signal('');
  pageIndex = signal(0);
  pageSize = signal(15);
  readonly pageSizeOptions = [15, 30, 50];

  filteredUsers = computed(() => {
    const query = this.searchInput().trim().toLowerCase();
    if (!query) return this.users();

    return this.users().filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.extension || '').toLowerCase().includes(query)
      );
    });
  });

  pagedUsers = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.isLoading.set(true);
    this.adminApi.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.pageIndex.set(0);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.showError('Benutzer konnten nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  createUser() {
    this.router.navigate(['/admin/users/new']);
  }

  editUser(user: UserDto) {
    this.router.navigate(['/admin/users', user.id, 'edit']);
  }

  deleteUser(user: UserDto) {
    if (user.id === this.auth.currentUser()?.id) {
      this.notification.showError('Sie können sich nicht selbst löschen.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Benutzer löschen',
        message: `Möchten Sie den Benutzer "${user.firstName} ${user.lastName}" wirklich löschen?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminApi.deleteUser(user.id).subscribe({
          next: () => {
            this.notification.showSuccess('Benutzer wurde gelöscht.');
            this.loadUsers();
          },
          error: () => this.notification.showError('Benutzer konnte nicht gelöscht werden.'),
        });
      }
    });
  }

  getRoleBadgeClass(roles: string[]): string {
    if (roles.includes('SystemAdmin')) return 'badge-admin';
    if (roles.includes('UserAdmin')) return 'badge-useradmin';
    return 'badge-agent';
  }

  getRoleLabel(roles: string[]): string {
    if (roles.includes('SystemAdmin')) return 'System Admin';
    if (roles.includes('UserAdmin')) return 'User Admin';
    return 'Agent';
  }

  onSearch(value: string): void {
    this.searchInput.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
