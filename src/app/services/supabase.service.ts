// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    Ticket,
    Rampla,
    RegistroTiempo,
    CreateTicketDTO,
    AsignarRamplaDTO,
    ConfirmarLlegadaDTO,
    EstadoTicket
} from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        console.log('Inicializando Supabase con:', {
            url: environment.supabaseUrl,
            keyLength: environment.supabaseKey?.length
        });

        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );

        this.supabase.auth.getUser().then(({ data }) => {
            console.log('Usuario inicial obtenido:', data.user?.id);
            this.currentUserSubject.next(data.user);
        });

        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            this.currentUserSubject.next(session?.user ?? null);
        });
    }

    // ==================== AUTENTICACIÓN ====================

    async signIn(email: string, password: string) {
        return await this.supabase.auth.signInWithPassword({ email, password });
    }

    async signOut() {
        return await this.supabase.auth.signOut();
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    async obtenerUsuarioPorId(userId: string) {
        console.log('Buscando usuario en tabla usuarios con ID:', userId);
        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error al obtener usuario de la tabla usuarios:', error);
            console.error('Detalles:', error.message, error.details, error.hint);
            return null;
        }

        console.log('Usuario encontrado:', data);
        return data;
    }

    // ==================== TICKETS ====================

    async crearTicketPlanta(dto: CreateTicketDTO): Promise<Ticket> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await this.supabase
            .from('tickets')
            .insert({
                planta_user_id: user.id,
                cantidad_pallet: dto.cantidad_pallet,
                muelle_planta: dto.muelle_planta,
                estado_actual: 'Pendiente Asignación',
                fecha_alerta_cd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        await this.registrarTiempo(data.id, 'Solicitud Creada', user.id);
        await this.registrarTiempo(data.id, 'Pendiente Asignación', user.id);

        return data;
    }

    async asignarRampla(dto: AsignarRamplaDTO): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Asignando rampla:', dto);

        const { data: rampla } = await this.supabase
            .from('ramplas')
            .select('estado')
            .eq('id', dto.rampla_id)
            .single();

        if (rampla?.estado !== 'Libre') {
            throw new Error('La rampla no está disponible');
        }

        console.log('Actualizando ticket ID:', dto.ticket_id);
        const { error: ticketError } = await this.supabase
            .from('tickets')
            .update({
                rampla_asignada_id: dto.rampla_id,
                cd_user_id: dto.cd_user_id,
                estado_actual: 'Rampla Asignada',
                fecha_alerta_cd: null
            })
            .eq('id', dto.ticket_id);

        if (ticketError) {
            console.error('ERROR al actualizar ticket:', ticketError);
            throw ticketError;
        }
        console.log('Ticket actualizado correctamente');

        console.log('Actualizando rampla ID:', dto.rampla_id);
        const { error: ramplaError } = await this.supabase
            .from('ramplas')
            .update({
                estado: 'En Servicio',
                ticket_actual_id: dto.ticket_id
            })
            .eq('id', dto.rampla_id);

        if (ramplaError) {
            console.error('ERROR al actualizar rampla:', ramplaError);
            throw ramplaError;
        }
        console.log('Rampla actualizada correctamente');

        await this.registrarTiempo(dto.ticket_id, 'Rampla Asignada', user.id);
        console.log('Asignación completada exitosamente');
    }

    async confirmarLlegadaRampla(dto: ConfirmarLlegadaDTO): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        let nuevoEstado: EstadoTicket;
        const updates: any = {};

        if (dto.accion === 'rechazar') {
            nuevoEstado = 'Rechazada';

            const { data: ticket } = await this.supabase
                .from('tickets')
                .select('rampla_asignada_id')
                .eq('id', dto.ticket_id)
                .single();

            if (ticket?.rampla_asignada_id) {
                await this.supabase
                    .from('ramplas')
                    .update({ estado: 'Libre', ticket_actual_id: null })
                    .eq('id', ticket.rampla_asignada_id);
            }

            updates.rampla_asignada_id = null;
            updates.estado_actual = 'Pendiente Asignación';
            updates.fecha_alerta_cd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        } else {
            nuevoEstado = 'Rampla en Planta';
            updates.estado_actual = nuevoEstado;

            if (dto.accion === 'aceptar_observacion' && dto.observacion) {
                updates.observacion_planta = dto.observacion;
            }
        }

        const { error } = await this.supabase
            .from('tickets')
            .update(updates)
            .eq('id', dto.ticket_id);

        if (error) throw error;

        await this.registrarTiempo(dto.ticket_id, nuevoEstado, user.id);
    }

    async cambiarEstadoTicket(ticketId: number, nuevoEstado: EstadoTicket): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { error } = await this.supabase
            .from('tickets')
            .update({ estado_actual: nuevoEstado })
            .eq('id', ticketId);

        if (error) throw error;

        await this.registrarTiempo(ticketId, nuevoEstado, user.id);

        if (nuevoEstado === 'Libre') {
            const { data: ticket } = await this.supabase
                .from('tickets')
                .select('rampla_asignada_id')
                .eq('id', ticketId)
                .single();

            if (ticket?.rampla_asignada_id) {
                await this.supabase
                    .from('ramplas')
                    .update({ estado: 'Libre', ticket_actual_id: null })
                    .eq('id', ticket.rampla_asignada_id);
            }
        }
    }

    async asignarMuelleCD(ticketId: number, muelle: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) {
            console.error('Usuario no autenticado al intentar asignar muelle');
            throw new Error('Usuario no autenticado');
        }

        console.log('=== SERVICE: Asignando muelle CD ===');
        console.log('Ticket ID:', ticketId);
        console.log('Muelle:', muelle);
        console.log('Usuario:', user.id);

        const { data, error } = await this.supabase
            .from('tickets')
            .update({
                muelle_cd_asignado: muelle,
                estado_actual: 'Asignada a Muelle CD'
            })
            .eq('id', ticketId)
            .select();

        if (error) {
            console.error('❌ Error en UPDATE de tickets:', error);
            console.error('Código:', error.code);
            console.error('Mensaje:', error.message);
            console.error('Detalles:', error.details);
            throw error;
        }

        console.log('✅ Ticket actualizado:', data);

        await this.registrarTiempo(ticketId, 'Asignada a Muelle CD', user.id);
        console.log('✅ Tiempo registrado');
        console.log('=== SERVICE: Muelle CD asignado correctamente ===');
    }

    async iniciarDescarga(ticketId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Iniciando descarga del ticket:', ticketId);

        const { error } = await this.supabase
            .from('tickets')
            .update({
                estado_actual: 'Inicio Descarga'
            })
            .eq('id', ticketId);

        if (error) {
            console.error('Error al iniciar descarga:', error);
            throw error;
        }

        await this.registrarTiempo(ticketId, 'Inicio Descarga', user.id);
        console.log('Descarga iniciada correctamente');
    }

    async finalizarDescarga(ticketId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Finalizando descarga del ticket:', ticketId);

        // Obtener el ticket para liberar la rampla
        const { data: ticket } = await this.supabase
            .from('tickets')
            .select('rampla_asignada_id')
            .eq('id', ticketId)
            .single();

        // Actualizar estado del ticket a Libre
        const { error: ticketError } = await this.supabase
            .from('tickets')
            .update({
                estado_actual: 'Libre'
            })
            .eq('id', ticketId);

        if (ticketError) {
            console.error('Error al finalizar descarga:', ticketError);
            throw ticketError;
        }

        // Liberar la rampla
        if (ticket?.rampla_asignada_id) {
            const { error: ramplaError } = await this.supabase
                .from('ramplas')
                .update({
                    estado: 'Libre',
                    ticket_actual_id: null
                })
                .eq('id', ticket.rampla_asignada_id);

            if (ramplaError) {
                console.error('Error al liberar rampla:', ramplaError);
                throw ramplaError;
            }
            console.log('Rampla liberada correctamente');
        }

        await this.registrarTiempo(ticketId, 'Fin Descarga', user.id);
        await this.registrarTiempo(ticketId, 'Libre', user.id);
        console.log('Descarga finalizada y ticket liberado correctamente');
    }

    async finalizarCarga(ticketId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Finalizando carga del ticket:', ticketId);

        // Primero registrar "Fin de Carga"
        await this.registrarTiempo(ticketId, 'Fin de Carga', user.id);

        // Luego cambiar automáticamente a "Cargado - Espera Chofer"
        const { error } = await this.supabase
            .from('tickets')
            .update({
                estado_actual: 'Cargado - Espera Chofer',
                fecha_alerta_cd: new Date().toISOString() // Marcar cuándo llegó a bodega
            })
            .eq('id', ticketId);

        if (error) {
            console.error('Error al finalizar carga:', error);
            throw error;
        }

        await this.registrarTiempo(ticketId, 'Cargado - Espera Chofer', user.id);

        // Crear notificación para todos los usuarios CD
        const { data: usuariosCD } = await this.supabase
            .from('usuarios')
            .select('id')
            .eq('rol', 'cd');

        if (usuariosCD && usuariosCD.length > 0) {
            const notificaciones = usuariosCD.map(u => ({
                usuario_id: u.id,
                ticket_id: ticketId,
                tipo: 'warning',
                mensaje: `Rampla cargada en tránsito a bodega - Ticket #${ticketId}`,
                leido: false
            }));

            await this.supabase
                .from('notificaciones')
                .insert(notificaciones);
        }

        console.log('Carga finalizada, ticket en tránsito a bodega, CD notificado');
    }

    async getTicketById(ticketId: number): Promise<Ticket | null> {
        const { data, error } = await this.supabase
            .from('tickets')
            .select(`
                *,
                rampla_asignada:ramplas(*)
            `)
            .eq('id', ticketId)
            .single();

        if (error) throw error;
        return data;
    }

    async getTicketsByUsuario(userId: string): Promise<Ticket[]> {
        const { data, error } = await this.supabase
            .from('tickets')
            .select(`
                *,
                rampla_asignada:ramplas(*)
            `)
            .or(`planta_user_id.eq.${userId},cd_user_id.eq.${userId}`)
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async verificarAlertasPendientes(): Promise<Ticket[]> {
        const ahora = new Date().toISOString();

        const { data, error } = await this.supabase
            .from('tickets')
            .select('*')
            .eq('estado_actual', 'Pendiente Asignación')
            .lte('fecha_alerta_cd', ahora);

        if (error) throw error;
        return data || [];
    }

    async getRamplaById(ramplaId: number): Promise<Rampla | null> {
        const { data, error } = await this.supabase
            .from('ramplas')
            .select('*')
            .eq('id', ramplaId)
            .single();

        if (error) throw error;
        return data;
    }

    // ==================== CONSULTAS ====================

    async getTicketsActivos(): Promise<Ticket[]> {
        console.log('Consultando tickets activos...');
        const { data, error } = await this.supabase
            .from('tickets')
            .select('*')
            .neq('estado_actual', 'Libre')
            .order('fecha_creacion', { ascending: false });

        if (error) {
            console.error('Error en getTicketsActivos:', error);
            throw error;
        }
        console.log('Tickets activos obtenidos:', data?.length || 0);
        return data || [];
    }

    async getTicketsPendientesAsignacion(): Promise<Ticket[]> {
        console.log('Consultando tickets pendientes de asignación...');

        // Primero intentar obtener TODOS los tickets para debug
        const { data: allTickets, error: allError } = await this.supabase
            .from('tickets')
            .select('*');

        console.log('TODOS los tickets en DB:', allTickets?.length || 0, allTickets);

        const { data, error } = await this.supabase
            .from('tickets')
            .select('*')
            .eq('estado_actual', 'Pendiente Asignación')
            .order('fecha_creacion', { ascending: true });

        if (error) {
            console.error('Error en getTicketsPendientesAsignacion:', error);
            throw error;
        }
        console.log('Tickets pendientes encontrados:', data?.length || 0, data);
        return data || [];
    }

    async getRamplasLibres(): Promise<Rampla[]> {
        const { data, error } = await this.supabase
            .from('ramplas')
            .select('*')
            .eq('estado', 'Libre')
            .eq('activo', true)
            .order('id', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getAllRamplas(): Promise<Rampla[]> {
        const { data, error } = await this.supabase
            .from('ramplas')
            .select('*')
            .eq('activo', true)
            .order('id', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    // Para admin: ver todas las ramplas incluyendo inactivas
    async getAllRamplasAdmin(): Promise<Rampla[]> {
        const { data, error } = await this.supabase
            .from('ramplas')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async crearRampla(rampla: { nombre: string; tipo_rampla: string; activo: boolean }): Promise<Rampla> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Creando rampla:', rampla);

        const { data, error } = await this.supabase
            .from('ramplas')
            .insert({
                nombre: rampla.nombre,
                tipo_rampla: rampla.tipo_rampla,
                activo: rampla.activo,
                estado: 'Libre'
            })
            .select()
            .single();

        if (error) {
            console.error('Error al crear rampla:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe una rampla con ese nombre');
            }
            throw error;
        }

        console.log('Rampla creada:', data);
        return data;
    }

    async actualizarRampla(id: number, rampla: { nombre: string; tipo_rampla: string; activo: boolean }): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Actualizando rampla:', id, rampla);

        const { error } = await this.supabase
            .from('ramplas')
            .update({
                nombre: rampla.nombre,
                tipo_rampla: rampla.tipo_rampla,
                activo: rampla.activo,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error al actualizar rampla:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe una rampla con ese nombre');
            }
            throw error;
        }

        console.log('Rampla actualizada correctamente');
    }

    async cambiarEstadoActivoRampla(id: number, activo: boolean): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Cambiando estado activo de rampla:', id, activo);

        const { error } = await this.supabase
            .from('ramplas')
            .update({
                activo: activo,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error al cambiar estado:', error);
            throw error;
        }

        console.log('Estado de rampla actualizado');
    }

    async eliminarRampla(id: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Eliminando rampla:', id);

        // Verificar si la rampla está en uso
        const { data: ticketsActivos } = await this.supabase
            .from('tickets')
            .select('id')
            .eq('rampla_asignada_id', id)
            .neq('estado_actual', 'Libre');

        if (ticketsActivos && ticketsActivos.length > 0) {
            throw new Error('No se puede eliminar una rampla que está en uso');
        }

        const { error } = await this.supabase
            .from('ramplas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar rampla:', error);
            throw error;
        }

        console.log('Rampla eliminada correctamente');
    }

    async getRegistrosTiempo(ticketId: number): Promise<RegistroTiempo[]> {
        const { data, error } = await this.supabase
            .from('registros_tiempo')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('fecha_hora', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    // ==================== TIEMPO Y AUDITORÍA ====================

    private async registrarTiempo(
        ticketId: number,
        estado: EstadoTicket,
        usuarioId: string
    ): Promise<void> {
        const { error } = await this.supabase
            .from('registros_tiempo')
            .insert({
                ticket_id: ticketId,
                estado_registrado: estado,
                usuario_id: usuarioId
            });

        if (error) throw error;
    }

    // ==================== REALTIME SUBSCRIPTIONS ====================

    subscribeToTickets(callback: (payload: any) => void) {
        return this.supabase
            .channel('tickets-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets' },
                callback
            )
            .subscribe();
    }

    subscribeToRamplas(callback: (payload: any) => void) {
        return this.supabase
            .channel('ramplas-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ramplas' },
                callback
            )
            .subscribe();
    }
}