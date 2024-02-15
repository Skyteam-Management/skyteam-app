import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LideresTableComponent } from './lideres-table.component';

describe('LideresTableComponent', () => {
  let component: LideresTableComponent;
  let fixture: ComponentFixture<LideresTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LideresTableComponent]
    });
    fixture = TestBed.createComponent(LideresTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
