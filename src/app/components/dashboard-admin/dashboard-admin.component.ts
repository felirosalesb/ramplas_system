import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { NavbarComponent } from '../navbar/navbar.component';
import { GestionMuellesComponent } from '../gestion-muelles/gestion-muelles.component';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Rampla, TipoRampla } from '../../models/models';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTabsModule,
    NavbarComponent,
    GestionMuellesComponent
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.css'
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  ramplas: Rampla[] = [];
  ramplasFiltradas: Rampla[] = [];

  // Modal
  mostrarModal = false;
  modoEdicion = false;
  ramplaSeleccionada: Rampla | null = null;

  // Modal de motivo de bloqueo
  mostrarModalMotivo = false;
  ramplaABloquear: Rampla | null = null;
  motivosBloqueo = ['Mantención', 'Fuera de servicio'];
  motivoSeleccionado: string = '';

  // Formulario
  formRampla = {
    nombre: '',
    tipo_rampla: 'cortina' as TipoRampla,
    activo: true
  };

  // Filtros
  filtroBusqueda = '';
  filtroTipo: TipoRampla | 'todos' = 'todos';
  filtroEstado: 'activo' | 'inactivo' | 'todos' = 'todos';

  cargando = false;
  columnas = ['id', 'nombre', 'tipo', 'estado', 'activo', 'acciones'];

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) { }

  private intervalMonitoreo: any;
  private realtimeChannel: any;

  async ngOnInit(): Promise<void> {
    await this.cargarRamplas();
    this.iniciarMonitoreoAlertas();
    this.iniciarRealtimeSubscriptions();
  }

  ngOnDestroy(): void {
    if (this.intervalMonitoreo) {
      clearInterval(this.intervalMonitoreo);
    }
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  private iniciarRealtimeSubscriptions(): void {
    this.realtimeChannel = this.supabaseService['supabase']
      .channel('admin-ramplas-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          // Recargar datos cuando hay cambios
          this.cargarRamplas();
        }
      )
      .subscribe();
  }

  private iniciarMonitoreoAlertas(): void {
    // Revisión cada 5 minutos
    this.intervalMonitoreo = setInterval(() => {
      this.revisarAlertasRamplasAsignadas();
    }, 5 * 60 * 1000);

    // Revisión inicial
    this.revisarAlertasRamplasAsignadas();
  }

  private async revisarAlertasRamplasAsignadas(): Promise<void> {
    try {
      const ahora = new Date();
      const limiteTiempo15min = 15 * 60 * 1000; // 15 minutos en milisegundos
      const limiteTiempo30min = 30 * 60 * 1000; // 30 minutos en milisegundos

      // Alerta 1: Ramplas asignadas hace más de 15 minutos
      const { data: ticketsAsignadas } = await this.supabaseService['supabase']
        .from('tickets')
        .select('id, estado_actual')
        .eq('estado_actual', 'Rampla en Tránsito');

      if (ticketsAsignadas && ticketsAsignadas.length > 0) {
        for (const ticket of ticketsAsignadas) {
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
      }

      // Alerta 2: Ramplas cargadas hace más de 30 minutos (Cargado - Espera Chofer)
      const { data: ticketsCargados } = await this.supabaseService['supabase']
        .from('tickets')
        .select('id, estado_actual')
        .eq('estado_actual', 'Cargado - Espera Chofer');

      if (ticketsCargados && ticketsCargados.length > 0) {
        for (const ticket of ticketsCargados) {
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
      }
    } catch (error) {
      console.error('Error al revisar alertas de ramplas asignadas:', error);
    }
  }

  async cargarRamplas(): Promise<void> {
    this.cargando = true;
    try {
      this.ramplas = await this.supabaseService.getAllRamplasAdmin();
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar ramplas:', error);
      this.notificationService.agregarNotificacion(
        'Error al cargar ramplas',
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  aplicarFiltros(): void {
    let resultado = [...this.ramplas];

    // Filtro por búsqueda
    if (this.filtroBusqueda.trim()) {
      const busqueda = this.filtroBusqueda.toLowerCase();
      resultado = resultado.filter(r =>
        r.nombre.toLowerCase().includes(busqueda) ||
        r.id.toString().includes(busqueda)
      );
    }

    // Filtro por tipo
    if (this.filtroTipo !== 'todos') {
      resultado = resultado.filter(r => r.tipo_rampla === this.filtroTipo);
    }

    // Filtro por estado activo/inactivo
    if (this.filtroEstado !== 'todos') {
      const activo = this.filtroEstado === 'activo';
      resultado = resultado.filter(r => r.activo === activo);
    }

    this.ramplasFiltradas = resultado;
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.ramplaSeleccionada = null;
    this.formRampla = {
      nombre: '',
      tipo_rampla: 'cortina',
      activo: true
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(rampla: Rampla): void {
    this.modoEdicion = true;
    this.ramplaSeleccionada = rampla;
    this.formRampla = {
      nombre: rampla.nombre,
      tipo_rampla: rampla.tipo_rampla,
      activo: rampla.activo
    };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.ramplaSeleccionada = null;
  }

  async guardarRampla(): Promise<void> {
    if (!this.formRampla.nombre.trim()) {
      this.notificationService.agregarNotificacion(
        'El nombre de la rampla es obligatorio',
        0,
        'warning'
      );
      return;
    }

    this.cargando = true;
    try {
      if (this.modoEdicion && this.ramplaSeleccionada) {
        // Actualizar
        await this.supabaseService.actualizarRampla(
          this.ramplaSeleccionada.id,
          this.formRampla
        );
        this.notificationService.agregarNotificacion(
          `Rampla "${this.formRampla.nombre}" actualizada`,
          0,
          'success'
        );
      } else {
        // Crear
        await this.supabaseService.crearRampla(this.formRampla);
        this.notificationService.agregarNotificacion(
          `Rampla "${this.formRampla.nombre}" creada`,
          0,
          'success'
        );
      }

      await this.cargarRamplas();
      this.cerrarModal();
    } catch (error: any) {
      console.error('Error al guardar rampla:', error);
      this.notificationService.agregarNotificacion(
        error.message || 'Error al guardar rampla',
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  cambiarEstadoActivo(rampla: Rampla): void {
    const nuevoEstado = !rampla.activo;
    
    // Si se está desactivando, pedir motivo
    if (!nuevoEstado) {
      this.ramplaABloquear = rampla;
      this.motivoSeleccionado = '';
      this.mostrarModalMotivo = true;
    } else {
      // Si se está activando, hacerlo directamente
      this.confirmarCambioEstado(rampla, true, null);
    }
  }

  cerrarModalMotivo(): void {
    this.mostrarModalMotivo = false;
    this.ramplaABloquear = null;
    this.motivoSeleccionado = '';
  }

  async confirmarBloqueo(): Promise<void> {
    if (!this.ramplaABloquear || !this.motivoSeleccionado) {
      alert('Debe seleccionar un motivo de bloqueo');
      return;
    }

    await this.confirmarCambioEstado(this.ramplaABloquear, false, this.motivoSeleccionado);
    this.cerrarModalMotivo();
  }

  async confirmarCambioEstado(rampla: Rampla, nuevoEstado: boolean, motivo: string | null): Promise<void> {
    this.cargando = true;
    try {
      await this.supabaseService.cambiarEstadoActivoRampla(rampla.id, nuevoEstado, motivo);
      this.notificationService.agregarNotificacion(
        `Rampla "${rampla.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'}${motivo ? ` - ${motivo}` : ''}`,
        0,
        'success'
      );
      await this.cargarRamplas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.notificationService.agregarNotificacion(
        'Error al cambiar estado de la rampla',
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async eliminarRampla(rampla: Rampla): Promise<void> {
    if (!confirm(`¿Estás seguro de eliminar la rampla "${rampla.nombre}"?`)) {
      return;
    }

    try {
      await this.supabaseService.eliminarRampla(rampla.id);
      this.notificationService.agregarNotificacion(
        `Rampla "${rampla.nombre}" eliminada`,
        0,
        'success'
      );
      await this.cargarRamplas();
    } catch (error: any) {
      console.error('Error al eliminar rampla:', error);
      this.notificationService.agregarNotificacion(
        error.message || 'Error al eliminar rampla',
        0,
        'error'
      );
    }
  }

  getTipoLabel(tipo: TipoRampla): string {
    return tipo === 'frugon_cerrado' ? 'Frugón Cerrado' : 'Cortina';
  }

  getTipoColor(tipo: TipoRampla): string {
    return tipo === 'frugon_cerrado' ? 'primary' : 'accent';
  }

  getEstadoColor(estado: string): string {
    if (estado === 'Inactiva') return 'warn';
    return estado === 'Libre' ? 'primary' : 'accent';
  }

  get ramplasActivas(): number {
    return this.ramplas.filter(r => r.activo).length;
  }

  get ramplasInactivas(): number {
    return this.ramplas.filter(r => !r.activo).length;
  }
}
