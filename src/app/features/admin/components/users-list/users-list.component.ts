import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdminApiService, UserDto } from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
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

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.isLoading.set(true);
    this.adminApi.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
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
}
