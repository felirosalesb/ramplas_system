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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Ticket } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';
import { DetalleTicketComponent } from '../detalle-ticket/detalle-ticket.component';

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
    MatDialogModule,
    NavbarComponent
  ],
  templateUrl: './dashboard-galpon.component.html',
  styleUrls: ['./dashboard-galpon.component.css']
})
export class DashboardGalponComponent implements OnInit, OnDestroy {
  ticketsSolicitudes: Ticket[] = []; // Nuevo: Solicitudes pendientes de aprobación
  ticketsEnvio: Ticket[] = [];
  ticketsPendientes: Ticket[] = [];
  cargando = false;
  private subscriptions: Subscription[] = [];
  private realtimeChannel: any;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private dialog: MatDialog
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
      
      // PASO 1: Solicitudes de planta esperando aprobación de galpón
      this.ticketsSolicitudes = ticketsEnvio.filter(t => 
        t.estado_actual === 'Pendiente Aprobación Galpón'
      );
      
      // PASO 2: Ramplas que CD ya asignó y están en tránsito hacia galpón
      // O que ya llegaron al galpón esperando confirmación
      // IMPORTANTE: Solo mostrar si están llegando POR PRIMERA VEZ al galpón
      // (excluir las que ya se cargaron y van hacia planta)
      this.ticketsPendientes = await this.filtrarTicketsPendientesGalpon(ticketsEnvio);

      // PASO 3: Tickets en proceso de carga en galpón con pallets vacíos
      this.ticketsEnvio = ticketsEnvio.filter(t => 
        t.estado_actual === 'Carga Iniciada Galpón'
      );

      console.log('Solicitudes pendientes:', this.ticketsSolicitudes.length);
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

  async aprobarSolicitud(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      await this.supabaseService.aprobarSolicitudGalpon(ticket.id);
      this.notificationService.agregarNotificacion(
        `Solicitud aprobada y enviada a CD para asignación - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarTickets();
    } catch (error: any) {
      console.error('Error al aprobar solicitud:', error);
      this.notificationService.agregarNotificacion(
        `Error al aprobar solicitud: ${error?.message || 'Error desconocido'}`,
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async confirmarLlegadaGalpon(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      // Confirmar que la rampla llegó al galpón
      await this.supabaseService.cambiarEstadoTicket(ticket.id, 'Rampla en Galpón');
      this.notificationService.agregarNotificacion(
        `Rampla confirmada en galpón - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarTickets();
    } catch (error: any) {
      console.error('Error al confirmar llegada:', error);
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
    this.dialog.open(DetalleTicketComponent, {
      data: { ticketId: ticket.id },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'detalle-ticket-dialog',
      disableClose: false,
      hasBackdrop: true,
      autoFocus: false,
      closeOnNavigation: true,
      restoreFocus: false
    });
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
    // Solo puede confirmar llegada si la rampla está en tránsito hacia galpón
    return ticket.estado_actual === 'Rampla en Tránsito';
  }

  puedeIniciarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla en Galpón';
  }

  puedeFinalizarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Carga Iniciada Galpón';
  }

  /**
   * Filtra tickets que están llegando al galpón POR PRIMERA VEZ
   * (excluye los que ya fueron cargados y van hacia planta)
   */
  private async filtrarTicketsPendientesGalpon(ticketsEnvio: Ticket[]): Promise<Ticket[]> {
    const candidatos = ticketsEnvio.filter(t => 
      ['Rampla en Tránsito', 'Rampla en Galpón'].includes(t.estado_actual)
    );

    // Para cada candidato, verificar si ya pasó por 'Carga Iniciada Galpón'
    const resultados = await Promise.all(
      candidatos.map(async (ticket) => {
        try {
          const registros = await this.supabaseService['supabase']
            .from('registros_tiempo')
            .select('estado_registrado')
            .eq('ticket_id', ticket.id)
            .eq('estado_registrado', 'Carga Iniciada Galpón');

          // Si ya tiene registro de carga iniciada, significa que va hacia planta
          // (no debe mostrarse aquí)
          if (registros.data && registros.data.length > 0) {
            return null; // Excluir este ticket
          }
          return ticket; // Incluir este ticket
        } catch (error) {
          console.error('Error al verificar historial:', error);
          return ticket; // En caso de error, incluir por seguridad
        }
      })
    );

    // Filtrar nulls y retornar
    return resultados.filter((t): t is Ticket => t !== null);
  }
}
