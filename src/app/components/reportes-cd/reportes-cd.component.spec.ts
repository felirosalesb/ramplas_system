// src/app/components/reportes-cd/reportes-cd.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportesCdComponent } from './reportes-cd.component';

describe('ReportesCdComponent', () => {
  let component: ReportesCdComponent;
  let fixture: ComponentFixture<ReportesCdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesCdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesCdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
