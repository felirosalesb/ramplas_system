import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardGalponComponent } from './dashboard-galpon.component';

describe('DashboardGalponComponent', () => {
  let component: DashboardGalponComponent;
  let fixture: ComponentFixture<DashboardGalponComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardGalponComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardGalponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
