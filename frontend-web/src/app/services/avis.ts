import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvisService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('macaz_token');
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }

  laisserAvis(note: number, commentaire: string, targetId?: number, annonceId?: number): Observable<any> {
    const body = { note, commentaire, target_id: targetId, annonce_id: annonceId };
    return this.http.post<any>(`${this.apiUrl}/avis`, body, { headers: this.getHeaders() });
  }

  getAvisAnnonce(annonceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/annonces/${annonceId}/avis`);
  }
}
