import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { CustomerPopupComponent } from '../calls/components/customer-popup/customer-popup.component';
import { CallApiService } from '../calls/services/call-api.service';
import { DebugPanelComponent } from './debug-panel.component';
import { UserSettingsDialogComponent } from '../../shared/components/user-settings-dialog/user-settings-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
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
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
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
  private destroy$ = new Subject<void>();
  debugPanelVisible = signal(false);

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

  toggleTheme() {
    this.theme.toggleTheme();
  }

  toggleDebug() {
    this.debugPanelVisible.set(!this.debugPanelVisible());
  }

  ngOnInit() {
    this.signalR.incomingCall$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
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
      this.notification.showError('User information not available');
      return;
    }

    // Send null for customerId if customer is not identified
    this.callApi
      .startCall({
        customerId: event.customer?.id || null,
        agentUserId: userId,
        nfonCallId: event.callId,
      })
      .subscribe({
        next: (res) => {
          this.router.navigate(['/calls'], { queryParams: { id: res.callId } });
        },
        error: (err) => {
          console.error('Failed to start call:', err);
          this.notification.showError('Failed to start call');
        },
      });
  }

  getHeaderTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Systemübersicht';
    if (url.includes('/calls/history')) return 'Anrufhistorie';
    if (url.includes('/calls')) return 'Aktiver Call Workspace';
    if (url.includes('/reports')) return 'Analyse & Berichte';
    return 'Management System';
  }

  /**
   * Opens the User Settings dialog.
   * Displays profile and security settings for the currently logged-in user.
   */
  openUserSettings(): void {
    this.dialog.open(UserSettingsDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '80vh',
      panelClass: 'user-settings-dialog',
      disableClose: false,
      autoFocus: 'first-tabbable',
    });
  }

  logout() {
    this.auth.logout();
    this.signalR.stopConnection();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
