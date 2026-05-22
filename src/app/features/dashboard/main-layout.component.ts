import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { SignalRService, IncomingCallEvent } from '../../core/services/signalr.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerPopupComponent } from '../calls/components/customer-popup/customer-popup.component';
import { CallApiService } from '../calls/services/call-api.service';
import { DebugPanelComponent } from './debug-panel.component';
import { UserSettingsDialogComponent } from '../../shared/components/user-settings-dialog/user-settings-dialog.component';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { SessionTimeoutService } from '../../core/services/session-timeout.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatDialogModule,
    MatMenuModule,
    DebugPanelComponent,
    NotificationBellComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly _sessionTimeout = inject(SessionTimeoutService); // activates idle detection
  auth = inject(AuthService);
  signalR = inject(SignalRService);
  theme = inject(ThemeService);
  dialog = inject(MatDialog);
  callApi = inject(CallApiService);
  notification = inject(NotificationService);
  router = inject(Router);

  isMobile = signal(window.innerWidth <= 768);
  isSidebarCollapsed = signal(false);
  isMobileMenuOpen = signal(false);
  debugPanelVisible = signal(false);

  // Dropdown states
  isCallsMenuOpen = signal(false);
  isAdminMenuOpen = signal(false);

  userInitials = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return '?';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase();
  });

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth <= 768);
    });
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
    } else {
      this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  closeAllDropdowns() {
    this.isCallsMenuOpen.set(false);
    this.isAdminMenuOpen.set(false);
  }

  toggleCallsMenu() {
    this.isAdminMenuOpen.set(false);
    if (this.isSidebarCollapsed() && !this.isMobile()) {
      this.isSidebarCollapsed.set(false);
      this.isCallsMenuOpen.set(true);
    } else {
      this.isCallsMenuOpen.set(!this.isCallsMenuOpen());
    }
  }

  toggleAdminMenu() {
    this.isCallsMenuOpen.set(false);
    if (this.isSidebarCollapsed() && !this.isMobile()) {
      this.isSidebarCollapsed.set(false);
      this.isAdminMenuOpen.set(true);
    } else {
      this.isAdminMenuOpen.set(!this.isAdminMenuOpen());
    }
  }

  toggleTheme() {
    this.theme.toggleTheme();
  }

  toggleDebug() {
    this.debugPanelVisible.set(!this.debugPanelVisible());
  }

  ngOnInit() {
    this.signalR.incomingCall$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event) {
        this.handleIncomingCall(event);
      }
    });
  }

  private handleIncomingCall(event: IncomingCallEvent) {
    const dialogRef = this.dialog.open(CustomerPopupComponent, {
      width: '440px',
      data: event,
      disableClose: true,
      panelClass: 'customer-popup-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'accept') {
        this.acceptCall(event);
      }
    });
  }

  private acceptCall(event: IncomingCallEvent) {
    const user = this.auth.currentUser();
    const userId = user?.id || 'system';

    if (!userId) {
      this.notification.showError('Benutzerinformationen sind nicht verfügbar.');
      return;
    }

    // Send null for customerId if customer is not identified
    this.callApi
      .startCall({
        customerId: event.customer?.id || null,
        agentUserId: userId,
        nfonCallId: event.callId,
        callerNumber: event.callerNumber,
      })
      .subscribe({
        next: (res) => {
          this.router.navigate(['/calls'], { queryParams: { id: res.callId } });
        },
        error: (err) => {
          console.error('Failed to start call:', err);
          this.notification.showError('Anruf konnte nicht gestartet werden.');
        },
      });
  }

  getHeaderTitle(): string {
    const url = this.router.url;
    if (url.includes('/admin/live')) return 'Live-Dashboard';
    if (url.includes('/admin/activity')) return 'Mitarbeiter-Aktivität';
    if (url.includes('/admin/customers')) return 'Kundenverwaltung';
    if (url.includes('/admin/users')) return 'Benutzerverwaltung';
    if (url.includes('/admin/audit-log')) return 'Prüfprotokoll';
    if (url.includes('/settings/security')) return '2FA Sicherheit';
    if (url.includes('/dashboard')) return 'Systemübersicht';
    if (url.includes('/calls/customers')) return 'Kundenliste';
    if (url.includes('/calls/history')) return 'Anrufhistorie';
    if (url.includes('/calls')) return 'Aktiver Anrufbereich';
    if (url.includes('/reports')) return 'Analyse & Berichte';
    if (url.includes('/notifications')) return 'Benachrichtigungen';
    return 'Verwaltungssystem';
  }

  /**
   * Opens the User Settings dialog.
   * Displays profile and security settings for the currently logged-in user.
   */
  openUserSettings(): void {
    this.dialog.open(UserSettingsDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'user-settings-dialog',
      disableClose: false,
      autoFocus: 'first-tabbable',
    });
  }

  logout() {
    this.auth.logout();
    this.signalR.stopConnection();
  }
}
