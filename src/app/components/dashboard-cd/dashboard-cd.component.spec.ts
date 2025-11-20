import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCdComponent } from './dashboard-cd.component';

describe('DashboardCdComponent', () => {
  let component: DashboardCdComponent;
  let fixture: ComponentFixture<DashboardCdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCdComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardCdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
