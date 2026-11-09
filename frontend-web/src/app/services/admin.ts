import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://127.0.0.1:8000/api/admin';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('macaz_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  // 1. Récupérer toutes les données du dashboard
  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`, { headers: this.getHeaders() });
  }

  // 2. Bannir / Supprimer un utilisateur
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  // 3. Supprimer une annonce immobilière
  deleteAnnonce(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/annonces/${id}`, { headers: this.getHeaders() });
  }

  // 4. Supprimer une fiche annuaire (découverte)
  deleteDecouverte(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/decouvertes/${id}`, { headers: this.getHeaders() });
  }

  // --- NOUVELLES ACTIONS DE MODÉRATION ---

  // Promouvoir/Rétrograder un admin
  toggleAdmin(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/${id}/toggle-admin`, {}, { headers: this.getHeaders() });
  }

  // Suspendre/Réactiver un compte
  toggleActive(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/${id}/toggle-active`, {}, { headers: this.getHeaders() });
  }

  // Valider une annonce
  validerAnnonce(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/annonces/${id}/valider`, {}, { headers: this.getHeaders() });
  }

  // Valider une fiche annuaire
  validerDecouverte(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/decouvertes/${id}/valider`, {}, { headers: this.getHeaders() });
  }
}