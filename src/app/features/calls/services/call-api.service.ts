import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

export interface CallRecord {
  id: string;
  customerId: string | null;
  customerName?: string;
  callerNumber?: string; // NFON/SIP phone number of the caller
  startTime: Date;
  endTime?: Date;
  durationSeconds: number;
  handledByUserId: string;
  consent: number | string; // Enum from backend: 0=NotAsked, 1=Granted, 2=Declined
  category: string;
  summaryStatus: string;
  draftSummary?: string;
  approvedSummary?: string;
  actionItems?: string[];
  nfonCallId?: string;
}

export interface UpdateCallDto {
  draftSummary?: string;
  category?: string;
  actionItems?: string[];
  nfonCallId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CallApiService {
  private readonly baseUrl = `${environment.apiUrl}/api/calls`;
  private readonly authService = inject(AuthService);

  constructor(private readonly http: HttpClient) {}

  public getActiveCall(agentId: string): Observable<CallRecord | null> {
    return this.http.get<CallRecord | null>(`${this.baseUrl}/active/${agentId}`);
  }

  public getCallById(callId: string): Observable<CallRecord | null> {
    return this.http.get<CallRecord | null>(`${this.baseUrl}/${callId}`);
  }

  public getCallHistory(customerId: string): Observable<CallRecord[]> {
    return this.http.get<CallRecord[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  public getCallsByPhone(phoneNumber: string): Observable<CallRecord[]> {
    return this.http.get<CallRecord[]>(`${this.baseUrl}/phone/${encodeURIComponent(phoneNumber)}`);
  }

  public getHistoryByAgent(agentId: string): Observable<CallRecord[]> {
    return this.http.get<CallRecord[]>(`${this.baseUrl}/agent/${agentId}`);
  }

  public startCall(request: {
    customerId: string | null;
    agentUserId: string;
    nfonCallId?: string;
  }): Observable<{ callId: string }> {
    return this.http.post<{ callId: string }>(`${this.baseUrl}/start`, request);
  }

  public endCall(callId: string, endTime: Date): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${callId}/end`, { endTime });
  }

  public recordConsent(callId: string, consentGiven: boolean): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${callId}/consent`, {
      consentGiven,
      consentType: 'AiProcessing',
      userId: this.authService.currentUser()?.id ?? '',
    });
  }

  public approveSummary(
    callId: string,
    editedSummary: string,
    category: string,
    actionItems: string[],
    approvedByUserId: string,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${callId}/approve-summary`, {
      editedSummary,
      category,
      actionItems,
      approvedByUserId,
    });
  }

  public tidyUpNotes(callId: string, manualNotes: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${callId}/tidy-up`, { manualNotes });
  }

  public updateCall(callId: string, updateDto: Partial<UpdateCallDto>): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${callId}`, updateDto);
  }

  public getDashboardStats(agentId: string): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats/${agentId}`);
  }

  public linkCustomerToCall(callId: string, customerId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${callId}/customer`, { customerId });
  }

  public getRecentActivities(agentId: string, count: number = 5): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(
      `${this.baseUrl}/recent-activities/${agentId}?count=${count}`,
    );
  }
}

export interface DashboardStats {
  totalCallsToday: number;
  averageDuration: string;
  resolutionRatePercentage: number;
  openTasksCount: number;
  totalCallsGrowth: string;
  durationChange: string;
  resolutionGrowth: string;
}

export interface RecentActivity {
  callId: string;
  title: string;
  customerName: string;
  timestamp: Date;
  relativeTime: string;
  category: string;
  status: string;
}
