import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  extension: string;
  roles: string[];
}

export interface CustomerDetailDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  company: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  isDeleted: boolean;
  totalCallCount: number;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AgentActivityRow {
  agentId: string;
  agentName: string;
  totalCalls: number;
  uniqueCustomers: number;
  averageDurationSeconds: number;
  consentRate: number;
  categoryBreakdown: Record<string, number>;
}

export interface AgentActivityDto {
  agents: AgentActivityRow[];
  totalCalls: number;
  totalUniqueCustomers: number;
  averageDurationSeconds: number;
}

export interface CustomerWithHistoryDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  company: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  totalCallCount: number;
  recentCalls: CallHistoryItemDto[];
}

export interface CallHistoryItemDto {
  id: string;
  startTime: string;
  durationSeconds: number;
  category: string;
  summary: string | null;
  summaryStatus: string;
  actionItems: string[] | null;
  handledByUserId?: string;
  agentName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ── Users ──

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/api/users`);
  }

  getUserById(userId: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/api/users/${userId}`);
  }

  updateUser(
    userId: string,
    data: { firstName: string; lastName: string; email: string; extension: string; role: string },
  ): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/users/${userId}`, data);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/users/${userId}`);
  }

  createUser(data: {
    userName: string;
    email: string;
    password: string;
    role: string;
  }): Observable<{ userId: string }> {
    return this.http.post<{ userId: string }>(`${this.apiUrl}/api/users`, data);
  }

  // ── Customers ──

  getAllCustomers(
    page = 1,
    pageSize = 20,
    search = '',
    includeDeleted = false,
  ): Observable<PagedResult<CustomerDetailDto>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)
      .set('includeDeleted', includeDeleted);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PagedResult<CustomerDetailDto>>(`${this.apiUrl}/api/customers`, {
      params,
    });
  }

  getCustomerWithHistory(customerId: string): Observable<CustomerWithHistoryDto> {
    return this.http.get<CustomerWithHistoryDto>(
      `${this.apiUrl}/api/customers/${customerId}/with-history`,
    );
  }

  getCustomerById(customerId: string): Observable<CustomerDetailDto> {
    return this.http.get<CustomerDetailDto>(`${this.apiUrl}/api/customers/${customerId}`);
  }

  createCustomer(data: {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    company?: string;
  }): Observable<{ customerId: string }> {
    return this.http.post<{ customerId: string }>(`${this.apiUrl}/api/customers`, data);
  }

  updateCustomer(
    customerId: string,
    data: { firstName: string; lastName: string; email?: string; company?: string },
  ): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/customers/${customerId}`, data);
  }

  deleteCustomer(customerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/customers/${customerId}`);
  }

  linkCustomerToCall(callId: string, customerId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/calls/${callId}/customer`, { customerId });
  }

  // ── Agent Activity ──

  getAgentActivity(from?: string, to?: string): Observable<AgentActivityDto> {
    const toDate = to ?? new Date().toISOString();
    const fromDate = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let params = new HttpParams().set('from', fromDate).set('to', toDate);
    return this.http.get<AgentActivityDto>(`${this.apiUrl}/api/calls/agent-activity`, { params });
  }
}
