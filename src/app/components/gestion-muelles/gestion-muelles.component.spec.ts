import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionMuellesComponent } from './gestion-muelles.component';

describe('GestionMuellesComponent', () => {
  let component: GestionMuellesComponent;
  let fixture: ComponentFixture<GestionMuellesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionMuellesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionMuellesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
