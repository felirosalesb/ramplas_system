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
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Ticket, CreateTicketDTO, ConfirmarLlegadaDTO, MotivoObservacionPlanta } from '../../models/models';
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
    MatSelectModule,
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
  motivoObservacion: MotivoObservacionPlanta | '' = '';
  motivosObservacionLista: MotivoObservacionPlanta[] = [
    'Cortina no cierra',
    'Paredes en mal estado',
    'Piso en mal estado (lata)',
    'Rampla sucia'
  ];

  // Para modal de edición de ticket
  mostrarModalEdicion = false;
  ticketEnEdicion: Ticket | null = null;
  nuevoMuellePlanta: number = 0;

  // Para modal de finalizar carga
  mostrarModalFinalizarCarga = false;
  ticketFinalizarCarga: Ticket | null = null;
  cantidadPallets: number | null = null;

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
      tipo_ticket: ['Retiro pallets producción', [Validators.required]],
      muelle_planta: ['', [Validators.required, Validators.min(1)]]
    });
  }

  async ngOnInit(): Promise<void> {
    // Configurar rol de usuario para filtrado de notificaciones
    this.notificationService.setRolUsuario('planta');

    await this.cargarMisTickets();
    this.iniciarRealtimeSubscriptions();

    // Suscribirse a notificaciones filtradas por rol
    this.subscriptions.push(
      this.notificationService.getNotificacionesPorRol().subscribe()
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
          payload.new.estado_actual === 'Rampla en Tránsito a Planta' &&
          payload.old.estado_actual !== 'Rampla en Tránsito a Planta') {
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
      console.log('tipo_ticket del DTO:', dto.tipo_ticket);
      console.log('tipo_ticket typeof:', typeof dto.tipo_ticket);
      console.log('tipo_ticket length:', dto.tipo_ticket?.length);

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
    this.motivoObservacion = '';
  }

  async confirmarLlegada(): Promise<void> {
    if (!this.ticketSeleccionado || !this.accionLlegada) return;

    if ((this.accionLlegada === 'aceptar_observacion' || this.accionLlegada === 'rechazar') && !this.motivoObservacion) {
      alert('Debe seleccionar un motivo');
      return;
    }

    this.cargando = true;
    try {
      const dto: ConfirmarLlegadaDTO = {
        ticket_id: this.ticketSeleccionado.id,
        accion: this.accionLlegada,
        observacion: (this.motivoObservacion || undefined) as MotivoObservacionPlanta | undefined
      };

      await this.supabaseService.confirmarLlegadaRampla(dto);

      if (this.accionLlegada === 'rechazar') {
        this.notificationService.notificarRechazo(
          this.ticketSeleccionado.id,
          this.motivoObservacion as string
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
    this.motivoObservacion = '';
  }

  async cambiarEstado(ticket: Ticket, nuevoEstado: any): Promise<void> {
    this.cargando = true;
    try {
      console.log('Cambiando estado de ticket:', ticket.id, 'a:', nuevoEstado);
      // Si es Fin de Carga, abrir modal para ingresar cantidad de pallets
      if (nuevoEstado === 'Fin de Carga') {
        this.cargando = false; // Desactivar loading para mostrar modal
        this.abrirModalFinalizarCarga(ticket);
        return;
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

  // ==================== MODAL FINALIZAR CARGA ====================

  abrirModalFinalizarCarga(ticket: Ticket): void {
    this.ticketFinalizarCarga = ticket;
    this.cantidadPallets = null;
    this.mostrarModalFinalizarCarga = true;
  }

  cerrarModalFinalizarCarga(): void {
    this.mostrarModalFinalizarCarga = false;
    this.ticketFinalizarCarga = null;
    this.cantidadPallets = null;
  }

  async confirmarFinalizarCarga(): Promise<void> {
    if (!this.ticketFinalizarCarga || !this.cantidadPallets || this.cantidadPallets <= 0) {
      this.notificationService.agregarNotificacion(
        'Debe ingresar una cantidad válida de pallets',
        this.ticketFinalizarCarga?.id || 0,
        'warning',
        'media',
        ['planta', 'admin']
      );
      return;
    }

    this.cargando = true;
    try {
      console.log('Finalizando carga con', this.cantidadPallets, 'pallets...');
      await this.supabaseService.finalizarCarga(this.ticketFinalizarCarga.id, this.cantidadPallets);
      console.log('Carga finalizada exitosamente');

      this.notificationService.agregarNotificacion(
        `Carga finalizada con ${this.cantidadPallets} pallets. Rampla en tránsito a bodega`,
        this.ticketFinalizarCarga.id,
        'success',
        'media',
        ['planta', 'cd', 'admin']
      );

      this.cerrarModalFinalizarCarga();
      await this.cargarMisTickets();
    } catch (error: any) {
      console.error('Error al finalizar carga:', error);
      this.notificationService.agregarNotificacion(
        `Error al finalizar carga: ${error?.message || 'Error desconocido'}`,
        this.ticketFinalizarCarga.id,
        'error',
        'alta',
        ['planta', 'admin']
      );
    } finally {
      this.cargando = false;
    }
  }

  // Métodos auxiliares para determinar acciones disponibles
  puedeConfirmarLlegada(ticket: Ticket): boolean {
    // Solo para tickets de RETIRO (CD envía rampla vacía a planta para cargar producción)
    return ticket.tipo_ticket === 'Retiro pallets producción' &&
      ticket.estado_actual === 'Rampla en Tránsito a Planta';
  }

  puedeIniciarCarga(ticket: Ticket): boolean {
    // Solo para tickets de RETIRO
    return ticket.tipo_ticket === 'Retiro pallets producción' &&
      ticket.estado_actual === 'Rampla en Planta';
  }

  puedeFinalizarCarga(ticket: Ticket): boolean {
    // Solo para tickets de RETIRO
    return ticket.tipo_ticket === 'Retiro pallets producción' &&
      ticket.estado_actual === 'Carga iniciada';
  }

  puedeEliminarTicket(ticket: Ticket): boolean {
    // Solo se puede eliminar si está en Pendiente Aprobación Galpón o Pendiente Asignación
    return ['Pendiente Aprobación Galpón', 'Pendiente Asignación'].includes(ticket.estado_actual);
  }

  puedeEditarMuelle(ticket: Ticket): boolean {
    // Solo se puede editar si está en Pendiente Aprobación Galpón o Pendiente Asignación
    return ['Pendiente Aprobación Galpón', 'Pendiente Asignación'].includes(ticket.estado_actual);
  }

  abrirModalEdicion(ticket: Ticket): void {
    this.ticketEnEdicion = ticket;
    this.nuevoMuellePlanta = ticket.muelle_planta;
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.ticketEnEdicion = null;
    this.nuevoMuellePlanta = 0;
  }

  async guardarEdicionTicket(): Promise<void> {
    if (!this.ticketEnEdicion || this.nuevoMuellePlanta < 1) {
      alert('Debe ingresar un número de muelle válido (mayor a 0)');
      return;
    }

    this.cargando = true;
    try {
      await this.supabaseService.actualizarMuellePlanta(
        this.ticketEnEdicion.id,
        this.nuevoMuellePlanta
      );

      this.notificationService.agregarNotificacion(
        `Solicitud #${this.ticketEnEdicion.id} actualizada exitosamente`,
        this.ticketEnEdicion.id,
        'success'
      );

      this.cerrarModalEdicion();
      await this.cargarMisTickets();
    } catch (error: any) {
      console.error('Error al actualizar ticket:', error);
      const mensaje = error?.message || 'Error al actualizar el ticket';
      this.notificationService.agregarNotificacion(
        mensaje,
        0,
        'error'
      );
      alert(`Error al actualizar: ${mensaje}`);
    } finally {
      this.cargando = false;
    }
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
    const estadosFinales = ['Libre', 'Rechazada', 'Cancelado por CD'];
    return !estadosFinales.includes(ticket.estado_actual);
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'Pendiente Aprobación Galpón': 'warn',
      'Pendiente Asignación': 'warn',
      'Rampla en Tránsito a Galpón': 'accent',
      'Rampla en Tránsito a Planta': 'accent',
      'Rampla en Tránsito': 'accent',  // Compatibilidad
      'Rampla en Planta': 'primary',
      'Carga iniciada': 'primary',
      'Fin de Carga': 'primary',
      'Cargado - Espera Chofer': 'accent',
      'Rampla en Galpón': 'accent',
      'Carga Iniciada Galpón': 'primary',
      'Rampla Cargada - Tránsito CD': 'accent',
      'Inicio Descarga': 'primary',
      'Fin Descarga': 'primary',
      'Libre': 'primary',
      'Rechazada': 'warn',
      'Cancelado por CD': 'warn'
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
  get tipoTicketInvalid(): boolean {
    const control = this.formularioSolicitud.get('tipo_ticket');
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
        panelClass: 'detalle-ticket-dialog',
        disableClose: false,
        hasBackdrop: true,
        autoFocus: false,
        closeOnNavigation: true,
        restoreFocus: false
      });

      console.log('Dialog abierto:', dialogRef);
    } catch (error) {
      console.error('Error al abrir modal:', error);
    }
  }

  // ===== MÉTODOS PARA DESCARGA DE TICKETS DEL GALPÓN =====
  // Estos métodos se usan cuando la rampla viene desde galpón con pallets vacíos

  puedeConfirmarLlegadaDesdeGalpon(ticket: Ticket): boolean {
    // La rampla está en tránsito desde galpón hacia esta planta
    return ticket.tipo_ticket === 'Solicitar Pallets vacíos' &&
      ticket.estado_actual === 'Rampla en Tránsito a Planta';
  }

  puedeIniciarDescarga(ticket: Ticket): boolean {
    // La rampla llegó a planta y está lista para descargar
    return ticket.tipo_ticket === 'Solicitar Pallets vacíos' &&
      ticket.estado_actual === 'Rampla en Planta';
  }

  puedeFinalizarDescarga(ticket: Ticket): boolean {
    // Descarga iniciada, ahora puede finalizar
    return ticket.tipo_ticket === 'Solicitar Pallets vacíos' &&
      ticket.estado_actual === 'Inicio Descarga';
  }

  async confirmarLlegadaDesdeGalpon(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      await this.supabaseService.cambiarEstadoTicket(ticket.id, 'Rampla en Planta');
      this.notificationService.agregarNotificacion(
        `Rampla llegó a planta desde galpón - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarMisTickets();
    } catch (error) {
      console.error('Error al confirmar llegada desde galpón:', error);
      this.notificationService.agregarNotificacion(
        'Error al confirmar llegada desde galpón',
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async iniciarDescargaGalpon(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      await this.supabaseService.cambiarEstadoTicket(ticket.id, 'Inicio Descarga');
      this.notificationService.agregarNotificacion(
        `Descarga iniciada - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarMisTickets();
    } catch (error) {
      console.error('Error al iniciar descarga:', error);
      this.notificationService.agregarNotificacion(
        'Error al iniciar descarga',
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async finalizarDescargaGalpon(ticket: Ticket): Promise<void> {
    this.cargando = true;
    try {
      // Usar método específico que maneja todo el proceso
      await this.supabaseService.finalizarDescargaYLiberarRampla(ticket.id);

      this.notificationService.agregarNotificacion(
        `Descarga finalizada y rampla liberada - Ticket #${ticket.id}`,
        ticket.id,
        'success'
      );
      await this.cargarMisTickets();
    } catch (error) {
      console.error('Error al finalizar descarga:', error);
      this.notificationService.agregarNotificacion(
        'Error al finalizar descarga',
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }
}