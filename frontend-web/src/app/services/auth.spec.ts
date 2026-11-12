import { TestBed } from '@angular/core/testing';

import { AuthService as Auth } from './auth';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('revoque le jeton serveur avant de fermer la session locale', () => {
    localStorage.setItem('macaz_token', 'session');
    service.logout();
    const req = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/logout`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer session');
    expect(service.getToken()).toBeNull();
    req.flush({ success: true });
  });

  it('envoie la demande de reinitialisation a l API', () => {
    service.forgotPassword('test@example.com').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/forgot-password`);
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush({ success: true });
  });

  it('ferme la session locale apres confirmation de la nouvelle adresse', () => {
    localStorage.setItem('macaz_token', 'session');
    service.confirmEmailChange('123456').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/user/email/verify`);
    expect(req.request.body).toEqual({ code: '123456' });
    req.flush({ success: true, reauthenticate: true });
    expect(service.getToken()).toBeNull();
  });

  it('conserve la session et l adresse actuelle lorsque le code est refuse', () => {
    localStorage.setItem('macaz_token', 'session');
    service.confirmEmailChange('000000').subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/user/email/verify`)
      .flush({ message: 'Code incorrect' }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(service.getToken()).toBe('session');
  });

  it('actualise le profil apres annulation de la demande', () => {
    service.getUser().subscribe();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/user`)
      .flush({ id: 1, email: 'old@example.com', pending_email: 'new@example.com' });
    service.cancelEmailChange().subscribe();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/user/email/cancel`)
      .flush({ success: true });
    const user = JSON.parse(localStorage.getItem('macaz_user')!);
    expect(user.email).toBe('old@example.com');
    expect(user.pending_email).toBeNull();
  });
});
