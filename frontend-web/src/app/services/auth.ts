import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Note : Ajuste l'import selon tes alias ou utilise '@angular/common/http'
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}`;
  
  // Un BehaviorSubject permet de diffuser l'�tat de connexion � toute l'application en temps r�el
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    // Recharger l'utilisateur si un token existe au d�marrage
    const user = localStorage.getItem('macaz_user');
    if (user) {
      try {
        this.userSubject.next(JSON.parse(user));
      } catch {
        this.clearSession();
      }
    }
  }

  register(donnees: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, donnees).pipe(
      tap(res => {
        if (res.success && res.token) this.sauvegarderSession(res);
      })
    );
  }

  login(donnees: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, donnees).pipe(
      tap(res => {
        if (res.success && res.token) this.sauvegarderSession(res);
      })
    );
  }

  verifyOtp(donnees: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, donnees).pipe(
      tap(res => {
        if (res.success && res.token) this.sauvegarderSession(res);
      })
    );
  }

  resendOtp(donnees: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-otp`, donnees);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  confirmEmailChange(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/email/verify`, { code }).pipe(
      tap(response => { if (response.success) this.clearSession(); })
    );
  }

  cancelEmailChange(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/email/cancel`, {}).pipe(
      tap(response => {
        if (response.success && this.userSubject.value) {
          const user = { ...this.userSubject.value, pending_email: null };
          localStorage.setItem('macaz_user', JSON.stringify(user));
          this.userSubject.next(user);
        }
      })
    );
  }

  resetPassword(data: { email: string; token: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data).pipe(
      tap(() => this.clearSession())
    );
  }

  getUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user`).pipe(
      tap(user => {
        localStorage.setItem('macaz_user', JSON.stringify(user));
        this.userSubject.next(user);
      })
    );
  }

  private sauvegarderSession(res: any) {
    localStorage.setItem('macaz_token', res.token);
    localStorage.setItem('macaz_user', JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        error: () => console.warn('La session locale est fermee ; la revocation serveur a echoue.')
      });
    }
    this.clearSession();
  }

  clearSession(): void {
    localStorage.removeItem('macaz_token');
    localStorage.removeItem('macaz_user');
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('macaz_token');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  updateProfile(formData: FormData): Observable<any> {
    const token = this.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post<any>(`${this.apiUrl}/user/update`, formData, { headers }).pipe(
      tap(res => {
        if (res.success) {
          // Mettre � jour l'utilisateur local
          localStorage.setItem('macaz_user', JSON.stringify(res.user));
          this.userSubject.next(res.user);
        }
      })
    );
  }
}
