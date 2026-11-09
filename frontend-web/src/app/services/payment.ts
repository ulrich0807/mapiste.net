import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentInitiation {
  type: 'boost' | 'subscription' | 'lead_purchase';
  amount: number;
  reference_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://127.0.0.1:8000/api/payment/initiate';

  constructor(private http: HttpClient) { }

  initiatePayment(data: PaymentInitiation): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.post<any>(this.apiUrl, data, { headers });
  }
}
