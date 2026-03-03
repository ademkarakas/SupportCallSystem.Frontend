import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CallApiService, DashboardStats, RecentActivity } from '../calls/services/call-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { fadeIn, staggerIn } from '../../core/animations/animations';

@Component({
  selector: 'app-dashboard-landing',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './dashboard-landing.component.html',
  styleUrls: ['./dashboard-landing.component.scss'],
  animations: [fadeIn, staggerIn],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  callApi = inject(CallApiService);
  router = inject(Router);
  notification = inject(NotificationService);

  stats = signal<DashboardStats | null>(null);
  activities = signal<RecentActivity[]>([]);

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.loadDashboardData(user.id);
    }
  }

  loadDashboardData(agentId: string) {
    this.callApi.getDashboardStats(agentId).subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.notification.showError('Fehler beim Laden der Statistiken.'),
    });

    this.callApi.getRecentActivities(agentId).subscribe({
      next: (data) => this.activities.set(data),
      error: () => this.notification.showError('Fehler beim Laden der Aktivitäten.'),
    });
  }

  onNewCall() {
    this.notification.showInfo(
      'Warten auf eingehenden Anruf... (Simulation über Debug-Panel möglich)',
    );
  }
}
