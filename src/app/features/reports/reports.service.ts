import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DailyCallCount {
  date: string;
  count: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface SummaryStatusBreakdown {
  none: number;
  draft: number;
  approved: number;
}

export interface ReportsData {
  totalCalls: number;
  averageDurationSeconds: number;
  resolutionRate: number;
  consentGrantedRate: number;
  dailyCallCounts: DailyCallCount[];
  categoryStats: CategoryStat[];
  summaryStatusBreakdown: SummaryStatusBreakdown;
}

export interface AgentInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  extension: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiUrl}/api/reports`;
  private readonly usersUrl = `${environment.apiUrl}/api/users`;

  getReportsData(dateFrom: Date, dateTo: Date, agentId?: string | null): Observable<ReportsData> {
    const params = this.buildParams(dateFrom, dateTo, agentId);
    return this.http.get<ReportsData>(this.reportsUrl, { params });
  }

  exportReports(dateFrom: Date, dateTo: Date, agentId?: string | null): Observable<Blob> {
    const params = this.buildParams(dateFrom, dateTo, agentId);
    return this.http.get(`${this.reportsUrl}/export`, { params, responseType: 'blob' });
  }

  getAgents(): Observable<AgentInfo[]> {
    return this.http.get<AgentInfo[]>(this.usersUrl);
  }

  private buildParams(
    dateFrom: Date,
    dateTo: Date,
    agentId?: string | null,
  ): Record<string, string> {
    const params: Record<string, string> = {
      dateFrom: this.toIsoDate(dateFrom),
      dateTo: this.toIsoDate(dateTo),
    };
    if (agentId) params['agentId'] = agentId;
    return params;
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
