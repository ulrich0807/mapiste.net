import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lead {
  id?: number;
  artisan_id?: number;
  titre: string;
  description: string;
  budget?: number;
  localisation?: string;
  telephone: string;
  statut?: string;
  has_purchased?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private apiUrl = 'http://127.0.0.1:8000/api/leads';

  constructor(private http: HttpClient) { }

  getLeads(): Observable<Lead[]> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get<Lead[]>(this.apiUrl, { headers });
  }

  getLead(id: number): Observable<Lead> {
    return this.http.get<Lead>(`${this.apiUrl}/${id}`);
  }

  createLead(data: Lead): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
