import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Role } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'siipe_token';
  private readonly USER_KEY = 'siipe_user';

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response));
        this.currentUserSubject.next(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: Role): boolean {
    return this.getCurrentUser()?.role === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    const userRole = this.getCurrentUser()?.role;
    return roles.some(r => r === userRole);
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  isDelegue(): boolean {
    return this.hasRole('ROLE_DELEGUE');
  }

  isAssistanteSociale(): boolean {
    return this.hasRole('ROLE_ASSISTANTE_SOCIALE');
  }

  canDelete(): boolean {
    return this.hasAnyRole(['ROLE_ADMIN', 'ROLE_DELEGUE']);
  }

  canManagePersonnel(): boolean {
    return this.hasAnyRole([
      'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
      'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE'
    ]);
  }

  canManageBeneficiaires(): boolean {
    return this.hasAnyRole([
      'ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE', 'ROLE_DIRECTEUR_CENTRALE'
    ]);
  }

  getUserProvinceId(): number | undefined {
    return this.getCurrentUser()?.provinceId;
  }

  getUserEtablissementId(): number | undefined {
    return (this.getCurrentUser() as any)?.etablissementId;
  }

  private loadUser(): LoginResponse | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}
