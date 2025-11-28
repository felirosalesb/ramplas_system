import { Component, OnInit, Input, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SupabaseService } from '../../services/supabase.service';
import { Ticket, RegistroTiempo } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-detalle-ticket',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatDialogModule,
    NavbarComponent
  ],
  templateUrl: './detalle-ticket.component.html',
  styleUrl: './detalle-ticket.component.css'
})
export class DetalleTicketComponent implements OnInit {
  @Input() ticketId?: number; // Para uso como modal

  ticket: Ticket | null = null;
  registros: RegistroTiempo[] = [];
  cargando = true;
  esModal = false;
  displayedColumns: string[] = ['estado', 'fecha', 'tiempo'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    @Optional() public dialogRef: MatDialogRef<DetalleTicketComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { ticketId: number }
  ) {
    // Determinar si se está usando como modal
    this.esModal = !!dialogRef;
  }

  async ngOnInit() {
    console.log('=== DETALLE TICKET INIT ===');
    console.log('Es modal:', this.esModal);
    console.log('Data recibida:', this.data);
    console.log('TicketId input:', this.ticketId);

    // Prioridad: data del modal > Input > parámetro de ruta
    let id: number | null = null;

    if (this.data?.ticketId) {
      console.log('Usando ticketId del data:', this.data.ticketId);
      id = this.data.ticketId;
    } else if (this.ticketId) {
      console.log('Usando ticketId del Input:', this.ticketId);
      id = this.ticketId;
    } else {
      const routeId = this.route.snapshot.paramMap.get('id');
      if (routeId) {
        console.log('Usando ticketId de la ruta:', routeId);
        id = parseInt(routeId);
      }
    }

    if (!id) {
      console.error('No se encontró ticketId');
      if (!this.esModal) {
        this.router.navigate(['/']);
      }
      return;
    }

    console.log('Cargando detalle para ticket ID:', id);
    await this.cargarDetalle(id);
  }

  async cargarDetalle(ticketId: number) {
    this.cargando = true;
    try {
      [this.ticket, this.registros] = await Promise.all([
        this.supabaseService.getTicketById(ticketId),
        this.supabaseService.getRegistrosTiempo(ticketId)
      ]);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    } finally {
      this.cargando = false;
    }
  }

  calcularTiempo(registro: RegistroTiempo, index: number): string {
    if (index === 0) return '-';
    const anterior = this.registros[index - 1];
    const diff = new Date(registro.fecha_hora).getTime() - new Date(anterior.fecha_hora).getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  }

  getIconoEstado(estado: string): string {
    const iconos: any = {
      'Solicitud Creada': 'add_circle',
      'Pendiente Aprobación Galpón': 'pending_actions',
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

  getEstadoClass(estado: string): string {
    if (estado.includes('Rechazada')) return 'error';
    if (estado.includes('Pendiente') || estado.includes('Espera')) return 'warning';
    if (estado.includes('Libre') || estado.includes('Fin')) return 'success';
    return 'info';
  }

  volver() {
    if (this.esModal && this.dialogRef) {
      this.dialogRef.close();
    } else {
      // Navegar de vuelta según el rol del usuario
      const usuario = this.supabaseService.getCurrentUser();
      if (usuario) {
        this.supabaseService.obtenerUsuarioPorId(usuario.id).then(user => {
          if (user?.rol === 'cd') {
            this.router.navigate(['/dashboard-cd']);
          } else if (user?.rol === 'admin') {
            this.router.navigate(['/dashboard-admin']);
          } else {
            this.router.navigate(['/dashboard-planta']);
          }
        }).catch(() => {
          window.history.back();
        });
      } else {
        window.history.back();
      }
    }
  }

  cerrarModal() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
