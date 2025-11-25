// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NotificacionConfig } from '../models/models';

export interface PopupNotification {
    id: string;
    mensaje: string;
    ticket_id: number;
    timestamp: Date;
    leido: boolean;
    tipo: 'info' | 'warning' | 'success' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificacionesSubject = new BehaviorSubject<PopupNotification[]>([]);
    public notificaciones$ = this.notificacionesSubject.asObservable();

    // Webhook de Microsoft Teams (configurar en environment)
    private teamsWebhookUrl = '';

    constructor(
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private http: HttpClient
    ) {
        this.cargarNotificacionesGuardadas();
    }

    // ==================== NOTIFICACIONES POPUP ====================

    agregarNotificacion(
        mensaje: string,
        ticketId: number,
        tipo: 'info' | 'warning' | 'success' | 'error' = 'info'
    ): void {
        const notificaciones = this.notificacionesSubject.value;
        const nueva: PopupNotification = {
            id: `${Date.now()}-${ticketId}`,
            mensaje,
            ticket_id: ticketId,
            timestamp: new Date(),
            leido: false,
            tipo
        };

        notificaciones.unshift(nueva);
        this.notificacionesSubject.next(notificaciones);
        this.guardarNotificaciones();

        // Mostrar snackbar
        this.mostrarSnackbar(mensaje, tipo);

        // Reproducir sonido (opcional)
        this.reproducirSonido();
    }

    marcarComoLeida(notificacionId: string): void {
        const notificaciones = this.notificacionesSubject.value;
        const notificacion = notificaciones.find(n => n.id === notificacionId);
        if (notificacion) {
            notificacion.leido = true;
            this.notificacionesSubject.next([...notificaciones]);
            this.guardarNotificaciones();
        }
    }

    marcarTodasComoLeidas(): void {
        const notificaciones = this.notificacionesSubject.value;
        notificaciones.forEach(n => n.leido = true);
        this.notificacionesSubject.next([...notificaciones]);
        this.guardarNotificaciones();
    }

    eliminarNotificacion(notificacionId: string): void {
        const notificaciones = this.notificacionesSubject.value;
        const filtradas = notificaciones.filter(n => n.id !== notificacionId);
        this.notificacionesSubject.next(filtradas);
        this.guardarNotificaciones();
    }

    getNotificacionesNoLeidas(): number {
        return this.notificacionesSubject.value.filter(n => !n.leido).length;
    }

    private mostrarSnackbar(mensaje: string, tipo: string): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: [`snackbar-${tipo}`]
        });
    }

    private reproducirSonido(): void {
        // Opcional: reproducir sonido de notificación
        const audio = new Audio('assets/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignorar si el navegador bloquea el sonido
        });
    }

    // ==================== MICROSOFT TEAMS ====================

    async enviarNotificacionTeams(
        titulo: string,
        mensaje: string,
        ticketId: number,
        webhookUrl?: string
    ): Promise<void> {
        const url = webhookUrl || this.teamsWebhookUrl;

        if (!url) {
            console.warn('No se ha configurado el webhook de Microsoft Teams');
            return;
        }

        const card = {
            '@type': 'MessageCard',
            '@context': 'https://schema.org/extensions',
            themeColor: '0076D7',
            summary: titulo,
            sections: [
                {
                    activityTitle: titulo,
                    activitySubtitle: `Ticket #${ticketId}`,
                    facts: [
                        {
                            name: 'Mensaje:',
                            value: mensaje
                        },
                        {
                            name: 'Fecha:',
                            value: new Date().toLocaleString('es-CL')
                        }
                    ],
                    markdown: true
                }
            ],
            potentialAction: [
                {
                    '@type': 'OpenUri',
                    name: 'Ver Ticket',
                    targets: [
                        {
                            os: 'default',
                            uri: `${window.location.origin}/tickets/${ticketId}`
                        }
                    ]
                }
            ]
        };

        try {
            await this.http.post(url, card).toPromise();
        } catch (error) {
            console.error('Error al enviar notificación a Teams:', error);
        }
    }

    // ==================== MENSAJES ESPECÍFICOS DEL FLUJO ====================

    notificarNuevaSolicitud(ticketId: number, muellePlanta: number): void {
        const mensaje = `Nueva solicitud de retiro desde Muelle ${muellePlanta}`;
        this.agregarNotificacion(mensaje, ticketId, 'info');
        this.enviarNotificacionTeams(
            '🚨 Nueva Solicitud de Retiro',
            mensaje,
            ticketId
        );
    }

    notificarRamplaAsignada(ticketId: number, ramplaNombre: string): void {
        const mensaje = `Rampla ${ramplaNombre} asignada a tu solicitud`;
        this.agregarNotificacion(mensaje, ticketId, 'success');
        this.enviarNotificacionTeams(
            '✅ Rampla en Tránsito',
            mensaje,
            ticketId
        );
    }

    notificarFinCarga(ticketId: number, ramplaNombre: string): void {
        const mensaje = `Carga finalizada en ${ramplaNombre} - Ticket #${ticketId}`;
        this.agregarNotificacion(mensaje, ticketId, 'success');
        this.enviarNotificacionTeams(
            '📦 Carga Finalizada',
            mensaje,
            ticketId
        );
    }

    notificarAlertaPendiente(ticketId: number): void {
        const mensaje = `⚠️ URGENTE: Solicitud #${ticketId} lleva más de 2 horas sin asignar rampla`;
        this.agregarNotificacion(mensaje, ticketId, 'warning');
        this.enviarNotificacionTeams(
            '⏰ Alerta de Tiempo',
            mensaje,
            ticketId
        );
    }

    notificarRechazo(ticketId: number, observacion?: string): void {
        const mensaje = `Rampla rechazada para Ticket #${ticketId}${observacion ? ': ' + observacion : ''}`;
        this.agregarNotificacion(mensaje, ticketId, 'error');
        this.enviarNotificacionTeams(
            '❌ Rampla Rechazada',
            mensaje,
            ticketId
        );
    }

    // ==================== PERSISTENCIA LOCAL ====================

    private guardarNotificaciones(): void {
        const notificaciones = this.notificacionesSubject.value;
        // Guardar solo las últimas 50 notificaciones
        const limitadas = notificaciones.slice(0, 50);
        localStorage.setItem('notificaciones', JSON.stringify(limitadas));
    }

    private cargarNotificacionesGuardadas(): void {
        const guardadas = localStorage.getItem('notificaciones');
        if (guardadas) {
            try {
                const notificaciones = JSON.parse(guardadas);
                // Convertir timestamp strings a Date
                notificaciones.forEach((n: any) => {
                    n.timestamp = new Date(n.timestamp);
                });
                this.notificacionesSubject.next(notificaciones);
            } catch (error) {
                console.error('Error al cargar notificaciones:', error);
            }
        }
    }

    limpiarNotificacionesAntiguas(diasAtras: number = 7): void {
        const notificaciones = this.notificacionesSubject.value;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasAtras);

        const filtradas = notificaciones.filter(
            n => new Date(n.timestamp) > fechaLimite
        );

        this.notificacionesSubject.next(filtradas);
        this.guardarNotificaciones();
    }
}