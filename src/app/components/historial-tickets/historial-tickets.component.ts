import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../services/supabase.service';
import { Ticket } from '../../models/models';
import { NavbarComponent } from '../navbar/navbar.component';
import { DetalleTicketComponent } from '../detalle-ticket/detalle-ticket.component';

@Component({
  selector: 'app-historial-tickets',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    NavbarComponent
  ],
  templateUrl: './historial-tickets.component.html',
  styleUrl: './historial-tickets.component.css'
})
export class HistorialTicketsComponent implements OnInit {
  ticketsHistorico: Ticket[] = [];
  ticketsFiltrados: Ticket[] = [];
  cargando = false;
  rolUsuario: string = '';

  // Filtros
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  plantaFiltro: string = '';
  tipoFiltro: string = '';
  busqueda: string = '';

  // Opciones para filtros
  plantas: string[] = [];
  tiposTicket = ['Retiro pallets producción', 'Solicitar Pallets vacíos'];

  // Columnas de la tabla
  displayedColumns: string[] = [
    'id',
    'tipo_ticket',
    'nombre_planta',
    'fecha_creacion',
    'rampla',
    'acciones'
  ];

  constructor(
    private supabaseService: SupabaseService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    await this.obtenerRolUsuario();
    await this.cargarHistorial();
  }

  async obtenerRolUsuario(): Promise<void> {
    const user = this.supabaseService.getCurrentUser();
    if (user) {
      const userData = await this.supabaseService.obtenerUsuarioPorId(user.id);
      this.rolUsuario = userData?.rol || '';
    }
  }

  async cargarHistorial(): Promise<void> {
    this.cargando = true;
    try {
      const tickets = await this.supabaseService.getTicketsHistorico();
      
      // Filtrar según rol
      if (this.rolUsuario === 'cd') {
        // CD ve todo
        this.ticketsHistorico = tickets;
      } else if (this.rolUsuario === 'planta') {
        // Planta solo ve sus tickets
        const user = this.supabaseService.getCurrentUser();
        const userData = await this.supabaseService.obtenerUsuarioPorId(user!.id);
        const nombrePlanta = userData?.nombre_planta;
        this.ticketsHistorico = tickets.filter(t => t.nombre_planta === nombrePlanta);
      } else if (this.rolUsuario === 'galpon') {
        // Galpón solo ve tickets de solicitud de pallets vacíos
        this.ticketsHistorico = tickets.filter(t => t.tipo_ticket === 'Solicitar Pallets vacíos');
      }

      // Obtener lista de plantas para filtro
      this.plantas = [...new Set(this.ticketsHistorico.map(t => t.nombre_planta).filter((p): p is string => !!p))];

      this.aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      this.cargando = false;
    }
  }

  aplicarFiltros(): void {
    let tickets = [...this.ticketsHistorico];

    // Filtro por fecha inicio
    if (this.fechaInicio) {
      tickets = tickets.filter(t => 
        new Date(t.fecha_creacion) >= this.fechaInicio!
      );
    }

    // Filtro por fecha fin
    if (this.fechaFin) {
      const fechaFinConHora = new Date(this.fechaFin);
      fechaFinConHora.setHours(23, 59, 59, 999);
      tickets = tickets.filter(t => 
        new Date(t.fecha_creacion) <= fechaFinConHora
      );
    }

    // Filtro por planta
    if (this.plantaFiltro) {
      tickets = tickets.filter(t => t.nombre_planta === this.plantaFiltro);
    }

    // Filtro por tipo
    if (this.tipoFiltro) {
      tickets = tickets.filter(t => t.tipo_ticket === this.tipoFiltro);
    }

    // Búsqueda por ID o rampla
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      tickets = tickets.filter(t =>
        t.id.toString().includes(busquedaLower) ||
        t.rampla_asignada?.nombre.toLowerCase().includes(busquedaLower)
      );
    }

    this.ticketsFiltrados = tickets;
  }

  limpiarFiltros(): void {
    this.fechaInicio = null;
    this.fechaFin = null;
    this.plantaFiltro = '';
    this.tipoFiltro = '';
    this.busqueda = '';
    this.aplicarFiltros();
  }

  // Limpieza rápida por chip
  clearBusqueda(): void {
    this.busqueda = '';
    this.aplicarFiltros();
  }

  clearFechaInicio(): void {
    this.fechaInicio = null;
    this.aplicarFiltros();
  }

  clearFechaFin(): void {
    this.fechaFin = null;
    this.aplicarFiltros();
  }

  clearPlanta(): void {
    this.plantaFiltro = '';
    this.aplicarFiltros();
  }

  clearTipo(): void {
    this.tipoFiltro = '';
    this.aplicarFiltros();
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
      closeOnNavigation: true
    });
  }

  getTipoColor(tipo: string): string {
    return tipo === 'Retiro pallets producción' ? 'primary' : 'accent';
  }
}
