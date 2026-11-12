import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth-interceptor';

describe('Session API', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  const navigate = vi.fn(() => Promise.resolve(true));

  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: Router, useValue: { navigate } }
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    localStorage.setItem('macaz_token', 'session-a');
  });

  afterEach(() => { requests.verify(); localStorage.clear(); });

  it('ajoute le jeton aux requetes API', () => {
    http.get(`${environment.apiUrl}/user`).subscribe();
    const req = requests.expectOne(`${environment.apiUrl}/user`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer session-a');
    req.flush({ id: 1 });
  });

  it('ne transmet pas le jeton a un autre domaine', () => {
    http.get('https://external.example/api/user').subscribe();
    const req = requests.expectOne('https://external.example/api/user');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('ne transmet pas le jeton a un chemin ressemblant a celui de l API', () => {
    http.get(`${environment.apiUrl}-other/user`).subscribe();
    const req = requests.expectOne(`${environment.apiUrl}-other/user`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('efface une session refusee et redirige vers la connexion', () => {
    http.get(`${environment.apiUrl}/user`).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/user`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem('macaz_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth']);
  });

  it('conserve la session lors d un simple refus de permission', () => {
    http.get(`${environment.apiUrl}/admin/dashboard`).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/admin/dashboard`).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(localStorage.getItem('macaz_token')).toBe('session-a');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ne supprime pas une nouvelle session a cause d une ancienne reponse', () => {
    http.get(`${environment.apiUrl}/user`).subscribe({ error: () => {} });
    localStorage.setItem('macaz_token', 'session-b');
    requests.expectOne(`${environment.apiUrl}/user`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem('macaz_token')).toBe('session-b');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('efface la session en cas de suspension', () => {
    http.get(`${environment.apiUrl}/user`).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/user`).flush({ code: 'ACCOUNT_SUSPENDED' }, { status: 403, statusText: 'Forbidden' });
    expect(localStorage.getItem('macaz_token')).toBeNull();
  });

  it('ne joint pas de session aux demandes de reinitialisation', () => {
    http.post(`${environment.apiUrl}/forgot-password`, { email: 'test@example.com' }).subscribe();
    const req = requests.expectOne(`${environment.apiUrl}/forgot-password`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ success: true });
  });
});
