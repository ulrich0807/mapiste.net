import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadsBoard } from './leads-board';

describe('LeadsBoard', () => {
  let component: LeadsBoard;
  let fixture: ComponentFixture<LeadsBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsBoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadsBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
