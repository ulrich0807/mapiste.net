import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DecouverteService {
  private apiUrl = 'http://127.0.0.1:8000/api/decouvertes';

  constructor(private http: HttpClient) {}

  // 1. Récupérer l'annuaire (Maquis, Artisans...)
  getDecouvertes(filtres?: any, page: number = 1): Observable<any> {
    let params = new HttpParams().set('page', page.toString());
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        if (filtres[key] !== undefined && filtres[key] !== null && filtres[key] !== '') {
          params = params.set(key, filtres[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  // 2. Créer une nouvelle fiche établissement/artisan
  creerDecouverte(formData: FormData): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.post<any>(this.apiUrl, formData, { headers });
  }

  // 3. Récupérer les fiches de l'utilisateur connecté
  getMesDecouvertes(): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    const url = this.apiUrl.replace('/decouvertes', '/mes-decouvertes');
    return this.http.get<any>(url, { headers });
  }

  // 4. Supprimer une fiche
  supprimerDecouverte(id: number): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }

  // Récupérer une fiche spécifique par son ID
  getDecouverteById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Mettre à jour un établissement (Annuaire)
  updateDecouverte(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<any>(`${this.apiUrl}/${id}/update`, data, { headers });
  }
}