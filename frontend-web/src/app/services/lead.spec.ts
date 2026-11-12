import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { TestBed } from '@angular/core/testing';

import { LeadService as Lead } from './lead';

describe('Lead', () => {
  let service: Lead;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Lead);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('demande la page indiquee et conserve les informations de pagination', () => {
    service.getLeads(2).subscribe(page => expect(page.meta.current_page).toBe(2));
    const req = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/leads?page=2`);
    req.flush({ data: [], meta: { current_page: 2, last_page: 2, total: 16 } });
  });

  it('extrait le detail depuis la ressource API', () => {
    service.getLead(7).subscribe(lead => {
      expect(lead.id).toBe(7);
      expect(lead.telephone).toBeNull();
    });
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/leads/7`)
      .flush({ data: { id: 7, titre: 'Demande', description: 'Test', telephone: null } });
  });
});
