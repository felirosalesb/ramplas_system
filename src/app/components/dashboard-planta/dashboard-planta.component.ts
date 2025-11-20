// src/app/components/dashboard-planta/dashboard-planta.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Ticket, CreateTicketDTO, ConfirmarLlegadaDTO } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard-planta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatRadioModule,
    NavbarComponent
  ],
  templateUrl: './dashboard-planta.component.html',
  styleUrls: ['./dashboard-planta.component.css']
})
export class DashboardPlantaComponent implements OnInit, OnDestroy {
  formularioSolicitud: FormGroup;
  misTickets: Ticket[] = [];
  ticketSeleccionado: Ticket | null = null;

  // Para modal de confirmación de llegada
  accionLlegada: 'aceptar' | 'aceptar_observacion' | 'rechazar' | null = null;
  observacionLlegada: string = '';

  cargando = false;
  mostrarFormulario = false;
  private subscriptions: Subscription[] = [];
  private realtimeChannel: any;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {
    this.formularioSolicitud = this.fb.group({
      cantidad_pallet: ['', [Validators.required, Validators.min(1), Validators.max(999)]],
      muelle_planta: ['', [Validators.required, Validators.min(1)]]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarMisTickets();
    this.iniciarRealtimeSubscriptions();

    // Suscribirse a notificaciones
    this.subscriptions.push(
      this.notificationService.notificaciones$.subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  async cargarMisTickets(): Promise<void> {
    this.cargando = true;
    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        console.error('Usuario no autenticado');
        throw new Error('Usuario no autenticado');
      }

      console.log('Usuario actual:', user.id);
      const todosTickets = await this.supabaseService.getTicketsActivos();
      console.log('Tickets obtenidos:', todosTickets);
      this.misTickets = todosTickets.filter(t => t.planta_user_id === user.id);
      console.log('Mis tickets filtrados:', this.misTickets);
    } catch (error: any) {
      console.error('Error completo al cargar tickets:', error);
      console.error('Mensaje de error:', error.message);
      console.error('Detalles del error:', error.details || error.hint || 'Sin detalles adicionales');
      this.notificationService.agregarNotificacion(
        `Error al cargar datos: ${error.message || 'Error desconocido'}`,
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  iniciarRealtimeSubscriptions(): void {
    const user = this.supabaseService.getCurrentUser();
    if (!user) return;

    this.realtimeChannel = this.supabaseService.subscribeToTickets(async (payload) => {
      console.log('Cambio en tickets:', payload);

      // Solo recargar si el cambio afecta a mis tickets
      if (payload.new?.planta_user_id === user.id || payload.old?.planta_user_id === user.id) {
        await this.cargarMisTickets();

        // Notificar si una rampla fue asignada a mi ticket
        if (payload.eventType === 'UPDATE' &&
          payload.new.estado_actual === 'Rampla Asignada' &&
          payload.old.estado_actual !== 'Rampla Asignada') {
          this.notificationService.agregarNotificacion(
            `Rampla asignada a tu solicitud #${payload.new.id}`,
            payload.new.id,
            'success'
          );
        }
      }
    });
  }

  async crearSolicitud(): Promise<void> {
    if (this.formularioSolicitud.invalid) {
      Object.keys(this.formularioSolicitud.controls).forEach(key => {
        this.formularioSolicitud.get(key)?.markAsTouched();
      });
      return;
    }

    this.cargando = true;
    try {
      const dto: CreateTicketDTO = this.formularioSolicitud.value;
      const nuevoTicket = await this.supabaseService.crearTicketPlanta(dto);

      this.notificationService.agregarNotificacion(
        `Solicitud #${nuevoTicket.id} creada exitosamente`,
        nuevoTicket.id,
        'success'
      );

      this.formularioSolicitud.reset();
      this.mostrarFormulario = false;
      await this.cargarMisTickets();
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      this.notificationService.agregarNotificacion(
        'Error al crear la solicitud',
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  abrirModalConfirmacionLlegada(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.accionLlegada = null;
    this.observacionLlegada = '';
  }

  async confirmarLlegada(): Promise<void> {
    if (!this.ticketSeleccionado || !this.accionLlegada) return;

    if (this.accionLlegada === 'aceptar_observacion' && !this.observacionLlegada.trim()) {
      alert('Debe ingresar una observación');
      return;
    }

    this.cargando = true;
    try {
      const dto: ConfirmarLlegadaDTO = {
        ticket_id: this.ticketSeleccionado.id,
        accion: this.accionLlegada,
        observacion: this.observacionLlegada.trim() || undefined
      };

      await this.supabaseService.confirmarLlegadaRampla(dto);

      if (this.accionLlegada === 'rechazar') {
        this.notificationService.notificarRechazo(
          this.ticketSeleccionado.id,
          this.observacionLlegada
        );
      } else {
        this.notificationService.agregarNotificacion(
          'Rampla confirmada en planta',
          this.ticketSeleccionado.id,
          'success'
        );
      }

      await this.cargarMisTickets();
      this.cerrarModalConfirmacion();
    } catch (error) {
      console.error('Error al confirmar llegada:', error);
      this.notificationService.agregarNotificacion(
        'Error al confirmar llegada de rampla',
        this.ticketSeleccionado.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  cerrarModalConfirmacion(): void {
    this.ticketSeleccionado = null;
    this.accionLlegada = null;
    this.observacionLlegada = '';
  }

  async cambiarEstado(ticket: Ticket, nuevoEstado: any): Promise<void> {
    this.cargando = true;
    try {
      // Si es Fin de Carga, usar método específico que pasa automáticamente a "Cargado - Espera Chofer"
      if (nuevoEstado === 'Fin de Carga') {
        await this.supabaseService.finalizarCarga(ticket.id);
        this.notificationService.agregarNotificacion(
          'Carga finalizada. Rampla en tránsito a bodega',
          ticket.id,
          'success'
        );
      } else {
        await this.supabaseService.cambiarEstadoTicket(ticket.id, nuevoEstado);
      }

      await this.cargarMisTickets();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.notificationService.agregarNotificacion(
        'Error al cambiar estado',
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  // Métodos auxiliares para determinar acciones disponibles
  puedeConfirmarLlegada(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla Asignada';
  }

  puedeIniciarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla en Planta';
  }

  puedeFinalizarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Inicio de Carga';
  }

  esTicketActivo(ticket: Ticket): boolean {
    const estadosFinales = ['Libre', 'Rechazada'];
    return !estadosFinales.includes(ticket.estado_actual);
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'Pendiente Asignación': 'warn',
      'Rampla Asignada': 'accent',
      'Rampla en Planta': 'primary',
      'Inicio de Carga': 'primary',
      'Fin de Carga': 'primary',
      'Cargado - Espera Chofer': 'accent',
      'Rechazada': 'warn'
    };
    return colores[estado] || 'primary';
  }

  get ticketsActivos(): Ticket[] {
    return this.misTickets.filter(t => this.esTicketActivo(t));
  }

  get ticketsHistorico(): Ticket[] {
    return this.misTickets.filter(t => !this.esTicketActivo(t));
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.formularioSolicitud.reset();
    }
  }

  // Validaciones del formulario
  get cantidadPalletInvalid(): boolean {
    const control = this.formularioSolicitud.get('cantidad_pallet');
    return !!(control && control.invalid && control.touched);
  }

  get muellePlantaInvalid(): boolean {
    const control = this.formularioSolicitud.get('muelle_planta');
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(campo: string): string {
    const control = this.formularioSolicitud.get(campo);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control.hasError('min')) {
      return `El valor mínimo es ${control.errors?.['min'].min}`;
    }
    if (control.hasError('max')) {
      return `El valor máximo es ${control.errors?.['max'].max}`;
    }
    return '';
  }

  async verDetalleTicket(ticket: Ticket): Promise<void> {
    try {
      const registros = await this.supabaseService.getRegistrosTiempo(ticket.id);
      console.log('Historial del ticket:', registros);
      // Aquí podrías abrir un modal con el detalle completo
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    }
  }
}