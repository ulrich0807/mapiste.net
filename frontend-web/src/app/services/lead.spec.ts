import { TestBed } from '@angular/core/testing';

import { Lead } from './lead';

describe('Lead', () => {
  let service: Lead;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Lead);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
