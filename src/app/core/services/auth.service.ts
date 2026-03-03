import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  extension: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Signals for reactive state
  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  private _token = signal<string | null>(this.loadTokenFromStorage());

  public currentUser = computed(() => this._currentUser());
  public isAuthenticated = computed(() => !!this._token());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  public login(credentials: { email: string; password: any }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, credentials).pipe(
      tap((response) => {
        this.setSession(response);
      }),
    );
  }

  public logout(): void {
    sessionStorage.clear();
    this._currentUser.set(null);
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  public getToken(): string | null {
    return this._token();
  }

  private setSession(authResponse: AuthResponse): void {
    sessionStorage.setItem(this.TOKEN_KEY, authResponse.token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));

    this._token.set(authResponse.token);
    this._currentUser.set(authResponse.user);
  }

  private loadTokenFromStorage(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  private loadUserFromStorage(): User | null {
    const userJson = sessionStorage.getItem(this.USER_KEY);
    if (!userJson || userJson === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('AuthService: Failed to parse user from storage:', e);
      return null;
    }
  }
}
