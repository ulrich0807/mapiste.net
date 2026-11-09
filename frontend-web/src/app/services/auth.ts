import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Note : Ajuste l'import selon tes alias ou utilise '@angular/common/http'
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  
  // Un BehaviorSubject permet de diffuser l'état de connexion à toute l'application en temps réel
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    // Recharger l'utilisateur si un token existe au démarrage
    const user = localStorage.getItem('macaz_user');
    if (user) {
      this.userSubject.next(JSON.parse(user));
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

  private sauvegarderSession(res: any) {
    localStorage.setItem('macaz_token', res.token);
    localStorage.setItem('macaz_user', JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }

  logout(): void {
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
          // Mettre à jour l'utilisateur local
          localStorage.setItem('macaz_user', JSON.stringify(res.user));
          this.userSubject.next(res.user);
        }
      })
    );
  }
}