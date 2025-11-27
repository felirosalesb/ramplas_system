// src/app/components/dashboard-galpon/dashboard-galpon.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Ticket } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard-galpon',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    NavbarComponent
  ],
  templateUrl: './dashboard-galpon.component.html',
  styleUrls: ['./dashboard-galpon.component.css']
})
export class DashboardGalponComponent implements OnInit, OnDestroy {
  ticketsEnvio: Ticket[] = [];
  ticketsPendientes: Ticket[] = [];
  cargando = false;
  private subscriptions: Subscription[] = [];
  private realtimeChannel: any;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) { }

  async ngOnInit(): Promise<void> {
    // Configurar rol de usuario para filtrado de notificaciones
    this.notificationService.setRolUsuario('galpon');
    
    await this.cargarTickets();
    this.iniciarRealtimeSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  async cargarTickets(): Promise<void> {
    this.cargando = true;
    try {
      const todosTickets = await this.supabaseService.getTicketsActivos();
      
      // Filtrar solo tickets de tipo 'Solicitar Pallets vacíos'
      const ticketsEnvio = todosTickets.filter(t => t.tipo_ticket === 'Solicitar Pallets vacíos');
      
      // Tickets que están en tránsito a galpón o ya en galpón
      this.ticketsPendientes = ticketsEnvio.filter(t => 
        ['Rampla Asignada', 'Rampla en Tránsito'].includes(t.estado_actual)
      );

      // Tickets en proceso de carga en galpón
      this.ticketsEnvio = ticketsEnvio.filter(t => 
        ['Rampla en Galpón', 'Carga Iniciada Galpón'].includes(t.estado_actual)
      );

      console.log('Tickets pendientes llegada:', this.ticketsPendientes.length);
      console.log('Tickets en carga:', this.ticketsEnvio.length);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      this.notificationService.agregarNotificacion(
        'Error al cargar tickets',
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  iniciarRealtimeSubscriptions(): void {
    this.realtimeChannel = this.supabaseService.subscribeToTickets(async (payload) => {
      console.log('Cambio en tickets:', payload);
      
      // Recargar si el ticket es de tipo Solicitar Pallets vacíos
      if (payload.new?.tipo_ticket === 'Solicitar Pallets vacíos' || payload.old?.tipo_ticket === 'Solicitar Pallets vacíos') {
        await this.cargarTickets();
      }
    });
  }

  async confirmarLlegadaGalpon(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      await this.supabaseService.cambiarEstadoTicket(ticket.id, 'Rampla en Galpón');
      this.notificationService.agregarNotificacion(
        `Rampla confirmada en galpón - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarTickets();
    } catch (error: any) {
      console.error('Error al confirmar llegada:', error);
      console.error('Error mensaje:', error?.message);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      this.notificationService.agregarNotificacion(
        `Error al confirmar llegada: ${error?.message || 'Error desconocido'}`,
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async iniciarCargaGalpon(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      await this.supabaseService.cambiarEstadoTicket(ticket.id, 'Carga Iniciada Galpón');
      this.notificationService.agregarNotificacion(
        `Carga iniciada - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarTickets();
    } catch (error: any) {
      console.error('Error al iniciar carga:', error);
      console.error('Error mensaje:', error?.message);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      this.notificationService.agregarNotificacion(
        `Error al iniciar carga: ${error?.message || 'Error desconocido'}`,
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async finalizarCargaGalpon(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      await this.supabaseService.finalizarCargaGalpon(ticket.id);
      this.notificationService.agregarNotificacion(
        `Carga finalizada. Rampla en tránsito a CD - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarTickets();
    } catch (error: any) {
      console.error('Error al finalizar carga:', error);
      console.error('Error mensaje:', error?.message);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      this.notificationService.agregarNotificacion(
        `Error al finalizar carga: ${error?.message || 'Error desconocido'}`,
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  verDetalleTicket(ticket: Ticket): void {
    this.router.navigate(['/detalle-ticket', ticket.id]);
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'Rampla Asignada': 'accent',
      'Rampla en Tránsito': 'accent',
      'Rampla en Galpón': 'primary',
      'Carga Iniciada Galpón': 'primary',
      'Rampla Cargada - Tránsito CD': 'warn'
    };
    return colores[estado] || 'primary';
  }

  puedeConfirmarLlegada(ticket: Ticket): boolean {
    return ['Rampla Asignada', 'Rampla en Tránsito'].includes(ticket.estado_actual);
  }

  puedeIniciarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla en Galpón';
  }

  puedeFinalizarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Carga Iniciada Galpón';
  }
}
