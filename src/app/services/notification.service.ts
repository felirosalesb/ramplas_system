// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NotificacionConfig } from '../models/models';

export type RolUsuario = 'planta' | 'cd' | 'admin' | 'galpon';
export type PrioridadNotificacion = 'baja' | 'media' | 'alta' | 'critica';

export interface PopupNotification {
    id: string;
    mensaje: string;
    ticket_id: number;
    timestamp: Date;
    leido: boolean;
    tipo: 'info' | 'warning' | 'success' | 'error';
    prioridad: PrioridadNotificacion;
    rolesDestino: RolUsuario[]; // Roles que deben ver esta notificación
    icono?: string; // Ícono Material para mostrar
    accion?: {
        texto: string;
        url: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificacionesSubject = new BehaviorSubject<PopupNotification[]>([]);
    public notificaciones$ = this.notificacionesSubject.asObservable();
    
    private notificacionesHabilitadas = false;
    private rolUsuarioActual: RolUsuario | null = null;

    // Webhook de Microsoft Teams (configurar en environment)
    private teamsWebhookUrl = '';

    constructor(
        private snackBar: MatSnackBar,
        private router: Router,
        private dialog: MatDialog,
        private http: HttpClient
    ) {
        this.cargarNotificacionesGuardadas();
        this.solicitarPermisoNotificaciones();
    }

    // ==================== CONFIGURACIÓN ====================

    setRolUsuario(rol: RolUsuario): void {
        this.rolUsuarioActual = rol;
        console.log('📋 Rol de usuario configurado:', rol);
    }

    async solicitarPermisoNotificaciones(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones de escritorio');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.notificacionesHabilitadas = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.notificacionesHabilitadas = permission === 'granted';
            return this.notificacionesHabilitadas;
        }

        return false;
    }

    // ==================== NOTIFICACIONES POPUP ====================

    agregarNotificacion(
        mensaje: string,
        ticketId: number,
        tipo: 'info' | 'warning' | 'success' | 'error' = 'info',
        prioridad: PrioridadNotificacion = 'media',
        rolesDestino: RolUsuario[] = ['planta', 'cd', 'admin', 'galpon'],
        icono?: string,
        accion?: { texto: string; url: string }
    ): void {
        // Filtrar por rol si está configurado
        if (this.rolUsuarioActual && !rolesDestino.includes(this.rolUsuarioActual)) {
            console.log('🚫 Notificación filtrada - No aplica para rol:', this.rolUsuarioActual);
            return;
        }

        const notificaciones = this.notificacionesSubject.value;
        const nueva: PopupNotification = {
            id: `${Date.now()}-${ticketId}`,
            mensaje,
            ticket_id: ticketId,
            timestamp: new Date(),
            leido: false,
            tipo,
            prioridad,
            rolesDestino,
            icono,
            accion
        };

        notificaciones.unshift(nueva);
        this.notificacionesSubject.next(notificaciones);
        this.guardarNotificaciones();

        // Mostrar snackbar con duración según prioridad
        const duracion = this.getDuracionPorPrioridad(prioridad);
        this.mostrarSnackbar(mensaje, tipo, duracion, icono);

        // Mostrar notificación nativa del navegador
        if (prioridad === 'alta' || prioridad === 'critica') {
            this.mostrarNotificacionNativa(mensaje, tipo, ticketId, accion);
        }

        // Reproducir sonido según prioridad
        this.reproducirSonido(prioridad);
        this.vibrarSiMovil(prioridad);
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

    getNotificacionesPorRol(): Observable<PopupNotification[]> {
        return this.notificaciones$.pipe(
            map((notificaciones: PopupNotification[]) =>
                notificaciones.filter((n: PopupNotification) =>
                    !this.rolUsuarioActual || n.rolesDestino?.includes(this.rolUsuarioActual)
                )
            )
        );
    }

    // ==================== NOTIFICACIONES NATIVAS ====================

    private mostrarNotificacionNativa(
        mensaje: string,
        tipo: 'info' | 'warning' | 'success' | 'error',
        ticketId: number,
        accion?: { texto: string; url: string }
    ): void {
        if (!this.notificacionesHabilitadas || Notification.permission !== 'granted') {
            return;
        }

        const iconos = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        const titulo = `${iconos[tipo]} Sistema de Ramplas`;
        
        const notification = new Notification(titulo, {
            body: mensaje,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `ticket-${ticketId}`,
            requireInteraction: tipo === 'error' || tipo === 'warning',
            silent: false
        });

        notification.onclick = () => {
            window.focus();
            if (accion?.url) {
                window.location.href = accion.url;
            }
            notification.close();
        };

        // Auto-cerrar después de 10 segundos si no es crítico
        if (tipo !== 'error' && tipo !== 'warning') {
            setTimeout(() => notification.close(), 10000);
        }
    }

    private getDuracionPorPrioridad(prioridad: PrioridadNotificacion): number {
        const duraciones = {
            critica: 0, // No se cierra automáticamente
            alta: 10000,
            media: 5000,
            baja: 3000
        };
        return duraciones[prioridad];
    }

    private mostrarSnackbar(
        mensaje: string,
        tipo: 'info' | 'warning' | 'success' | 'error',
        duracion: number = 5000,
        icono?: string
    ): void {
        const defaultIconos: Record<typeof tipo, string> = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        } as const;
        const iconoMostrar = icono || defaultIconos[tipo];
        const texto = `${iconoMostrar} ${mensaje}`;
        const ref = this.snackBar.open(texto, 'Cerrar', {
            duration: duracion === 0 ? undefined : duracion,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: [`snackbar-${tipo}`, 'snackbar-elevated']
        });
        // Cerrar sin navegación ni acciones
        ref.onAction().subscribe(() => ref.dismiss());
    }

    private reproducirSonido(prioridad: PrioridadNotificacion = 'media'): void {
        // Sonidos diferentes según prioridad
        const sonidos = {
            critica: 'assets/sounds/notification-critica.mp3',
            alta: 'assets/sounds/notification-alta.mp3',
            media: 'assets/sounds/notification.mp3',
            baja: 'assets/sounds/notification.mp3'
        };
        try {
            const audio = new Audio(sonidos[prioridad]);
            audio.volume = prioridad === 'critica' ? 0.7 : prioridad === 'alta' ? 0.5 : 0.3;
            void audio.play();
        } catch {
            // Silenciar errores por bloqueo del navegador o falta de archivo
        }
    }

    private vibrarSiMovil(prioridad: PrioridadNotificacion = 'media'): void {
        try {
            if (navigator?.vibrate) {
                if (prioridad === 'critica') {
                    navigator.vibrate([80, 60, 80, 60, 120]);
                } else if (prioridad === 'alta') {
                    navigator.vibrate([60, 40, 60]);
                } else if (prioridad === 'media') {
                    navigator.vibrate(40);
                }
            }
        } catch {}
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
        this.agregarNotificacion(
            mensaje,
            ticketId,
            'info',
            'alta',
            ['cd', 'admin'],
            '🚨'
        );
        this.enviarNotificacionTeams(
            '🚨 Nueva Solicitud de Retiro',
            mensaje,
            ticketId
        );
    }

    notificarRamplaAsignada(ticketId: number, ramplaNombre: string): void {
        const mensaje = `Rampla ${ramplaNombre} asignada a tu solicitud`;
        this.agregarNotificacion(
            mensaje,
            ticketId,
            'success',
            'media',
            ['planta', 'admin'],
            '✅'
        );
        this.enviarNotificacionTeams(
            '✅ Rampla en Tránsito',
            mensaje,
            ticketId
        );
    }

    notificarFinCarga(ticketId: number, ramplaNombre: string): void {
        const mensaje = `Carga finalizada en ${ramplaNombre} - Ticket #${ticketId}`;
        this.agregarNotificacion(
            mensaje,
            ticketId,
            'success',
            'media',
            ['planta', 'cd', 'admin'],
            '📦'
        );
        this.enviarNotificacionTeams(
            '📦 Carga Finalizada',
            mensaje,
            ticketId
        );
    }

    notificarAlertaPendiente(ticketId: number): void {
        const mensaje = `⚠️ URGENTE: Solicitud #${ticketId} lleva más de 2 horas sin asignar rampla`;
        this.agregarNotificacion(
            mensaje,
            ticketId,
            'warning',
            'critica',
            ['cd', 'admin'],
            '⚠️'
        );
        this.enviarNotificacionTeams(
            '⏰ Alerta de Tiempo',
            mensaje,
            ticketId
        );
    }

    notificarRechazo(ticketId: number, observacion?: string): void {
        const mensaje = `Rampla rechazada para Ticket #${ticketId}${observacion ? ': ' + observacion : ''}`;
        this.agregarNotificacion(
            mensaje,
            ticketId,
            'error',
            'alta',
            ['planta', 'cd', 'admin'],
            '❌'
        );
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