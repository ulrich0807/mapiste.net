import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisiteService {
  private apiUrl = 'http://127.0.0.1:8000/api/visites';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('macaz_token')}` });
  }

  programmerVisite(annonceId: number, dateVisite: string, message?: string): Observable<any> {
    const body = { annonce_id: annonceId, date_visite: dateVisite, message };
    return this.http.post<any>(this.apiUrl, body, { headers: this.getHeaders() });
  }

  getMesVisites(): Observable<any> {
    return this.http.get<any>('http://127.0.0.1:8000/api/mes-visites', { headers: this.getHeaders() });
  }

  getDemandesRecues(): Observable<any> {
    return this.http.get<any>('http://127.0.0.1:8000/api/demandes-visites', { headers: this.getHeaders() });
  }

  changerStatut(visiteId: number, statut: 'validee' | 'annulee' | 'terminee'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${visiteId}/statut`, { statut }, { headers: this.getHeaders() });
  }
}
