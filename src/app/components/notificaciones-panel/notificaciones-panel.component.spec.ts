// src/app/components/notificaciones-panel/notificaciones-panel.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesPanelComponent } from './notificaciones-panel.component';

describe('NotificacionesPanelComponent', () => {
  let component: NotificacionesPanelComponent;
  let fixture: ComponentFixture<NotificacionesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionesPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificacionesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
