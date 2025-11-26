import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavbarComponent } from '../navbar/navbar.component';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Muelle } from '../../models/models';

@Component({
  selector: 'app-monitor-muelles',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    NavbarComponent
  ],
  templateUrl: './monitor-muelles.component.html',
  styleUrl: './monitor-muelles.component.css'
})
export class MonitorMuellesComponent implements OnInit, OnDestroy {
  muelles: Muelle[] = [];
  muellesFiltrados: Muelle[] = [];

  // Filtros
  filtroBusqueda = '';
  filtroEstado: 'activo' | 'inactivo' | 'todos' = 'todos';
  filtroDisponibilidad: 'Libre' | 'Ocupado' | 'todos' = 'todos';

  cargando = false;
  columnas = ['id', 'nombre', 'estado', 'rampla_actual', 'activo'];

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
      // Filtro de búsqueda
      const coincideBusqueda = !this.filtroBusqueda || 
        muelle.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        muelle.id.toString().includes(this.filtroBusqueda);

      // Filtro de estado activo/inactivo
      const coincideEstado = this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'activo' && muelle.activo) ||
        (this.filtroEstado === 'inactivo' && !muelle.activo);

      // Filtro de disponibilidad
      const coincideDisponibilidad = this.filtroDisponibilidad === 'todos' ||
        muelle.estado === this.filtroDisponibilidad;

      return coincideBusqueda && coincideEstado && coincideDisponibilidad;
    });
  }

  getEstadoChipClass(estado: string): string {
    return estado === 'Libre' ? 'estado-libre' : 'estado-ocupado';
  }

  get muellesLibresCount(): number {
    return this.muelles.filter(m => m.estado === 'Libre' && m.activo).length;
  }

  get muellesOcupadosCount(): number {
    return this.muelles.filter(m => m.estado === 'Ocupado').length;
  }
}
