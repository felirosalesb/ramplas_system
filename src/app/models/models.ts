// src/app/models/models.ts

export type TipoRampla = 'frugon_cerrado' | 'cortina';

export interface Rampla {
    id: number;
    nombre: string;
    tipo_rampla: TipoRampla;
    estado: 'Libre' | 'En Servicio';
    activo: boolean;
    ticket_actual_id: number | null;
    created_at?: string;
}

export type EstadoTicket =
    | 'Solicitud Creada'
    | 'Pendiente Asignación'
    | 'Rampla Asignada'
    | 'Rampla en Planta'
    | 'Inicio de Carga'
    | 'Fin de Carga'
    | 'Cargado - Espera Chofer'
    | 'Asignada a Muelle CD'
    | 'Inicio Descarga'
    | 'Fin Descarga'
    | 'Libre'
    | 'Rechazada';

export interface Ticket {
    id: number;
    planta_user_id: string;
    cd_user_id: string | null;
    cantidad_pallet: number;
    muelle_planta: number;
    fecha_creacion: string;
    estado_actual: EstadoTicket;
    rampla_asignada_id: number | null;
    fecha_alerta_cd: string | null;
    observacion_planta: string | null;
    muelle_cd_asignado: number | null;

    // Relaciones
    rampla_asignada?: Rampla;
}

export interface Usuario {
    id: string;
    email: string;
    rol: 'planta' | 'cd' | 'admin';
    nombre: string;
    created_at?: string;
}

export interface RegistroTiempo {
    id: number;
    ticket_id: number;
    estado_registrado: EstadoTicket;
    fecha_hora: string;
    usuario_id: string;
}

export interface CreateTicketDTO {
    cantidad_pallet?: number;
    muelle_planta: number;
}

export interface AsignarRamplaDTO {
    ticket_id: number;
    rampla_id: number;
    cd_user_id: string;
}

export interface AsignarMuelleCDDTO {
    ticket_id: number;
    muelle_cd: number;
}

export interface ConfirmarLlegadaDTO {
    ticket_id: number;
    accion: 'aceptar' | 'aceptar_observacion' | 'rechazar';
    observacion?: string;
}

export interface NotificacionConfig {
    tipo: 'popup' | 'teams' | 'ambos';
    mensaje: string;
    usuario_destino: string;
    ticket_id: number;
}