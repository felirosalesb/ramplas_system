import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Muelle } from '../../models/models';

@Component({
  selector: 'app-gestion-muelles',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule
  ],
  templateUrl: './gestion-muelles.component.html',
  styleUrl: './gestion-muelles.component.css'
})
export class GestionMuellesComponent implements OnInit, OnDestroy {
  muelles: Muelle[] = [];
  muellesFiltrados: Muelle[] = [];

  // Modal
  mostrarModal = false;
  modoEdicion = false;
  muelleSeleccionado: Muelle | null = null;

  // Formulario
  formMuelle = {
    nombre: '',
    activo: true
  };

  // Filtros
  filtroBusqueda = '';
  filtroEstado: 'activo' | 'inactivo' | 'todos' = 'todos';
  filtroDisponibilidad: 'Libre' | 'Ocupado' | 'todos' = 'todos';

  cargando = false;
  columnas = ['id', 'nombre', 'estado', 'rampla_actual', 'activo', 'acciones'];

  private realtimeChannel: any;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cargarMuelles();
    this.iniciarRealtimeSubscriptions();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  private iniciarRealtimeSubscriptions(): void {
    this.realtimeChannel = this.supabaseService.subscribeToMuelles(() => {
      console.log('🔄 Cambio detectado en muelles, recargando...');
      this.cargarMuelles();
    });
  }

  async cargarMuelles(): Promise<void> {
    try {
      this.cargando = true;
      this.muelles = await this.supabaseService.getMuelles();
      this.aplicarFiltros();
    } catch (error: any) {
      console.error('Error al cargar muelles:', error);
      this.notificationService.agregarNotificacion(
        'Error al cargar muelles: ' + (error.message || 'Error desconocido'),
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  aplicarFiltros(): void {
    this.muellesFiltrados = this.muelles.filter(muelle => {
      // Filtro por búsqueda
      const coincideBusqueda = !this.filtroBusqueda ||
        muelle.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase());

      // Filtro por estado activo/inactivo
      const coincideEstado = this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'activo' && muelle.activo) ||
        (this.filtroEstado === 'inactivo' && !muelle.activo);

      // Filtro por disponibilidad (Libre/Ocupado)
      const coincideDisponibilidad = this.filtroDisponibilidad === 'todos' ||
        muelle.estado === this.filtroDisponibilidad;

      return coincideBusqueda && coincideEstado && coincideDisponibilidad;
    });
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.muelleSeleccionado = null;
    this.formMuelle = {
      nombre: '',
      activo: true
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(muelle: Muelle): void {
    this.modoEdicion = true;
    this.muelleSeleccionado = muelle;
    this.formMuelle = {
      nombre: muelle.nombre,
      activo: muelle.activo
    };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.muelleSeleccionado = null;
    this.formMuelle = {
      nombre: '',
      activo: true
    };
  }

  async guardarMuelle(): Promise<void> {
    if (!this.formMuelle.nombre.trim()) {
      this.notificationService.agregarNotificacion(
        'El nombre del muelle es requerido',
        0,
        'warning'
      );
      return;
    }

    try {
      this.cargando = true;

      if (this.modoEdicion && this.muelleSeleccionado) {
        // Editar muelle existente
        await this.supabaseService.actualizarMuelle(
          this.muelleSeleccionado.id,
          this.formMuelle
        );
        this.notificationService.agregarNotificacion(
          `Muelle "${this.formMuelle.nombre}" actualizado correctamente`,
          0,
          'success'
        );
      } else {
        // Crear nuevo muelle
        await this.supabaseService.crearMuelle(this.formMuelle);
        this.notificationService.agregarNotificacion(
          `Muelle "${this.formMuelle.nombre}" creado correctamente`,
          0,
          'success'
        );
      }

      this.cerrarModal();
      await this.cargarMuelles();
    } catch (error: any) {
      console.error('Error al guardar muelle:', error);
      this.notificationService.agregarNotificacion(
        'Error: ' + (error.message || 'No se pudo guardar el muelle'),
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async cambiarEstadoActivo(muelle: Muelle, nuevoEstado: boolean): Promise<void> {
    if (muelle.estado === 'Ocupado' && !nuevoEstado) {
      this.notificationService.agregarNotificacion(
        'No se puede desactivar un muelle que está ocupado',
        0,
        'warning'
      );
      return;
    }

    try {
      this.cargando = true;
      await this.supabaseService.cambiarEstadoActivoMuelle(muelle.id, nuevoEstado);
      this.notificationService.agregarNotificacion(
        `Muelle ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
        0,
        'success'
      );
      await this.cargarMuelles();
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      this.notificationService.agregarNotificacion(
        'Error: ' + (error.message || 'No se pudo cambiar el estado'),
        0,
        'error'
      );
      await this.cargarMuelles(); // Recargar para revertir el cambio visual
    } finally {
      this.cargando = false;
    }
  }

  async eliminarMuelle(muelle: Muelle): Promise<void> {
    if (muelle.estado === 'Ocupado') {
      this.notificationService.agregarNotificacion(
        'No se puede eliminar un muelle que está ocupado',
        0,
        'warning'
      );
      return;
    }

    if (!confirm(`¿Está seguro de eliminar el muelle "${muelle.nombre}"?`)) {
      return;
    }

    try {
      this.cargando = true;
      await this.supabaseService.eliminarMuelle(muelle.id);
      this.notificationService.agregarNotificacion(
        `Muelle "${muelle.nombre}" eliminado correctamente`,
        0,
        'success'
      );
      await this.cargarMuelles();
    } catch (error: any) {
      console.error('Error al eliminar muelle:', error);
      this.notificationService.agregarNotificacion(
        'Error: ' + (error.message || 'No se pudo eliminar el muelle'),
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  async liberarMuelle(muelle: Muelle): Promise<void> {
    if (muelle.estado !== 'Ocupado') {
      this.notificationService.agregarNotificacion(
        'El muelle ya está libre',
        0,
        'info'
      );
      return;
    }

    if (!confirm(`¿Está seguro de liberar el muelle "${muelle.nombre}"?\nEsto desvinculará el ticket actual.`)) {
      return;
    }

    try {
      this.cargando = true;
      await this.supabaseService.liberarMuelle(muelle.id);
      this.notificationService.agregarNotificacion(
        `Muelle "${muelle.nombre}" liberado correctamente`,
        0,
        'success'
      );
      await this.cargarMuelles();
    } catch (error: any) {
      console.error('Error al liberar muelle:', error);
      this.notificationService.agregarNotificacion(
        'Error: ' + (error.message || 'No se pudo liberar el muelle'),
        0,
        'error'
      );
    } finally {
      this.cargando = false;
    }
  }

  getEstadoChipClass(estado: string): string {
    return estado === 'Libre' ? 'estado-libre' : 'estado-ocupado';
  }

  get muellesLibresCount(): number {
    return this.muelles.filter(m => m.estado === 'Libre').length;
  }

  get muellesOcupadosCount(): number {
    return this.muelles.filter(m => m.estado === 'Ocupado').length;
  }

  get muellesActivos(): number {
    return this.muelles.filter(m => m.activo).length;
  }

  get muellesInactivos(): number {
    return this.muelles.filter(m => !m.activo).length;
  }

  get totalLibres(): number {
    return this.muelles.filter(m => m.estado === 'Libre').length;
  }

  get totalOcupados(): number {
    return this.muelles.filter(m => m.estado === 'Ocupado').length;
  }
}
