// src/app/models/models.ts

export type TipoRampla = 'frugon_cerrado' | 'cortina';
export type TipoTicket = 'Retiro pallets producción' | 'Solicitar Pallets vacíos';
export type MotivoBloqueo = 'Mantención' | 'Fuera de servicio';

export interface Rampla {
    id: number;
    nombre: string;
    tipo_rampla: TipoRampla;
    estado: 'Libre' | 'En Servicio';
    activo: boolean;
    motivo_bloqueo: string | null;
    ticket_actual_id: number | null;
    created_at?: string;
}

export interface Muelle {
    id: number;
    nombre: string;
    estado: 'Libre' | 'Ocupado';
    ticket_actual_id: number | null;
    activo: boolean;
    motivo_bloqueo: string | null;
    created_at?: string;
    updated_at?: string;
    // Relaciones
    ticket_actual?: {
        id: number;
        tipo_ticket: string;
        estado_actual: string;
        rampla_asignada?: {
            id: number;
            nombre: string;
            tipo_rampla: string;
        };
    };
}

export type EstadoTicket =
    | 'Solicitud Creada'
    | 'Pendiente Asignación'
    | 'Rampla Asignada'
    // Estados compartidos (retiro y envío)
    | 'Rampla en Tránsito'
    // Estados específicos de RETIRO 
    | 'Rampla en Planta'
    | 'Carga iniciada'
    | 'Fin de Carga'
    | 'Cargado - Espera Chofer'
    // Estados específicos de ENVÍO 
    | 'Rampla en Galpón'
    | 'Carga Iniciada Galpón'
    | 'Rampla Cargada - Tránsito CD'
    // Estados de descarga en CD
    | 'Asignada a Muelle CD'
    | 'Inicio Descarga'
    | 'Fin Descarga'
    | 'Libre'
    | 'Rechazada'
    | 'Cancelado por CD';

export interface Ticket {
    id: number;
    planta_user_id: string;
    cd_user_id: string | null;
    tipo_ticket: TipoTicket;
    cantidad_pallet: number;
    muelle_planta: number;
    nombre_planta: string | null;
    fecha_creacion: string;
    estado_actual: EstadoTicket;
    rampla_asignada_id: number | null;
    muelle_asignado_id: number | null; // Nuevo: referencia al muelle en CD
    fecha_alerta_cd: string | null;
    observacion_planta: string | null;
    observaciones: string | null; // Motivo de cancelación u observaciones
    muelle_cd_asignado: number | null;

    // Relaciones
    rampla_asignada?: Rampla;
    muelle_asignado?: Muelle; // Nuevo: relación con muelle
}

export interface Usuario {
    id: string;
    email: string;
    rol: 'planta' | 'cd' | 'admin' | 'galpon';
    nombre: string;
    nombre_planta: string | null;
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
    tipo_ticket: TipoTicket;
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