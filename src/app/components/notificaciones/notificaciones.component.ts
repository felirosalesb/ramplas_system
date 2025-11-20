import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, PopupNotification } from '../../services/notification.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    NavbarComponent
  ],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css'
})
export class NotificacionesComponent implements OnInit {
  notificaciones: PopupNotification[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.notificationService.notificaciones$.subscribe(
      notificaciones => {
        this.notificaciones = notificaciones;
      }
    );
  }

  marcarComoLeida(notificacion: PopupNotification) {
    this.notificationService.marcarComoLeida(notificacion.id);
  }

  marcarTodasComoLeidas() {
    this.notificationService.marcarTodasComoLeidas();
  }

  eliminar(notificacion: PopupNotification) {
    this.notificationService.eliminarNotificacion(notificacion.id);
  }

  irATicket(ticketId: number) {
    this.router.navigate(['/detalle-ticket', ticketId]);
  }

  getIcono(tipo: string): string {
    const iconos: any = {
      'info': 'info',
      'warning': 'warning',
      'success': 'check_circle',
      'error': 'error'
    };
    return iconos[tipo] || 'notifications';
  }

  get notificacionesNoLeidas() {
    return this.notificaciones.filter(n => !n.leido);
  }

  get notificacionesLeidas() {
    return this.notificaciones.filter(n => n.leido);
  }
}
