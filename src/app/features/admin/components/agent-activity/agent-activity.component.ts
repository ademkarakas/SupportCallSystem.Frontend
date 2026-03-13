import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  AdminApiService,
  AgentActivityDto,
  AgentActivityRow,
} from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-agent-activity',
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatPaginatorModule],
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
  searchInput = signal('');
  pageIndex = signal(0);
  pageSize = signal(15);
  readonly pageSizeOptions = [15, 30, 50];

  ngOnInit() {
    this.loadActivity();
  }

  loadActivity() {
    this.isLoading.set(true);
    this.adminApi.getAgentActivity().subscribe({
      next: (data) => {
        this.activityData.set(data);
        this.pageIndex.set(0);
        this.syncSelectedAgentForCurrentPage();
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

  filteredAgents(): AgentActivityRow[] {
    const query = this.searchInput().trim().toLowerCase();
    const all = this.agents();
    if (!query) return all;

    return all.filter((agent) => {
      const name = agent.agentName.toLowerCase();
      const calls = String(agent.totalCalls);
      return name.includes(query) || calls.includes(query);
    });
  }

  pagedAgents(): AgentActivityRow[] {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredAgents().slice(start, start + this.pageSize());
  }

  onSearch(value: string): void {
    this.searchInput.set(value);
    this.pageIndex.set(0);
    this.syncSelectedAgentForCurrentPage();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.syncSelectedAgentForCurrentPage();
  }

  onAgentClick(agent: AgentActivityRow): void {
    this.selectedAgent.set(agent);
    this.isPanelOpen.set(true);
  }

  onPanelClose(): void {
    this.isPanelOpen.set(false);
    this.selectedAgent.set(null);
  }

  private syncSelectedAgentForCurrentPage(): void {
    const selected = this.selectedAgent();
    if (!selected) return;

    const isVisibleOnCurrentPage = this.pagedAgents().some(
      (agent) => agent.agentId === selected.agentId,
    );

    if (!isVisibleOnCurrentPage) {
      this.onPanelClose();
    }
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
