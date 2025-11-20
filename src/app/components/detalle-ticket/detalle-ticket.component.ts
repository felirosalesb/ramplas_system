import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
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
    NavbarComponent
  ],
  templateUrl: './detalle-ticket.component.html',
  styleUrl: './detalle-ticket.component.css'
})
export class DetalleTicketComponent implements OnInit {
  ticket: Ticket | null = null;
  registros: RegistroTiempo[] = [];
  cargando = true;
  displayedColumns: string[] = ['estado', 'fecha', 'tiempo'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    await this.cargarDetalle(parseInt(id));
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

  volver() {
    this.router.navigate(['/dashboard-planta']);
  }
}
