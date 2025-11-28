// src/app/components/reportes-cd/reportes-cd.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface ViajeRampla {
  rampla: string;
  viajes: {
    planta: string;
    muelle: number;
    fecha: Date;
    ticketId: number;
  }[];
}

interface PalletsPorPlanta {
  planta: string;
  cantidadEnviada: number;
  numeroTickets: number;
}

@Component({
  selector: 'app-reportes-cd',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    NavbarComponent
  ],
  templateUrl: './reportes-cd.component.html',
  styleUrls: ['./reportes-cd.component.css']
})
export class ReportesCdComponent implements OnInit {
  // Parámetros de búsqueda
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  horaInicio: string = '00:00';
  horaFin: string = '23:59';

  // Datos de reportes
  viajesRamplas: ViajeRampla[] = [];
  palletsPorPlanta: PalletsPorPlanta[] = [];

  // Columnas de tablas
  columnasViajes = ['rampla', 'viajes'];
  columnasPallets = ['planta', 'cantidadEnviada', 'numeroTickets'];

  // Estados
  cargando = false;
  reporteGenerado = false;

  // Totales
  totalPallets = 0;
  totalTickets = 0;
  totalViajes = 0;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {
    // Inicializar con fecha actual
    const hoy = new Date();
    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    this.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  }

  ngOnInit(): void {
    this.notificationService.setRolUsuario('cd');
  }

  async generarReporte(): Promise<void> {
    if (!this.fechaInicio || !this.fechaFin) {
      this.notificationService.agregarNotificacion(
        'Debes seleccionar las fechas de inicio y fin',
        0,
        'warning',
        'media',
        ['cd', 'admin']
      );
      return;
    }

    // Validar que fecha inicio sea menor o igual a fecha fin
    if (this.fechaInicio > this.fechaFin) {
      this.notificationService.agregarNotificacion(
        'La fecha de inicio no puede ser mayor a la fecha de fin',
        0,
        'warning',
        'media',
        ['cd', 'admin']
      );
      return;
    }

    this.cargando = true;
    try {
      // Construir fechas con horas
      const fechaInicioCompleta = new Date(this.fechaInicio);
      const [horaIni, minIni] = this.horaInicio.split(':');
      fechaInicioCompleta.setHours(parseInt(horaIni), parseInt(minIni), 0, 0);

      const fechaFinCompleta = new Date(this.fechaFin);
      const [horaFn, minFn] = this.horaFin.split(':');
      fechaFinCompleta.setHours(parseInt(horaFn), parseInt(minFn), 59, 999);

      console.log('Generando reporte desde:', fechaInicioCompleta, 'hasta:', fechaFinCompleta);

      // Obtener tickets finalizados en el rango
      const tickets = await this.supabaseService.getTicketsFinalizadosRango(
        fechaInicioCompleta.toISOString(),
        fechaFinCompleta.toISOString()
      );

      console.log('Tickets obtenidos:', tickets.length);

      if (tickets.length === 0) {
        this.notificationService.agregarNotificacion(
          'No se encontraron tickets finalizados en el rango seleccionado',
          0,
          'info',
          'media',
          ['cd', 'admin']
        );
        this.viajesRamplas = [];
        this.palletsPorPlanta = [];
        this.reporteGenerado = true;
        return;
      }

      // Procesar datos para tabla de viajes
      this.procesarViajesRamplas(tickets);

      // Procesar datos para tabla de pallets por planta
      this.procesarPalletsPorPlanta(tickets);

      // Calcular totales
      this.calcularTotales();

      this.reporteGenerado = true;
      this.notificationService.agregarNotificacion(
        `Reporte generado exitosamente: ${tickets.length} tickets procesados`,
        0,
        'success',
        'media',
        ['cd', 'admin']
      );

    } catch (error: any) {
      console.error('Error al generar reporte:', error);
      this.notificationService.agregarNotificacion(
        `Error al generar reporte: ${error.message}`,
        0,
        'error',
        'alta',
        ['cd', 'admin']
      );
    } finally {
      this.cargando = false;
    }
  }

  private procesarViajesRamplas(tickets: any[]): void {
    const viajesPorRampla = new Map<string, any[]>();

    // Agrupar viajes por rampla
    tickets.forEach(ticket => {
      if (ticket.rampla_asignada) {
        const nombreRampla = ticket.rampla_asignada.nombre;
        
        if (!viajesPorRampla.has(nombreRampla)) {
          viajesPorRampla.set(nombreRampla, []);
        }

        viajesPorRampla.get(nombreRampla)!.push({
          planta: ticket.nombre_planta || 'Sin nombre',
          muelle: ticket.muelle_planta,
          fecha: new Date(ticket.fecha_creacion),
          ticketId: ticket.id
        });
      }
    });

    // Convertir a array y ordenar viajes cronológicamente
    this.viajesRamplas = Array.from(viajesPorRampla.entries()).map(([rampla, viajes]) => ({
      rampla,
      viajes: viajes.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    })).sort((a, b) => a.rampla.localeCompare(b.rampla));
  }

  private procesarPalletsPorPlanta(tickets: any[]): void {
    const palletsPorPlanta = new Map<string, { cantidad: number; tickets: number }>();

    // Agrupar pallets por planta
    tickets.forEach(ticket => {
      if (ticket.nombre_planta && ticket.cantidad_pallets) {
        const planta = ticket.nombre_planta;
        
        if (!palletsPorPlanta.has(planta)) {
          palletsPorPlanta.set(planta, { cantidad: 0, tickets: 0 });
        }

        const data = palletsPorPlanta.get(planta)!;
        data.cantidad += ticket.cantidad_pallets;
        data.tickets += 1;
      }
    });

    // Convertir a array
    this.palletsPorPlanta = Array.from(palletsPorPlanta.entries()).map(([planta, data]) => ({
      planta,
      cantidadEnviada: data.cantidad,
      numeroTickets: data.tickets
    })).sort((a, b) => b.cantidadEnviada - a.cantidadEnviada);
  }

  private calcularTotales(): void {
    this.totalPallets = this.palletsPorPlanta.reduce((sum, p) => sum + p.cantidadEnviada, 0);
    this.totalTickets = this.palletsPorPlanta.reduce((sum, p) => sum + p.numeroTickets, 0);
    this.totalViajes = this.viajesRamplas.reduce((sum, v) => sum + v.viajes.length, 0);
  }

  exportarExcel(): void {
    if (!this.reporteGenerado || (this.viajesRamplas.length === 0 && this.palletsPorPlanta.length === 0)) {
      this.notificationService.agregarNotificacion(
        'No hay datos para exportar',
        0,
        'warning',
        'media',
        ['cd', 'admin']
      );
      return;
    }

    try {
      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();

      // 1. Hoja de Estadísticas Generales
      const statsData = [
        ['REPORTE DE OPERACIONES - CENTRO DE DISTRIBUCIÓN'],
        [],
        ['Período del Reporte'],
        ['Fecha Inicio:', this.fechaInicio ? this.fechaInicio.toLocaleDateString('es-CL') : ''],
        ['Hora Inicio:', this.horaInicio],
        ['Fecha Fin:', this.fechaFin ? this.fechaFin.toLocaleDateString('es-CL') : ''],
        ['Hora Fin:', this.horaFin],
        [],
        ['ESTADÍSTICAS GENERALES'],
        ['Total Pallets:', this.totalPallets],
        ['Total Tickets Finalizados:', this.totalTickets],
        ['Total Viajes Realizados:', this.totalViajes]
      ];
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Resumen');

      // 2. Hoja de Viajes por Rampla
      if (this.viajesRamplas.length > 0) {
        const viajesData: any[] = [
          ['VIAJES POR RAMPLA - CRONOLÓGICO'],
          [],
          ['Rampla', 'N° Viaje', 'Planta', 'Muelle', 'Fecha y Hora', 'Ticket ID']
        ];

        this.viajesRamplas.forEach(rampla => {
          rampla.viajes.forEach((viaje, index) => {
            viajesData.push([
              rampla.rampla,
              index + 1,
              viaje.planta,
              `Muelle ${viaje.muelle}`,
              viaje.fecha.toLocaleString('es-CL', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              viaje.ticketId
            ]);
          });
        });

        const viajesSheet = XLSX.utils.aoa_to_sheet(viajesData);
        XLSX.utils.book_append_sheet(workbook, viajesSheet, 'Viajes por Rampla');
      }

      // 3. Hoja de Pallets por Planta
      if (this.palletsPorPlanta.length > 0) {
        const palletsData: any[] = [
          ['CANTIDAD DE PALLETS POR PLANTA'],
          [],
          ['Planta', 'Cantidad Enviada', 'N° Tickets']
        ];

        this.palletsPorPlanta.forEach(planta => {
          palletsData.push([
            planta.planta,
            planta.cantidadEnviada,
            planta.numeroTickets
          ]);
        });

        // Agregar totales
        palletsData.push([]);
        palletsData.push([
          'TOTALES',
          this.totalPallets,
          this.totalTickets
        ]);

        const palletsSheet = XLSX.utils.aoa_to_sheet(palletsData);
        XLSX.utils.book_append_sheet(workbook, palletsSheet, 'Pallets por Planta');
      }

      // Generar nombre de archivo con fecha actual
      const fechaActual = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
      const nombreArchivo = `Reporte_CD_${fechaActual}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(workbook, nombreArchivo);

      this.notificationService.agregarNotificacion(
        'Reporte exportado exitosamente a Excel',
        0,
        'success',
        'media',
        ['cd', 'admin']
      );
    } catch (error: any) {
      console.error('Error al exportar a Excel:', error);
      this.notificationService.agregarNotificacion(
        `Error al exportar: ${error.message}`,
        0,
        'error',
        'alta',
        ['cd', 'admin']
      );
    }
  }

  limpiarReporte(): void {
    this.viajesRamplas = [];
    this.palletsPorPlanta = [];
    this.reporteGenerado = false;
    this.totalPallets = 0;
    this.totalTickets = 0;
    this.totalViajes = 0;
  }
}
