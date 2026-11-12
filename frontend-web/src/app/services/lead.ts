import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Lead {
  id?: number;
  artisan_id?: number;
  titre: string;
  description: string;
  budget?: number;
  localisation?: string;
  telephone: string | null;
  statut?: string;
  has_purchased?: boolean;
  is_owner?: boolean;
  can_view_contact?: boolean;
}

export interface LeadPage {
  data: Lead[];
  meta: { current_page: number; last_page: number; total: number };
}

export type LeadInput = Pick<Lead, 'titre' | 'description' | 'budget' | 'localisation'> & { telephone: string };

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private apiUrl = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) { }

  getLeads(page = 1): Observable<LeadPage> {
    return this.http.get<LeadPage>(this.apiUrl, { params: { page } });
  }

  getLead(id: number): Observable<Lead> {
    return this.http.get<{ data: Lead }>(`${this.apiUrl}/${id}`).pipe(map(response => response.data));
  }

  createLead(data: LeadInput): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
