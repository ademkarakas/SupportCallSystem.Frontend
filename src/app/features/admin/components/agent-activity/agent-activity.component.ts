import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  AdminApiService,
  AgentActivityDto,
  AgentActivityRow,
} from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-agent-activity',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './agent-activity.component.html',
  styleUrls: ['./agent-activity.component.scss'],
})
export class AgentActivityComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);

  activityData = signal<AgentActivityDto | null>(null);
  isLoading = signal(true);
  selectedAgent = signal<AgentActivityRow | null>(null);
  isPanelOpen = signal(false);

  ngOnInit() {
    this.loadActivity();
  }

  loadActivity() {
    this.isLoading.set(true);
    this.adminApi.getAgentActivity().subscribe({
      next: (data) => {
        this.activityData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.showError('Aktivitätsdaten konnten nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  agents(): AgentActivityRow[] {
    return this.activityData()?.agents ?? [];
  }

  onAgentClick(agent: AgentActivityRow): void {
    this.selectedAgent.set(agent);
    this.isPanelOpen.set(true);
  }

  onPanelClose(): void {
    this.isPanelOpen.set(false);
    this.selectedAgent.set(null);
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }

  formatPercent(value: number): string {
    return `${value.toFixed(0)}%`;
  }

  getCategoryEntries(breakdown: Record<string, number>): { key: string; value: number }[] {
    return Object.entries(breakdown || {}).map(([key, value]) => ({ key, value }));
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      TechnicalIssue: 'Technisch',
      BillingQuestion: 'Abrechnung',
      AccessCredentials: 'Zugangsdaten',
      GeneralInquiry: 'Allgemein',
      Complaint: 'Beschwerde',
      FeatureRequest: 'Feature',
    };
    return map[category] ?? category;
  }
}
