import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialTicketsComponent } from './historial-tickets.component';

describe('HistorialTicketsComponent', () => {
  let component: HistorialTicketsComponent;
  let fixture: ComponentFixture<HistorialTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialTicketsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
