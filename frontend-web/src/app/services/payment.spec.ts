import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PaymentService as Payment } from './payment';

describe('Payment', () => {
  let service: Payment;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Payment);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
