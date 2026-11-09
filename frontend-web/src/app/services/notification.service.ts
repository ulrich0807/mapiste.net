import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth';

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    type_notification: string;
    titre: string;
    message: string;
    url: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8000/api/notifications';
  
  // Signaux pour la réactivité dans les composants
  unreadCount = signal<number>(0);
  notifications = signal<Notification[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  fetchUnread(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.unreadCount.set(response.count);
        this.notifications.set(response.notifications);
      })
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/read`, {}, { headers: this.getHeaders() }).pipe(
      tap(() => {
        // Rafraîchir la liste après lecture
        this.fetchUnread().subscribe();
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/read-all`, {}, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.unreadCount.set(0);
        this.notifications.set([]);
      })
    );
  }
}
