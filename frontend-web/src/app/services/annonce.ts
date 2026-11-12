import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnnonceService {
  private apiUrl = `${environment.apiUrl}/annonces`;

  constructor(private http: HttpClient) {}

  // 1. R�cup�rer TOUTES les annonces publiques (Pour la Carte, la page Louer, etc.)
  getAnnonces(filtres?: any, page: number = 1): Observable<any> {
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

  // 2. Cr�er une nouvelle annonce (Prot�g� par Token)
  creerAnnonce(formData: FormData): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.post<any>(this.apiUrl, formData, { headers });
  }

  // 3. R�cup�rer uniquement les annonces de l'utilisateur (Pour la page G�rer)
  getMesAnnonces(): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    const url = this.apiUrl.replace('/annonces', '/mes-annonces');
    return this.http.get<any>(url, { headers });
  }

  // 4. Supprimer une annonce
  supprimerAnnonce(id: number): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
  // R�cup�rer une annonce par son ID
  getAnnonceById(id: string): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders()
    });
  }

  // R�cup�rer les donn�es dynamiques de la page d'accueil
  getHomeData(): Observable<any> {
    // Si ton URL de base est ${environment.apiUrl}/annonces, on la remplace pour cibler /home-data
    const homeUrl = this.apiUrl.replace('/annonces', '/home-data');
    return this.http.get<any>(homeUrl);
  }

  // Dans AnnonceService

  // Mettre � jour une annonce immobili�re
  updateAnnonce(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    // On utilise POST car on envoie potentiellement des fichiers (FormData)
    return this.http.post<any>(`${this.apiUrl}/${id}/update`, data, { headers });
  }

  // Mettre � jour un �tablissement (Annuaire)
  updateDecouverte(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    // Si l'URL de base de l'annuaire est diff�rente, adapte-la (ex: /api/decouvertes)
    return this.http.post<any>(`${environment.apiUrl}/decouvertes/${id}/update`, data, { headers });
  }

  // R�cup�rer les d�tails d'une seule annonce
  getAnnonce(id: number): Observable<any> {
    return this.getAnnonceById(String(id));
  }

  // Favoris
  toggleFavori(id: number): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<any>(`${this.apiUrl}/${id}/favoris`, {}, { headers });
  }

  getMesFavoris(): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<any>(`${environment.apiUrl}/mes-favoris`, { headers });
  }

  // Activer le mode Premium pour une annonce
  boostAnnonce(id: number): Observable<any> {
    const token = localStorage.getItem('macaz_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<any>(`${this.apiUrl}/${id}/boost`, {}, { headers });
  }
}
