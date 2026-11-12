import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AnnonceService as Annonce } from './annonce';

describe('Annonce', () => {
  let service: Annonce;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Annonce);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
