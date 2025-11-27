import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Ticket, Rampla, Muelle } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';
import { DetalleTicketComponent } from '../detalle-ticket/detalle-ticket.component';

@Component({
  selector: 'app-dashboard-cd',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatBadgeModule,
    MatTabsModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    NavbarComponent
  ],
  templateUrl: './dashboard-cd.component.html',
  styleUrls: ['./dashboard-cd.component.css']
})
export class DashboardCdComponent implements OnInit, OnDestroy {
  // Pestaña 1: Pendientes de Asignar Rampla
  ticketsPendientes: Ticket[] = [];

  // Pestaña 2: Ramplas en Planta
  ticketsEnPlanta: Ticket[] = [];

  // Pestaña 3: En Tránsito (desde Cargado-Espera Chofer hasta Libre)
  ticketsEnTransito: Ticket[] = [];

  ticketsActivos: Ticket[] = [];
  ramplas: Rampla[] = [];
  ramplasLibres: Rampla[] = [];
  muelles: Muelle[] = [];
  muellesLibres: Muelle[] = [];

  ticketSeleccionado: Ticket | null = null;
  ramplaSeleccionada: number | null = null;
  muelleSeleccionado: number | null = null;
  muelleCD: number | null = null;
  modalActivo: 'rampla' | 'muelle' | 'cancelar' | null = null;

  // Modal de cancelación
  motivosCancelacion = [
    'Muelle obstruido',
    'Otro'
  ];
  motivoCancelacionSeleccionado: string = '';
  otraRazonCancelacion: string = '';

  cargando = false;
  private subscriptions: Subscription[] = [];
  private realtimeChannel: any;

  // Filtros
  filtroEstado: string = 'todos';
  filtroBusqueda: string = '';
  filtroBusquedaTransito: string = '';

  // Contadores por estado de ramplas
  contadoresEstadoRamplas: { [estado: string]: number } = {};

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) { }

  async ngOnInit(): Promise<void> {
    // Configurar rol de usuario para filtrado de notificaciones
    this.notificationService.setRolUsuario('cd');
    
    await this.cargarDatos();
    this.iniciarRealtimeSubscriptions();
    this.iniciarMonitoreoAlertas();

    // Suscribirse a notificaciones filtradas por rol
    this.subscriptions.push(
      this.notificationService.getNotificacionesPorRol().subscribe((notificaciones: any) => {
        const noLeidas = this.notificationService.getNotificacionesNoLeidas();
        this.actualizarBadgeNotificaciones(noLeidas);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    try {
      console.log('Cargando datos del dashboard CD...');
      const [todosTickets, todasRamplas, ramplasLibres, todosMuelles, muellesLibres] = await Promise.all([
        this.supabaseService.getTicketsActivos(),
        this.supabaseService.getAllRamplas(),
        this.supabaseService.getRamplasLibres(),
        this.supabaseService.getMuelles(),
        this.supabaseService.getMuellesLibres()
      ]);

      // Separar tickets por estado
      // Pestaña 1: Solo "Pendiente Asignación"
      this.ticketsPendientes = todosTickets
        .filter(t => t.estado_actual === 'Pendiente Asignación')
        .sort((a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());

      // Pestaña 2: Ramplas en Planta (desde "Rampla en Tránsito" hasta "Fin de Carga")
      this.ticketsEnPlanta = todosTickets
        .filter(t => ['Rampla en Tránsito', 'Rampla en Planta', 'Carga iniciada', 'Fin de Carga'].includes(t.estado_actual))
        .sort((a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());

      // Pestaña 3: En Tránsito (desde "Rampla cargada" hasta "Inicio Descarga")
      this.ticketsEnTransito = todosTickets
        .filter(t => ['Cargado - Espera Chofer', 'Asignada a Muelle CD', 'Inicio Descarga'].includes(t.estado_actual))
        .sort((a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());

      this.ticketsActivos = todosTickets;
      this.ramplas = todasRamplas;
      this.ramplasLibres = ramplasLibres;
      this.muelles = todosMuelles;
      this.muellesLibres = muellesLibres;

      // Calcular contadores por estado de ramplas
      this.calcularContadoresEstadoRamplas();

      console.log('Tickets pendientes asignación:', this.ticketsPendientes.length);
      console.log('Tickets en planta:', this.ticketsEnPlanta.length);
      console.log('Tickets en tránsito:', this.ticketsEnTransito.length);
      console.log('Ramplas libres:', this.ramplasLibres.length);
      console.log('Muelles libres:', this.muellesLibres.length);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details || error.hint);
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
    // Suscribirse a cambios en tickets
    this.realtimeChannel = this.supabaseService.subscribeToTickets(async (payload) => {
      console.log('Cambio en tickets:', payload);
      await this.cargarDatos();

      // Si es un nuevo ticket pendiente, notificar
      if (payload.eventType === 'INSERT' && payload.new.estado_actual === 'Pendiente Asignación') {
        this.notificationService.notificarNuevaSolicitud(
          payload.new.id,
          payload.new.muelle_planta
        );
      }
    });

    // Suscribirse a cambios en ramplas
    this.supabaseService.subscribeToRamplas(async () => {
      await this.cargarDatos();
    });
  }

  // Monitoreo de alertas de 2 horas integrado
  private iniciarMonitoreoAlertas(): void {
    // Revisión cada 5 minutos
    setInterval(() => {
      this.revisarAlertasPendientes();
    }, 5 * 60 * 1000);

    // Revisión inicial
    this.revisarAlertasPendientes();

    // SISTEMA DE POLLING: Actualización automática cada 30 segundos como backup
    // Esto asegura que los datos se actualicen incluso si Realtime falla
    setInterval(() => {
      console.log('🔄 Auto-actualización de datos (polling)');
      this.cargarDatos();
    }, 30 * 1000); // 30 segundos
  }

  private async revisarAlertasPendientes(): Promise<void> {
    try {
      const ahora = new Date();

      // Alertas para tickets pendientes (2 horas)
      for (const ticket of this.ticketsPendientes) {
        if (!ticket.fecha_alerta_cd) continue;

        const fechaAlerta = new Date(ticket.fecha_alerta_cd);

        if (ahora >= fechaAlerta) {
          this.notificationService.notificarAlertaPendiente(ticket.id);

          // Extender alerta 2 horas más
          const nuevaFechaAlerta = new Date();
          nuevaFechaAlerta.setHours(nuevaFechaAlerta.getHours() + 2);

          // Actualizar en base de datos (acceso directo)
          await this.supabaseService['supabase']
            .from('tickets')
            .update({ fecha_alerta_cd: nuevaFechaAlerta.toISOString() })
            .eq('id', ticket.id);
        }
      }

      // Alertas para ramplas asignadas por más de 15 minutos
      await this.revisarAlertasRamplasAsignadas();
    } catch (error) {
      console.error('Error al revisar alertas:', error);
    }
  }

  private async revisarAlertasRamplasAsignadas(): Promise<void> {
    try {
      const ahora = new Date();
      const limiteTiempo15min = 15 * 60 * 1000; // 15 minutos en milisegundos
      const limiteTiempo30min = 30 * 60 * 1000; // 30 minutos en milisegundos

      // Alerta 1: Ramplas asignadas hace más de 15 minutos
      for (const ticket of this.ticketsEnPlanta) {
        if (ticket.estado_actual !== 'Rampla en Tránsito') continue;

        const { data: tiempos } = await this.supabaseService['supabase']
          .from('registros_tiempo')
          .select('fecha_hora')
          .eq('ticket_id', ticket.id)
          .eq('estado', 'Rampla en Tránsito')
          .order('fecha_hora', { ascending: false })
          .limit(1);

        if (tiempos && tiempos.length > 0) {
          const fechaAsignacion = new Date(tiempos[0].fecha_hora);
          const tiempoTranscurrido = ahora.getTime() - fechaAsignacion.getTime();

          if (tiempoTranscurrido > limiteTiempo15min) {
            this.notificationService.agregarNotificacion(
              `⚠️ Rampla asignada hace más de 15 minutos - Ticket #${ticket.id}`,
              ticket.id,
              'warning'
            );
          }
        }
      }

      // Alerta 2: Ramplas cargadas hace más de 30 minutos (Cargado - Espera Chofer)
      for (const ticket of this.ticketsEnTransito) {
        if (ticket.estado_actual !== 'Cargado - Espera Chofer') continue;

        const { data: tiempos } = await this.supabaseService['supabase']
          .from('registros_tiempo')
          .select('fecha_hora')
          .eq('ticket_id', ticket.id)
          .eq('estado', 'Cargado - Espera Chofer')
          .order('fecha_hora', { ascending: false })
          .limit(1);

        if (tiempos && tiempos.length > 0) {
          const fechaCarga = new Date(tiempos[0].fecha_hora);
          const tiempoTranscurrido = ahora.getTime() - fechaCarga.getTime();

          if (tiempoTranscurrido > limiteTiempo30min) {
            this.notificationService.agregarNotificacion(
              `🚨 Rampla cargada esperando chofer hace más de 30 minutos - Ticket #${ticket.id}`,
              ticket.id,
              'error'
            );
          }
        }
      }
    } catch (error) {
      console.error('Error al revisar alertas de ramplas asignadas:', error);
    }
  }

  async asignarRampla(ticket: Ticket): Promise<void> {
    if (!this.ramplaSeleccionada) {
      alert('Debe seleccionar una rampla');
      return;
    }

    this.cargando = true;
    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      await this.supabaseService.asignarRampla({
        ticket_id: ticket.id,
        rampla_id: this.ramplaSeleccionada,
        cd_user_id: user.id
      });

      const ramplaAsignada = this.ramplas.find(r => r.id === this.ramplaSeleccionada);
      this.notificationService.notificarRamplaAsignada(
        ticket.id,
        ramplaAsignada?.nombre || `Rampla ${this.ramplaSeleccionada}`
      );

      await this.cargarDatos();
      this.cerrarModalAsignacion();
    } catch (error: any) {
      console.error('Error al asignar rampla:', error);
      this.notificationService.agregarNotificacion(
        error.message || 'Error al asignar rampla',
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async asignarMuelleCD(ticket: Ticket, automatico: boolean = false): Promise<void> {
    console.log('=== ASIGNAR MUELLE CD ===');
    console.log('Ticket:', ticket.id);
    console.log('Muelle seleccionado:', this.muelleSeleccionado);
    console.log('Estado del ticket:', ticket.estado_actual);
    console.log('Asignación automática:', automatico);

    if (!automatico && (!this.muelleSeleccionado || this.muelleSeleccionado < 1)) {
      console.warn('Muelle inválido:', this.muelleSeleccionado);
      this.notificationService.agregarNotificacion(
        'Debe seleccionar un muelle válido',
        ticket.id,
        'warning'
      );
      return;
    }

    this.cargando = true;
    try {
      if (automatico) {
        console.log('Asignando muelle automáticamente...');
        await this.supabaseService.asignarMuelleAutomatico(ticket.id);
        console.log('✅ Muelle asignado automáticamente');
        this.notificationService.agregarNotificacion(
          `Muelle asignado automáticamente al ticket #${ticket.id}`,
          ticket.id,
          'success'
        );
      } else {
        console.log('Asignando muelle manual:', this.muelleSeleccionado);
        await this.supabaseService.asignarMuelleATicket(ticket.id, this.muelleSeleccionado!);
        const muelleAsignado = this.muelles.find(m => m.id === this.muelleSeleccionado);
        console.log('✅ Muelle asignado exitosamente');
        this.notificationService.agregarNotificacion(
          `${muelleAsignado?.nombre || 'Muelle'} asignado al ticket #${ticket.id}`,
          ticket.id,
          'success'
        );
      }

      console.log('Recargando datos...');
      await this.cargarDatos();
      console.log('Cerrando modal...');
      this.cerrarModalAsignarMuelle();
    } catch (error: any) {
      console.error('❌ Error al asignar muelle:', error);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error);
      this.notificationService.agregarNotificacion(
        `Error al asignar muelle: ${error.message || 'Error desconocido'}`,
        ticket.id,
        'error'
      );
    } finally {
      this.cargando = false;
      console.log('=== FIN ASIGNAR MUELLE CD ===');
    }
  }

  async cambiarEstado(ticket: Ticket, nuevoEstado: any): Promise<void> {
    this.cargando = true;
    try {
      // Usar métodos específicos según el estado
      if (nuevoEstado === 'Inicio Descarga') {
        await this.supabaseService.iniciarDescarga(ticket.id);
        this.notificationService.agregarNotificacion(
          `Inicio de descarga del ticket #${ticket.id}`,
          ticket.id,
          'info'
        );
      } else if (nuevoEstado === 'Fin Descarga' || nuevoEstado === 'Libre') {
        await this.supabaseService.finalizarDescarga(ticket.id);
        this.notificationService.agregarNotificacion(
          `Ticket #${ticket.id} completado y rampla liberada`,
          ticket.id,
          'success'
        );
      } else {
        // Para otros estados usar el método genérico
        await this.supabaseService.cambiarEstadoTicket(ticket.id, nuevoEstado);
        this.notificationService.agregarNotificacion(
          `Estado del ticket #${ticket.id} actualizado`,
          ticket.id,
          'info'
        );
      }

      await this.cargarDatos();
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

  abrirModalAsignacion(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.ramplaSeleccionada = null;
    this.modalActivo = 'rampla';
  }

  cerrarModalAsignacion(): void {
    this.ticketSeleccionado = null;
    this.ramplaSeleccionada = null;
    this.modalActivo = null;
  }

  // Métodos auxiliares
  getEstadoColor(estado: string): string {
    const colores: any = {
      'Pendiente Asignación': 'warn',
      'Rampla en Tránsito': 'primary',
      'Rampla en Planta': 'primary',
      'Carga iniciada': 'primary',
      'Fin de Carga': 'primary',
      'Cargado - Espera Chofer': 'accent',
      'Asignada a Muelle CD': 'accent',
      'Inicio Descarga': 'accent',
      'Fin Descarga': 'accent',
      'Libre': 'primary',
      'Rechazada': 'warn'
    };
    return colores[estado] || 'primary';
  }

  getRamplaEstadoColor(estado: string): string {
    return estado === 'Libre' ? 'primary' : 'accent';
  }

  getTiempoRestante(fechaAlerta: string | null): string {
    if (!fechaAlerta) return '';

    const ahora = new Date();
    const alerta = new Date(fechaAlerta);
    const diff = alerta.getTime() - ahora.getTime();

    if (diff <= 0) return 'Vencido';

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  }

  estaProximoVencer(fechaAlerta: string | null): boolean {
    if (!fechaAlerta) return false;

    const ahora = new Date();
    const alerta = new Date(fechaAlerta);
    const diff = alerta.getTime() - ahora.getTime();
    const minutosRestantes = diff / (1000 * 60);

    return minutosRestantes > 0 && minutosRestantes <= 30;
  }

  get ticketsFiltrados(): Ticket[] {
    let tickets = this.ticketsActivos;

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      tickets = tickets.filter(t => t.estado_actual === this.filtroEstado);
    }

    // Filtro por búsqueda
    if (this.filtroBusqueda.trim()) {
      const busqueda = this.filtroBusqueda.toLowerCase();
      tickets = tickets.filter(t =>
        t.id.toString().includes(busqueda) ||
        t.muelle_planta.toString().includes(busqueda) ||
        t.rampla_asignada?.nombre.toLowerCase().includes(busqueda)
      );
    }

    return tickets;
  }

  get ticketsTransitoFiltrados(): Ticket[] {
    let tickets = this.ticketsEnTransito;

    // Filtro por búsqueda
    if (this.filtroBusquedaTransito.trim()) {
      const busqueda = this.filtroBusquedaTransito.toLowerCase();
      tickets = tickets.filter(t =>
        t.id.toString().includes(busqueda) ||
        t.muelle_planta.toString().includes(busqueda) ||
        t.muelle_cd_asignado?.toString().includes(busqueda) ||
        t.rampla_asignada?.nombre.toLowerCase().includes(busqueda)
      );
    }

    return tickets;
  }

  private actualizarBadgeNotificaciones(cantidad: number): void {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = cantidad.toString();
      badge.style.display = cantidad > 0 ? 'block' : 'none';
    }
  }

  // Métodos para acciones rápidas
  puedeAsignarRampla(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Pendiente Asignación';
  }

  puedeAsignarMuelle(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Cargado - Espera Chofer';
  }

  puedeIniciarDescarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Asignada a Muelle CD';
  }

  puedeFinalizarDescarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Inicio Descarga';
  }

  puedeCancelarTicket(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla en Tránsito';
  }

  abrirModalCancelar(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.motivoCancelacionSeleccionado = '';
    this.otraRazonCancelacion = '';
    this.modalActivo = 'cancelar';
  }

  cerrarModalCancelar(): void {
    this.ticketSeleccionado = null;
    this.motivoCancelacionSeleccionado = '';
    this.otraRazonCancelacion = '';
    this.modalActivo = null;
  }

  async confirmarCancelacion(): Promise<void> {
    if (!this.ticketSeleccionado || !this.motivoCancelacionSeleccionado) {
      alert('Debe seleccionar un motivo de cancelación');
      return;
    }

    if (this.motivoCancelacionSeleccionado === 'Otro' && !this.otraRazonCancelacion.trim()) {
      alert('Debe especificar el motivo de cancelación');
      return;
    }

    const motivo = this.motivoCancelacionSeleccionado === 'Otro' 
      ? this.otraRazonCancelacion.trim()
      : this.motivoCancelacionSeleccionado;

    this.cargando = true;
    try {
      await this.supabaseService.cancelarTicket(
        this.ticketSeleccionado.id,
        motivo
      );

      this.notificationService.agregarNotificacion(
        `Ticket #${this.ticketSeleccionado.id} cancelado exitosamente`,
        this.ticketSeleccionado.id,
        'success'
      );

      this.cerrarModalCancelar();
      await this.cargarDatos();
    } catch (error: any) {
      console.error('Error al cancelar ticket:', error);
      const mensaje = error?.message || 'Error al cancelar el ticket';
      this.notificationService.agregarNotificacion(
        mensaje,
        0,
        'error'
      );
      alert(`Error al cancelar: ${mensaje}`);
    } finally {
      this.cargando = false;
    }
  }

  abrirModalAsignarMuelle(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.muelleSeleccionado = null;
    this.muelleCD = null;
    this.modalActivo = 'muelle';
  }

  cerrarModalAsignarMuelle(): void {
    this.ticketSeleccionado = null;
    this.muelleSeleccionado = null;
    this.muelleCD = null;
    this.modalActivo = null;
  }

  calcularContadoresEstadoRamplas(): void {
    // Inicializar solo los estados donde la rampla está activa (sin Solicitud Creada y Pendiente Asignación)
    this.contadoresEstadoRamplas = {
      'Rampla en Tránsito': 0,
      'Rampla en Planta': 0,
      'Carga iniciada': 0,
      'Fin de Carga': 0,
      'Cargado - Espera Chofer': 0,
      'Asignada a Muelle CD': 0,
      'Inicio Descarga': 0,
      'Fin Descarga': 0,
      'Libre': 0,
      'Rechazada': 0
    };

    // Contar tickets activos por estado (solo estados donde hay rampla asignada)
    this.ticketsActivos.forEach(ticket => {
      const estado = ticket.estado_actual;
      if (this.contadoresEstadoRamplas[estado] !== undefined) {
        this.contadoresEstadoRamplas[estado]++;
      }
    });
  }

  getEstadosRamplasConContadores(): Array<{ estado: string; cantidad: number }> {
    // Devolver estados donde la rampla está en uso (sin Solicitud Creada y Pendiente Asignación)
    const ordenEstados = [
      'Rampla en Tránsito',
      'Rampla en Planta',
      'Carga iniciada',
      'Fin de Carga',
      'Cargado - Espera Chofer',
      'Asignada a Muelle CD',
      'Inicio Descarga',
      'Fin Descarga',
      'Libre',
      'Rechazada'
    ];

    return ordenEstados.map(estado => ({
      estado,
      cantidad: this.contadoresEstadoRamplas[estado] || 0
    }));
  }

  getIconoEstadoRampla(estado: string): string {
    const iconos: { [key: string]: string } = {
      'Solicitud Creada': 'add_circle',
      'Pendiente Asignación': 'pending',
      'Rampla en Tránsito': 'local_shipping',
      'Rampla en Planta': 'factory',
      'Carga iniciada': 'play_circle',
      'Fin de Carga': 'check_circle',
      'Cargado - Espera Chofer': 'hourglass_empty',
      'Asignada a Muelle CD': 'warehouse',
      'Inicio Descarga': 'unarchive',
      'Fin Descarga': 'done_all',
      'Libre': 'check_circle_outline',
      'Rechazada': 'cancel'
    };
    return iconos[estado] || 'circle';
  }

  getEstadoRamplaClass(estado: string): string {
    if (estado.includes('Rechazada')) return 'error';
    if (estado.includes('Pendiente') || estado.includes('Espera')) return 'warning';
    if (estado.includes('Libre') || estado.includes('Fin')) return 'success';
    if (estado.includes('Inicio') || estado.includes('Cargado')) return 'info';
    return 'primary';
  }

  getEstadoClass(estado: string): string {
    if (estado.includes('Rechazada')) return 'error';
    if (estado.includes('Pendiente') || estado.includes('Espera') || estado === 'Rampla cargada') return 'warning';
    if (estado.includes('Libre') || estado.includes('Fin')) return 'success';
    if (estado.includes('Inicio') || estado.includes('Cargado')) return 'info';
    return 'primary';
  }

  verDetalleTicket(ticket: Ticket): void {
    this.dialog.open(DetalleTicketComponent, {
      data: { ticketId: ticket.id },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'detalle-ticket-dialog'
    });
  }
}