import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorRamplasComponent } from './monitor-ramplas.component';

describe('MonitorRamplasComponent', () => {
  let component: MonitorRamplasComponent;
  let fixture: ComponentFixture<MonitorRamplasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitorRamplasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonitorRamplasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
