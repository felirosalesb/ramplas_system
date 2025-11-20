// src/app/components/monitor-ramplas/monitor-ramplas.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../services/supabase.service';
import { Rampla, Ticket } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';

interface RamplaConTicket extends Rampla {
  ticket?: Ticket;
  tiempoEnEstado?: string;
}

@Component({
  selector: 'app-monitor-ramplas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatTooltipModule,
    NavbarComponent
  ],
  templateUrl: './monitor-ramplas.component.html',
  styleUrls: ['./monitor-ramplas.component.css']
})
export class MonitorRamplasComponent implements OnInit, OnDestroy {
  ramplas: RamplaConTicket[] = [];
  cargando = false;
  ultimaActualizacion: Date = new Date();

  private subscriptions: Subscription[] = [];
  private realtimeChannel: any;
  private actualizacionTimer: Subscription | null = null;

  // Estadísticas
  get ramplasLibres(): number {
    return this.ramplas.filter(r => r.estado === 'Libre').length;
  }

  get ramplasEnServicio(): number {
    return this.ramplas.filter(r => r.estado === 'En Servicio').length;
  }

  get porcentajeUtilizacion(): number {
    if (this.ramplas.length === 0) return 0;
    return Math.round((this.ramplasEnServicio / this.ramplas.length) * 100);
  }

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit(): Promise<void> {
    await this.cargarRamplas();
    this.iniciarRealtimeSubscriptions();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
    if (this.actualizacionTimer) {
      this.actualizacionTimer.unsubscribe();
    }
  }

  async cargarRamplas(): Promise<void> {
    this.cargando = true;
    try {
      const ramplasData = await this.supabaseService.getAllRamplas();

      // Enriquecer con información del ticket actual
      this.ramplas = await Promise.all(
        ramplasData.map(async (rampla) => {
          if (rampla.ticket_actual_id) {
            try {
              const tickets = await this.supabaseService.getTicketsActivos();
              const ticket = tickets.find(t => t.id === rampla.ticket_actual_id);

              return {
                ...rampla,
                ticket,
                tiempoEnEstado: ticket ? this.calcularTiempoEnEstado(ticket) : undefined
              };
            } catch (error) {
              console.error('Error al cargar ticket:', error);
              return rampla;
            }
          }
          return rampla;
        })
      );

      this.ultimaActualizacion = new Date();
    } catch (error) {
      console.error('Error al cargar ramplas:', error);
    } finally {
      this.cargando = false;
    }
  }

  iniciarRealtimeSubscriptions(): void {
    this.realtimeChannel = this.supabaseService.subscribeToRamplas(async () => {
      await this.cargarRamplas();
    });

    this.supabaseService.subscribeToTickets(async () => {
      await this.cargarRamplas();
    });
  }

  iniciarActualizacionAutomatica(): void {
    // Actualizar cada 30 segundos
    this.actualizacionTimer = interval(30000).subscribe(() => {
      this.cargarRamplas();
    });
  }

  calcularTiempoEnEstado(ticket: Ticket): string {
    const ahora = new Date();
    const fechaCreacion = new Date(ticket.fecha_creacion);
    const diffMs = ahora.getTime() - fechaCreacion.getTime();

    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  }

  getEstadoColorClass(estado: string): string {
    return estado === 'Libre' ? 'estado-libre' : 'estado-servicio';
  }

  getEstadoTicketColorClass(estado: string | undefined): string {
    if (!estado) return '';

    const clasesEstado: { [key: string]: string } = {
      'Pendiente Asignación': 'estado-pendiente',
      'Rampla Asignada': 'estado-asignada',
      'Rampla en Planta': 'estado-planta',
      'Inicio de Carga': 'estado-cargando',
      'Fin de Carga': 'estado-cargado',
      'Cargado - Espera Chofer': 'estado-transito',
      'Asignada a Muelle CD': 'estado-muelle',
      'Inicio Descarga': 'estado-descargando',
      'Fin Descarga': 'estado-descargado'
    };

    return clasesEstado[estado] || '';
  }

  obtenerIconoEstado(estado: string): string {
    const iconos: { [key: string]: string } = {
      'Libre': 'check_circle',
      'En Servicio': 'local_shipping',
      'Pendiente Asignación': 'pending',
      'Rampla Asignada': 'assignment_turned_in',
      'Rampla en Planta': 'factory',
      'Inicio de Carga': 'upload',
      'Fin de Carga': 'inventory',
      'Cargado - Espera Chofer': 'hourglass_empty',
      'Asignada a Muelle CD': 'garage',
      'Inicio Descarga': 'download',
      'Fin Descarga': 'done_all'
    };

    return iconos[estado] || 'help';
  }

  obtenerDetalleRampla(rampla: RamplaConTicket): string {
    if (rampla.estado === 'Libre') {
      return 'Disponible para asignación';
    }

    if (rampla.ticket) {
      return `Ticket #${rampla.ticket.id} - ${rampla.ticket.estado_actual}`;
    }

    return 'En servicio';
  }

  async refrescar(): Promise<void> {
    await this.cargarRamplas();
  }

  // Métodos para ordenamiento
  ordenarPorId(): void {
    this.ramplas.sort((a, b) => a.id - b.id);
  }

  ordenarPorEstado(): void {
    this.ramplas.sort((a, b) => {
      if (a.estado === b.estado) return a.id - b.id;
      return a.estado === 'Libre' ? -1 : 1;
    });
  }

  // Vista de lista vs grid
  vistaActual: 'grid' | 'lista' = 'grid';

  cambiarVista(vista: 'grid' | 'lista'): void {
    this.vistaActual = vista;
  }
}