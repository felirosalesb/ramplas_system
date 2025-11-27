// src/app/components/notificaciones-panel/notificaciones-panel.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, PopupNotification } from '../../services/notification.service';

@Component({
  selector: 'app-notificaciones-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './notificaciones-panel.component.html',
  styleUrls: ['./notificaciones-panel.component.css']
})
export class NotificacionesPanelComponent implements OnInit, OnDestroy {
  notificaciones: PopupNotification[] = [];
  mostrarPanel = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a notificaciones filtradas por rol
    this.subscriptions.push(
      this.notificationService.getNotificacionesPorRol().subscribe((notificaciones: PopupNotification[]) => {
        this.notificaciones = notificaciones;
        
        // Auto-mostrar panel si hay notificación crítica o de alta prioridad no leída
        const hayUrgente = notificaciones.some((n: PopupNotification) => 
          !n.leido && (n.prioridad === 'critica' || n.prioridad === 'alta')
        );
        
        if (hayUrgente && !this.mostrarPanel) {
          this.mostrarPanel = true;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  togglePanel(): void {
    this.mostrarPanel = !this.mostrarPanel;
  }

  get notificacionesNoLeidas(): number {
    return this.notificaciones.filter(n => !n.leido).length;
  }

  marcarComoLeida(notificacion: PopupNotification): void {
    this.notificationService.marcarComoLeida(notificacion.id);
  }

  marcarTodasLeidas(): void {
    this.notificationService.marcarTodasComoLeidas();
  }

  eliminarNotificacion(notificacion: PopupNotification): void {
    this.notificationService.eliminarNotificacion(notificacion.id);
  }

  ejecutarAccion(notificacion: PopupNotification): void {
    if (notificacion.accion?.url) {
      this.router.navigate([notificacion.accion.url]);
      this.marcarComoLeida(notificacion);
      this.mostrarPanel = false;
    }
  }

  getIconoTipo(tipo: 'info' | 'warning' | 'success' | 'error'): string {
    const iconos = {
      info: 'info',
      warning: 'warning',
      success: 'check_circle',
      error: 'error'
    };
    return iconos[tipo];
  }

  getClasePrioridad(prioridad?: 'baja' | 'media' | 'alta' | 'critica'): string {
    switch (prioridad) {
      case 'critica': return 'prioridad-critica';
      case 'alta': return 'prioridad-alta';
      case 'media': return 'prioridad-media';
      case 'baja': return 'prioridad-baja';
      default: return 'prioridad-media';
    }
  }

  getTiempoTranscurrido(timestamp: Date): string {
    const ahora = new Date();
    const fecha = new Date(timestamp);
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / 60000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  }
}
