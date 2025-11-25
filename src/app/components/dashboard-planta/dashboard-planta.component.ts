// src/app/components/dashboard-planta/dashboard-planta.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Ticket, CreateTicketDTO, ConfirmarLlegadaDTO } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';
import { DetalleTicketComponent } from '../detalle-ticket/detalle-ticket.component';

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
    MatDialogModule,
    MatTooltipModule,
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
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.formularioSolicitud = this.fb.group({
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

      // Obtener nombre_planta del usuario actual
      const userData = await this.supabaseService['supabase']
        .from('usuarios')
        .select('nombre_planta')
        .eq('id', user.id)
        .single();

      const nombrePlanta = userData.data?.nombre_planta;
      console.log('Usuario actual:', user.id, '- Planta:', nombrePlanta);

      const todosTickets = await this.supabaseService.getTicketsActivos();
      console.log('Tickets obtenidos:', todosTickets);

      // Filtrar tickets por nombre_planta del usuario
      // Si el usuario no tiene nombre_planta, usar el filtro antiguo (solo por usuario)
      if (nombrePlanta) {
        this.misTickets = todosTickets.filter(t => t.nombre_planta === nombrePlanta);
        console.log(`Tickets filtrados por planta "${nombrePlanta}":`, this.misTickets);
      } else {
        // Fallback: filtrar solo por usuario (para compatibilidad con datos antiguos)
        this.misTickets = todosTickets.filter(t => t.planta_user_id === user.id);
        console.log('Tickets filtrados por usuario (sin nombre_planta):', this.misTickets);
      }
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
          payload.new.estado_actual === 'Rampla en Tránsito' &&
          payload.old.estado_actual !== 'Rampla en Tránsito') {
          this.notificationService.agregarNotificacion(
            `Rampla asignada a tu solicitud #${payload.new.id}`,
            payload.new.id,
            'success'
          );
        }
      }
    });

    // SISTEMA DE POLLING: Actualización automática cada 30 segundos como backup
    setInterval(() => {
      console.log('🔄 Auto-actualización de mis tickets (polling)');
      this.cargarMisTickets();
    }, 30 * 1000); // 30 segundos
  }

  async crearSolicitud(): Promise<void> {
    console.log('=== CREAR SOLICITUD ===');
    console.log('Formulario válido:', this.formularioSolicitud.valid);
    console.log('Valores del formulario:', this.formularioSolicitud.value);
    console.log('Estado de controles:', {
      muelle_planta: this.formularioSolicitud.get('muelle_planta')?.value
    });

    if (this.formularioSolicitud.invalid) {
      console.log('Formulario inválido');
      Object.keys(this.formularioSolicitud.controls).forEach(key => {
        const control = this.formularioSolicitud.get(key);
        console.log(`Control ${key}:`, {
          value: control?.value,
          valid: control?.valid,
          errors: control?.errors
        });
        control?.markAsTouched();
      });
      return;
    }

    this.cargando = true;
    try {
      const dto: CreateTicketDTO = this.formularioSolicitud.value;
      console.log('DTO a enviar:', dto);

      const nuevoTicket = await this.supabaseService.crearTicketPlanta(dto);
      console.log('Ticket creado:', nuevoTicket);

      this.notificationService.agregarNotificacion(
        `Solicitud #${nuevoTicket.id} creada exitosamente`,
        nuevoTicket.id,
        'success'
      );

      this.formularioSolicitud.reset();
      this.mostrarFormulario = false;
      await this.cargarMisTickets();
    } catch (error: any) {
      console.error('Error al crear solicitud:', error);
      console.error('Mensaje de error:', error?.message);
      console.error('Error completo:', JSON.stringify(error, null, 2));

      const mensaje = error?.message || 'Error al crear la solicitud';
      this.notificationService.agregarNotificacion(
        mensaje,
        0,
        'error'
      );
      alert(`Error al crear solicitud: ${mensaje}`);
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
      console.log('Cambiando estado de ticket:', ticket.id, 'a:', nuevoEstado);
      // Si es Fin de Carga, usar método específico que pasa automáticamente a "Cargado - Espera Chofer"
      if (nuevoEstado === 'Fin de Carga') {
        console.log('Llamando a finalizarCarga...');
        await this.supabaseService.finalizarCarga(ticket.id);
        console.log('finalizarCarga completado exitosamente');
        this.notificationService.agregarNotificacion(
          'Carga finalizada. Rampla en tránsito a bodega',
          ticket.id,
          'success'
        );
      } else {
        await this.supabaseService.cambiarEstadoTicket(ticket.id, nuevoEstado);
      }

      await this.cargarMisTickets();
    } catch (error: any) {
      console.error('Error completo al cambiar estado:', error);
      console.error('Mensaje de error:', error?.message);
      console.error('Detalles del error:', error?.details);
      this.notificationService.agregarNotificacion(
        `Error al cambiar estado: ${error?.message || 'Error desconocido'}`,
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  // Métodos auxiliares para determinar acciones disponibles
  puedeConfirmarLlegada(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla en Tránsito';
  }

  puedeIniciarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla en Planta';
  }

  puedeFinalizarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Carga iniciada';
  }

  puedeEliminarTicket(ticket: Ticket): boolean {
    // Solo se puede eliminar si está en Pendiente Asignación
    return ticket.estado_actual === 'Pendiente Asignación';
  }

  confirmarEliminarTicket(ticket: Ticket): void {
    const confirmacion = confirm(
      `¿Está seguro que desea eliminar la solicitud #${ticket.id}?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmacion) {
      this.eliminarTicket(ticket);
    }
  }

  async eliminarTicket(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      console.log('Eliminando ticket:', ticket.id);
      await this.supabaseService.eliminarTicket(ticket.id);
      console.log('Ticket eliminado exitosamente');

      this.notificationService.agregarNotificacion(
        `Solicitud #${ticket.id} eliminada correctamente`,
        ticket.id,
        'success'
      );

      // Recargar tickets
      await this.cargarMisTickets();
    } catch (error: any) {
      console.error('Error al eliminar ticket:', error);
      const mensaje = error?.message || 'Error al eliminar la solicitud';
      this.notificationService.agregarNotificacion(
        mensaje,
        ticket.id,
        'error'
      );
      alert(`Error: ${mensaje}`);
    } finally {
      this.cargando = false;
    }
  }

  esTicketActivo(ticket: Ticket): boolean {
    const estadosFinales = ['Libre', 'Rechazada'];
    return !estadosFinales.includes(ticket.estado_actual);
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'Pendiente Asignación': 'warn',
      'Rampla en Tránsito': 'accent',
      'Rampla en Planta': 'primary',
      'Carga iniciada': 'primary',
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

  verDetalleTicket(ticket: Ticket): void {
    console.log('=== ABRIR MODAL DETALLE ===');
    console.log('Ticket:', ticket);
    console.log('Dialog service:', this.dialog);

    try {
      const dialogRef = this.dialog.open(DetalleTicketComponent, {
        data: { ticketId: ticket.id },
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'detalle-ticket-dialog'
      });

      console.log('Dialog abierto:', dialogRef);
    } catch (error) {
      console.error('Error al abrir modal:', error);
    }
  }
}