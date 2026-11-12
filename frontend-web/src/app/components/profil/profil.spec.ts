import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Profil } from './profil';

describe('Profil', () => {
  let component: Profil;
  let fixture: ComponentFixture<Profil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [Profil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Profil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('affiche l adresse actuelle et distingue la nouvelle adresse en attente', () => {
    component.user = {
      id: 1, name: 'Test', email: 'old@example.com', pending_email: 'new@example.com', role: 'locataire'
    };
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('old@example.com');
    const panel = fixture.nativeElement.querySelector('[aria-label="Confirmer la nouvelle adresse e-mail"]');
    expect(panel.textContent).toContain('new@example.com');
    expect(panel.textContent).toContain('Votre adresse actuelle reste active');
  });

  it('refuse localement un code incomplet sans envoyer de requete', () => {
    component.emailCode = '12';
    component.confirmEmail();
    expect(component.emailChangeError).toBeTruthy();
    TestBed.inject(HttpTestingController).expectNone(req => req.url.endsWith('/user/email/verify'));
  });
});
