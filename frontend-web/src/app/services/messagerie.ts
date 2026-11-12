import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessagerieService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('macaz_token')}` });
  }

  getConversations(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
  }

  getMessages(interlocuteurId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${interlocuteurId}`, { headers: this.getHeaders() });
  }

  sendMessage(receiverId: number, contenu: string, annonceId?: number): Observable<any> {
    const body = { receiver_id: receiverId, contenu, annonce_id: annonceId };
    return this.http.post<any>(this.apiUrl, body, { headers: this.getHeaders() });
  }
}
