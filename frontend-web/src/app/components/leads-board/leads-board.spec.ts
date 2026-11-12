import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadsBoardComponent as LeadsBoard } from './leads-board';

describe('LeadsBoard', () => {
  let component: LeadsBoard;
  let fixture: ComponentFixture<LeadsBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [LeadsBoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadsBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/leads?page=1`)
      .flush({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('charge la page suivante et actualise les informations de navigation', () => {
    component.loadLeads(2);
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/leads?page=2`)
      .flush({ data: [], meta: { current_page: 2, last_page: 3, total: 40 } });
    expect(component.currentPage).toBe(2);
    expect(component.lastPage).toBe(3);
    expect(component.total).toBe(40);
  });

  it('affiche une erreur recuperable sans faire passer un echec pour une liste vide', () => {
    component.loadLeads();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/leads?page=1`)
      .flush({}, { status: 500, statusText: 'Server Error' });
    expect(component.erreur).toBeTruthy();
    expect(component.chargement).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Aucune demande client disponible');
  });
});
