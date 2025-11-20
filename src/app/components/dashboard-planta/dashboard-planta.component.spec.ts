import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPlantaComponent } from './dashboard-planta.component';

describe('DashboardPlantaComponent', () => {
  let component: DashboardPlantaComponent;
  let fixture: ComponentFixture<DashboardPlantaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPlantaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardPlantaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
