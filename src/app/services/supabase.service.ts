// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    Ticket,
    Rampla,
    Muelle,
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
        if (!user) {
            console.error('Usuario no autenticado');
            throw new Error('Usuario no autenticado');
        }

        console.log('=== CREAR TICKET PLANTA ===');
        console.log('Usuario:', user.id);
        console.log('DTO recibido:', dto);

        // Obtener nombre_planta del usuario actual
        const { data: userData, error: userError } = await this.supabase
            .from('usuarios')
            .select('nombre_planta')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.error('Error al obtener datos del usuario:', userError);
            throw new Error('No se pudo obtener información del usuario');
        }

        console.log('Datos del usuario:', userData);

        const ticketData = {
            planta_user_id: user.id,
            tipo_ticket: dto.tipo_ticket,
            cantidad_pallet: dto.cantidad_pallet || 1,
            muelle_planta: dto.muelle_planta,
            nombre_planta: userData?.nombre_planta || null,
            estado_actual: 'Pendiente Asignación',
            fecha_alerta_cd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        };

        console.log('Datos a insertar:', ticketData);
        console.log('tipo_ticket valor exacto:', dto.tipo_ticket);
        console.log('tipo_ticket longitud:', dto.tipo_ticket.length);
        console.log('tipo_ticket charCodes:', Array.from(dto.tipo_ticket).map(c => c.charCodeAt(0)));

        const { data, error } = await this.supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();

        console.log('Resultado insert:', { data, error });

        if (error) {
            console.error('Error al insertar ticket:', error);
            throw error;
        }

        if (!data) {
            console.error('No se recibió data del insert');
            throw new Error('No se pudo crear el ticket');
        }

        console.log('Ticket creado, registrando tiempos...');
        await this.registrarTiempo(data.id, 'Solicitud Creada', user.id);
        await this.registrarTiempo(data.id, 'Pendiente Asignación', user.id);
        console.log('Tiempos registrados correctamente');

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
                estado_actual: 'Rampla en Tránsito',
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

        await this.registrarTiempo(dto.ticket_id, 'Rampla en Tránsito', user.id);
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
            // Cambio: Confirmar llegada ahora pasa directo a "Carga iniciada"
            nuevoEstado = 'Carga iniciada';
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

        // Registrar ambos estados para mantener historial
        await this.registrarTiempo(dto.ticket_id, 'Rampla en Planta', user.id);
        await this.registrarTiempo(dto.ticket_id, nuevoEstado, user.id);
    }

    async actualizarMuellePlanta(ticketId: number, nuevoMuellePlanta: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('=== ACTUALIZAR MUELLE PLANTA ===');
        console.log('Ticket ID:', ticketId);
        console.log('Nuevo Muelle Planta:', nuevoMuellePlanta);
        console.log('Usuario:', user.id);

        // Verificar que el ticket pertenece al usuario y está en estado Pendiente Asignación
        const { data: ticket, error: fetchError } = await this.supabase
            .from('tickets')
            .select('planta_user_id, estado_actual')
            .eq('id', ticketId)
            .single();

        console.log('Ticket encontrado:', ticket);

        if (fetchError) {
            console.error('Error al buscar ticket:', fetchError);
            throw new Error('No se pudo encontrar el ticket');
        }
        if (ticket.planta_user_id !== user.id) {
            throw new Error('No tiene permisos para editar este ticket');
        }
        if (ticket.estado_actual !== 'Pendiente Asignación') {
            throw new Error('Solo se pueden editar tickets en estado Pendiente Asignación');
        }

        // Actualizar el muelle_planta
        const { error: updateError } = await this.supabase
            .from('tickets')
            .update({ muelle_planta: nuevoMuellePlanta })
            .eq('id', ticketId);

        if (updateError) {
            console.error('Error al actualizar muelle_planta:', updateError);
            throw new Error('Error al actualizar el muelle de planta');
        }

        console.log('✅ Muelle de planta actualizado exitosamente');
    }

    async cancelarTicket(ticketId: number, motivoCancelacion: string): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('=== CANCELAR TICKET (ROL CD) ===');
        console.log('Ticket ID:', ticketId);
        console.log('Motivo:', motivoCancelacion);
        console.log('Usuario:', user.id);

        try {
            // Verificar que el ticket existe y está en estado "Rampla en Tránsito"
            const { data: ticket, error: fetchError } = await this.supabase
                .from('tickets')
                .select('id, estado_actual, planta_user_id, rampla_asignada_id, muelle_asignado_id')
                .eq('id', ticketId)
                .single();

            console.log('Ticket encontrado:', ticket);
            console.log('Error al buscar:', fetchError);

            if (fetchError) {
                console.error('❌ Error al buscar ticket:', fetchError);
                throw new Error(`No se pudo encontrar el ticket: ${fetchError.message}`);
            }
            if (!ticket) {
                throw new Error('Ticket no encontrado');
            }
            if (ticket.estado_actual !== 'Rampla en Tránsito') {
                throw new Error(`Solo se pueden cancelar tickets en estado "Rampla en Tránsito". Estado actual: ${ticket.estado_actual}`);
            }

            // Cambiar estado del ticket a "Cancelado por CD"
            console.log('Actualizando estado del ticket...');
            const { data: ticketActualizado, error: updateTicketError } = await this.supabase
                .from('tickets')
                .update({
                    estado_actual: 'Cancelado por CD',
                    observaciones: motivoCancelacion
                })
                .eq('id', ticketId)
                .select();

            console.log('Ticket actualizado:', ticketActualizado);
            console.log('Error al actualizar:', updateTicketError);

            if (updateTicketError) {
                console.error('❌ Error al actualizar ticket:', updateTicketError);
                throw new Error(`Error al cancelar el ticket: ${updateTicketError.message}`);
            }

            // Liberar la rampla asignada
            if (ticket.rampla_asignada_id) {
                console.log('Liberando rampla:', ticket.rampla_asignada_id);
                const { error: ramplaError } = await this.supabase
                    .from('ramplas')
                    .update({
                        estado: 'Libre',
                        ticket_actual_id: null
                    })
                    .eq('id', ticket.rampla_asignada_id);

                if (ramplaError) {
                    console.error('⚠️ Error al liberar rampla:', ramplaError);
                    console.error('⚠️ Detalle del error:', ramplaError);
                    throw ramplaError; // Lanzar error para notificar el problema
                }
                console.log('✅ Rampla liberada correctamente:', ticket.rampla_asignada_id);
            }

            // Liberar el muelle CD asignado (si existe)
            if (ticket.muelle_asignado_id) {
                console.log('Liberando muelle CD:', ticket.muelle_asignado_id);
                const { error: muelleError } = await this.supabase
                    .from('muelles')
                    .update({
                        estado: 'Libre',
                        ticket_actual_id: null
                    })
                    .eq('id', ticket.muelle_asignado_id);

                if (muelleError) {
                    console.error('⚠️ Error al liberar muelle CD:', muelleError);
                    // No lanzar error, solo advertencia
                }
            }

            console.log('✅ Ticket cancelado exitosamente');
        } catch (error: any) {
            console.error('❌ Error en cancelarTicket:', error);
            throw error;
        }
    }

    async eliminarTicket(ticketId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('=== ELIMINAR TICKET ===');
        console.log('Ticket ID:', ticketId);
        console.log('Usuario:', user.id);

        // Verificar que el ticket pertenece al usuario y está en estado Pendiente Asignación
        const { data: ticket, error: fetchError } = await this.supabase
            .from('tickets')
            .select('planta_user_id, estado_actual')
            .eq('id', ticketId)
            .single();

        console.log('Ticket encontrado:', ticket);
        console.log('Error al buscar:', fetchError);

        if (fetchError) {
            console.error('Error al buscar ticket:', fetchError);
            throw new Error('No se pudo encontrar el ticket');
        }
        if (ticket.planta_user_id !== user.id) {
            throw new Error('No tiene permisos para eliminar este ticket');
        }
        if (ticket.estado_actual !== 'Pendiente Asignación') {
            throw new Error('Solo se pueden eliminar tickets en estado Pendiente Asignación');
        }

        // Eliminar registros de tiempos asociados
        console.log('Eliminando tiempos asociados...');
        const { error: tiemposError } = await this.supabase
            .from('registros_tiempo')
            .delete()
            .eq('ticket_id', ticketId);

        if (tiemposError) {
            console.error('Error al eliminar tiempos:', tiemposError);
            throw new Error('Error al eliminar registros de tiempos');
        }

        // Eliminar el ticket
        console.log('Eliminando ticket...');
        const { error: deleteError } = await this.supabase
            .from('tickets')
            .delete()
            .eq('id', ticketId);

        if (deleteError) {
            console.error('Error al eliminar ticket:', deleteError);
            throw new Error(deleteError.message || 'Error al eliminar el ticket');
        }

        console.log('Ticket eliminado correctamente');
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
            console.log('🔧 [cambiarEstadoTicket] Liberando rampla para ticket:', ticketId);
            const { data: ticket, error: selectError } = await this.supabase
                .from('tickets')
                .select('id, rampla_asignada_id, estado_actual')
                .eq('id', ticketId)
                .single();

            if (selectError) {
                console.error('❌ Error al obtener ticket para liberar rampla:', selectError);
                throw selectError;
            }

            console.log('📋 [cambiarEstadoTicket] Ticket info:', ticket);

            if (ticket?.rampla_asignada_id) {
                console.log('🔄 [cambiarEstadoTicket] Liberando rampla ID:', ticket.rampla_asignada_id);

                const { error: ramplaError, data: updateData } = await this.supabase
                    .from('ramplas')
                    .update({ estado: 'Libre', ticket_actual_id: null })
                    .eq('id', ticket.rampla_asignada_id)
                    .select();

                if (ramplaError) {
                    console.error('❌ [cambiarEstadoTicket] Error al liberar rampla:', ramplaError);
                    throw ramplaError;
                }
                console.log('✅ [cambiarEstadoTicket] Rampla liberada:', ticket.rampla_asignada_id, updateData);
            } else {
                console.log('ℹ️ [cambiarEstadoTicket] No hay rampla asignada para liberar');
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

        // Solo asigna el muelle y pasa a "Asignada a Muelle CD"
        // El usuario deberá hacer clic en "Iniciar Descarga" manualmente
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
            throw error;
        }

        console.log('✅ Ticket actualizado a Asignada a Muelle CD:', data);

        // Registrar estado
        await this.registrarTiempo(ticketId, 'Asignada a Muelle CD', user.id);
        console.log('✅ Muelle asignado correctamente. Esperando inicio de descarga.');
        console.log('=== SERVICE: Proceso completado ===');
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

        // Obtener rol del usuario para diagnóstico
        const { data: userData } = await this.supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();

        console.log('🔧 === FINALIZANDO DESCARGA (CD) ===');
        console.log('🔧 Ticket ID:', ticketId);
        console.log('👤 Usuario ID:', user.id);
        console.log('👤 Usuario rol:', userData?.rol || 'desconocido');

        // Obtener el ticket para liberar la rampla Y el muelle
        const { data: ticket, error: selectError } = await this.supabase
            .from('tickets')
            .select('rampla_asignada_id, muelle_asignado_id')
            .eq('id', ticketId)
            .single();

        if (selectError) {
            console.error('❌ Error al obtener ticket:', selectError);
            throw selectError;
        }

        console.log('📋 Ticket obtenido:', ticket);
        console.log('🚛 Rampla asignada ID:', ticket?.rampla_asignada_id);
        console.log('🏢 Muelle asignado ID:', ticket?.muelle_asignado_id);

        // Actualizar estado del ticket a Libre
        const { error: ticketError } = await this.supabase
            .from('tickets')
            .update({
                estado_actual: 'Libre'
            })
            .eq('id', ticketId);

        if (ticketError) {
            console.error('❌ Error al actualizar estado del ticket:', ticketError);
            console.error('❌ Detalle:', JSON.stringify(ticketError, null, 2));
            throw ticketError;
        }

        console.log('✅ Estado del ticket actualizado a Libre');

        // Liberar la rampla
        if (ticket?.rampla_asignada_id) {
            console.log('🔄 === LIBERANDO RAMPLA ===');
            console.log('🔄 Rampla ID:', ticket.rampla_asignada_id);

            // Ver estado ANTES
            const { data: ramplaAntes } = await this.supabase
                .from('ramplas')
                .select('id, nombre, estado, ticket_actual_id')
                .eq('id', ticket.rampla_asignada_id)
                .single();
            console.log('📊 Estado ANTES:', ramplaAntes);

            const { data: resultUpdate, error: ramplaError } = await this.supabase
                .from('ramplas')
                .update({
                    estado: 'Libre',
                    ticket_actual_id: null
                })
                .eq('id', ticket.rampla_asignada_id)
                .select();

            console.log('📝 Resultado UPDATE:', resultUpdate);

            if (ramplaError) {
                console.error('❌ Error al liberar rampla:', ramplaError);
                console.error('❌ Código:', ramplaError.code);
                console.error('❌ Mensaje:', ramplaError.message);
                console.error('❌ Detalle completo:', JSON.stringify(ramplaError, null, 2));
                throw ramplaError;
            }

            // Ver estado DESPUÉS
            const { data: ramplaDespues } = await this.supabase
                .from('ramplas')
                .select('id, nombre, estado, ticket_actual_id')
                .eq('id', ticket.rampla_asignada_id)
                .single();
            console.log('📊 Estado DESPUÉS:', ramplaDespues);

            if (ramplaDespues?.estado === 'Libre') {
                console.log('✅✅✅ RAMPLA LIBERADA EXITOSAMENTE');
            } else {
                console.error('❌❌❌ FALLO: Rampla NO se liberó. Estado actual:', ramplaDespues?.estado);
            }
        } else {
            console.warn('⚠️ No hay rampla asignada al ticket');
        }

        // Liberar el muelle si está asignado
        if (ticket?.muelle_asignado_id) {
            console.log('🔄 === LIBERANDO MUELLE ===');
            console.log('🔄 Muelle ID:', ticket.muelle_asignado_id);

            // Ver estado ANTES
            const { data: muelleAntes } = await this.supabase
                .from('muelles')
                .select('id, nombre, estado, ticket_actual_id')
                .eq('id', ticket.muelle_asignado_id)
                .single();
            console.log('📊 Muelle ANTES:', muelleAntes);

            const { data: resultUpdateMuelle, error: muelleError } = await this.supabase
                .from('muelles')
                .update({
                    estado: 'Libre',
                    ticket_actual_id: null
                })
                .eq('id', ticket.muelle_asignado_id)
                .select();

            console.log('📝 Resultado UPDATE muelle:', resultUpdateMuelle);

            if (muelleError) {
                console.error('❌ Error al liberar muelle:', muelleError);
                console.error('❌ Código:', muelleError.code);
                console.error('❌ Mensaje:', muelleError.message);
                throw muelleError;
            }

            // Ver estado DESPUÉS
            const { data: muelleDespues } = await this.supabase
                .from('muelles')
                .select('id, nombre, estado, ticket_actual_id')
                .eq('id', ticket.muelle_asignado_id)
                .single();
            console.log('📊 Muelle DESPUÉS:', muelleDespues);

            if (muelleDespues?.estado === 'Libre') {
                console.log('✅✅✅ MUELLE LIBERADO EXITOSAMENTE');
            } else {
                console.error('❌❌❌ FALLO: Muelle NO se liberó. Estado actual:', muelleDespues?.estado);
            }
        } else {
            console.warn('⚠️ No hay muelle asignado al ticket');
        }

        await this.registrarTiempo(ticketId, 'Fin Descarga', user.id);
        await this.registrarTiempo(ticketId, 'Libre', user.id);
        console.log('✅ Descarga finalizada, ticket liberado, rampla y muelle liberados');
        console.log('=== FIN FINALIZAR DESCARGA ===');
    }

    async finalizarCarga(ticketId: number, cantidadPallets: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        if (!cantidadPallets || cantidadPallets <= 0) {
            throw new Error('La cantidad de pallets debe ser mayor a 0');
        }

        console.log('Finalizando carga del ticket:', ticketId, 'con', cantidadPallets, 'pallets');

        // Primero registrar "Fin de Carga"
        await this.registrarTiempo(ticketId, 'Fin de Carga', user.id);

        // Luego cambiar automáticamente a "Cargado - Espera Chofer" y registrar cantidad de pallets
        const { error } = await this.supabase
            .from('tickets')
            .update({
                estado_actual: 'Cargado - Espera Chofer',
                fecha_alerta_cd: new Date().toISOString(), // Marcar cuándo llegó a bodega
                cantidad_pallets: cantidadPallets // Registrar cantidad de pallets cargados
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

    async finalizarCargaGalpon(ticketId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Finalizando carga en galpón del ticket:', ticketId);

        // Registrar "Fin de Carga" en galpón
        await this.registrarTiempo(ticketId, 'Fin de Carga', user.id);

        // Cambiar automáticamente a "Rampla Cargada - Tránsito CD"
        const { error } = await this.supabase
            .from('tickets')
            .update({
                estado_actual: 'Rampla Cargada - Tránsito CD',
                fecha_alerta_cd: new Date().toISOString()
            })
            .eq('id', ticketId);

        if (error) {
            console.error('Error al finalizar carga en galpón:', error);
            throw error;
        }

        await this.registrarTiempo(ticketId, 'Rampla Cargada - Tránsito CD', user.id);

        // Notificar a planta (quien solicitó el envío) que la rampla va en camino
        const { data: ticket } = await this.supabase
            .from('tickets')
            .select('planta_user_id')
            .eq('id', ticketId)
            .single();

        if (ticket) {
            await this.supabase
                .from('notificaciones')
                .insert({
                    usuario_id: ticket.planta_user_id,
                    ticket_id: ticketId,
                    tipo: 'info',
                    mensaje: `Rampla cargada en galpón. En tránsito a CD - Ticket #${ticketId}`,
                    leido: false
                });
        }

        console.log('Carga en galpón finalizada, rampla en tránsito a CD');
    }

    async finalizarDescargaYLiberarRampla(ticketId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Obtener rol del usuario desde la tabla usuarios
        const { data: userData } = await this.supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();

        console.log('🔧 === FINALIZANDO DESCARGA Y LIBERANDO RAMPLA ===');
        console.log('🔧 Ticket ID:', ticketId);
        console.log('👤 Usuario ID:', user.id);
        console.log('👤 Usuario rol:', userData?.rol || 'desconocido');

        // Registrar "Fin Descarga"
        await this.registrarTiempo(ticketId, 'Fin Descarga', user.id);

        // Obtener información completa del ticket
        const { data: ticket, error: ticketError } = await this.supabase
            .from('tickets')
            .select('id, rampla_asignada_id, planta_user_id, estado_actual, tipo_ticket')
            .eq('id', ticketId)
            .single();

        if (ticketError) {
            console.error('❌ Error al obtener ticket:', ticketError);
            console.error('❌ Detalle:', JSON.stringify(ticketError, null, 2));
            throw ticketError;
        }

        console.log('📋 Ticket obtenido:', ticket);
        console.log('📋 Tipo ticket:', ticket?.tipo_ticket);
        console.log('🚛 Rampla asignada ID:', ticket?.rampla_asignada_id);

        if (!ticket?.rampla_asignada_id) {
            console.warn('⚠️⚠️⚠️ El ticket no tiene rampla asignada');
        }

        // Actualizar ticket a 'Libre'
        const { error: updateError } = await this.supabase
            .from('tickets')
            .update({ estado_actual: 'Libre' })
            .eq('id', ticketId);

        if (updateError) {
            console.error('❌ Error al actualizar ticket:', updateError);
            console.error('❌ Detalle:', JSON.stringify(updateError, null, 2));
            throw updateError;
        }
        console.log('✅ Ticket actualizado a estado Libre');

        // Liberar la rampla
        if (ticket?.rampla_asignada_id) {
            console.log('🔄 === PROCESO DE LIBERACIÓN DE RAMPLA ===');
            console.log('🔄 Rampla ID a liberar:', ticket.rampla_asignada_id);

            // Verificar estado actual de la rampla antes de liberar
            const { data: ramplaAntes, error: errorAntes } = await this.supabase
                .from('ramplas')
                .select('id, nombre, estado, ticket_actual_id')
                .eq('id', ticket.rampla_asignada_id)
                .single();

            console.log('📊 Estado ANTES de liberar:', ramplaAntes);
            if (errorAntes) {
                console.error('⚠️ Error al leer estado anterior:', errorAntes);
            }

            const { data: resultUpdate, error: ramplaError } = await this.supabase
                .from('ramplas')
                .update({ estado: 'Libre', ticket_actual_id: null })
                .eq('id', ticket.rampla_asignada_id)
                .select();

            console.log('📝 Resultado del UPDATE rampla:', resultUpdate);

            if (ramplaError) {
                console.error('❌❌❌ Error al liberar rampla:', ramplaError);
                console.error('❌ Código de error:', ramplaError.code);
                console.error('❌ Mensaje:', ramplaError.message);
                console.error('❌ Detalles completos:', JSON.stringify(ramplaError, null, 2));
                console.error('❌ Hint:', ramplaError.hint);
                throw ramplaError;
            }

            // Verificar que se liberó correctamente
            const { data: ramplaDespues, error: errorDespues } = await this.supabase
                .from('ramplas')
                .select('id, nombre, estado, ticket_actual_id')
                .eq('id', ticket.rampla_asignada_id)
                .single();

            console.log('📊 Estado DESPUÉS de liberar:', ramplaDespues);
            if (errorDespues) {
                console.error('⚠️ Error al leer estado posterior:', errorDespues);
            }

            // Verificación explícita
            if (ramplaDespues?.estado === 'Libre') {
                console.log('✅✅✅ RAMPLA LIBERADA EXITOSAMENTE');
                console.log('✅ Rampla:', ramplaDespues.nombre, '- Estado:', ramplaDespues.estado);
            } else {
                console.error('❌❌❌ FALLO EN LIBERACIÓN DE RAMPLA');
                console.error('❌ Estado esperado: Libre');
                console.error('❌ Estado actual:', ramplaDespues?.estado);
                console.error('❌ ticket_actual_id:', ramplaDespues?.ticket_actual_id);
            }
        } else {
            console.log('ℹ️ No hay rampla asignada para liberar');
        }

        // Registrar estado final "Libre"
        await this.registrarTiempo(ticketId, 'Libre', user.id);

        console.log('🎉 Descarga finalizada y rampla liberada para ticket:', ticketId);
    }

    async getTicketById(ticketId: number): Promise<Ticket | null> {
        const { data, error } = await this.supabase
            .from('tickets')
            .select(`
                *,
                rampla_asignada:ramplas!rampla_asignada_id(*),
                muelle_asignado:muelles!muelle_asignado_id(*)
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
                rampla_asignada:ramplas!rampla_asignada_id(*),
                muelle_asignado:muelles!muelle_asignado_id(*)
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
            .select(`
                *,
                rampla_asignada:ramplas!rampla_asignada_id(*),
                muelle_asignado:muelles!muelle_asignado_id(*)
            `)
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

    // ==================== REPORTES ====================

    async getTicketsFinalizadosRango(fechaInicio: string, fechaFin: string): Promise<Ticket[]> {
        console.log('Consultando tickets finalizados en rango:', fechaInicio, 'a', fechaFin);

        const { data, error } = await this.supabase
            .from('tickets')
            .select(`
                *,
                rampla_asignada:ramplas!rampla_asignada_id(*)
            `)
            .gte('fecha_creacion', fechaInicio)
            .lte('fecha_creacion', fechaFin)
            .in('estado_actual', [
                'Fin Descarga',
                'Libre',
                'Cargado - Espera Chofer',
                'Asignada a Muelle CD',
                'Inicio Descarga'
            ])
            .not('cantidad_pallets', 'is', null) // Solo tickets con cantidad de pallets registrada
            .order('fecha_creacion', { ascending: true });

        if (error) {
            console.error('Error al obtener tickets finalizados:', error);
            throw error;
        }

        console.log('Tickets finalizados obtenidos:', data?.length || 0);
        return data || [];
    }

    // ==================== RAMPLAS ====================

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

    async cambiarEstadoActivoRampla(id: number, activo: boolean, motivoBloqueo: string | null = null): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Cambiando estado activo de rampla:', id, activo, motivoBloqueo);

        const updateData: any = {
            activo: activo,
            updated_at: new Date().toISOString()
        };

        // Si se está desactivando, agregar el motivo
        if (!activo && motivoBloqueo) {
            updateData.motivo_bloqueo = motivoBloqueo;
        }
        // Si se está activando, limpiar el motivo (aunque el trigger lo hace automáticamente)
        if (activo) {
            updateData.motivo_bloqueo = null;
        }

        const { error } = await this.supabase
            .from('ramplas')
            .update(updateData)
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
        console.log('📡 Iniciando suscripción Realtime a tabla tickets...');

        return this.supabase
            .channel('tickets-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets' },
                (payload) => {
                    console.log('✅ Evento Realtime recibido en tickets:', payload.eventType);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                console.log('📡 Estado de suscripción tickets:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Suscripción a tickets exitosa');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error en canal de tickets');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Timeout en suscripción de tickets');
                }
            });
    }

    subscribeToRamplas(callback: (payload: any) => void) {
        console.log('📡 Iniciando suscripción Realtime a tabla ramplas...');

        return this.supabase
            .channel('ramplas-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ramplas' },
                (payload) => {
                    console.log('✅ Evento Realtime recibido en ramplas:', payload.eventType);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                console.log('📡 Estado de suscripción ramplas:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Suscripción a ramplas exitosa');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error en canal de ramplas');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Timeout en suscripción de ramplas');
                }
            });
    }

    // ==================== GESTIÓN DE MUELLES ====================

    async getMuelles(): Promise<Muelle[]> {
        console.log('Obteniendo muelles con información de tickets y ramplas...');

        const { data, error } = await this.supabase
            .from('muelles')
            .select(`
                *,
                ticket_actual:tickets!ticket_actual_id(
                    id,
                    tipo_ticket,
                    estado_actual,
                    rampla_asignada:ramplas!rampla_asignada_id(
                        id,
                        nombre,
                        tipo_rampla
                    )
                )
            `)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error al obtener muelles:', error);
            throw error;
        }

        console.log('Muelles obtenidos con relaciones:', data?.length);
        return data || [];
    }

    async getMuelleById(id: number): Promise<Muelle | null> {
        const { data, error } = await this.supabase
            .from('muelles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async getMuellesLibres(): Promise<Muelle[]> {
        console.log('Obteniendo muelles libres...');

        const { data, error } = await this.supabase
            .from('muelles')
            .select('*')
            .eq('estado', 'Libre')
            .eq('activo', true)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error al obtener muelles libres:', error);
            throw error;
        }

        console.log('Muelles libres encontrados:', data?.length);
        return data || [];
    }

    async crearMuelle(muelle: { nombre: string; activo: boolean }): Promise<Muelle> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Creando muelle:', muelle);

        const { data, error } = await this.supabase
            .from('muelles')
            .insert({
                nombre: muelle.nombre,
                activo: muelle.activo,
                estado: 'Libre'
            })
            .select()
            .single();

        if (error) {
            console.error('Error al crear muelle:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe un muelle con ese nombre');
            }
            throw error;
        }

        console.log('Muelle creado:', data);
        return data;
    }

    async actualizarMuelle(id: number, muelle: { nombre: string; activo: boolean }): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Actualizando muelle:', id, muelle);

        const { error } = await this.supabase
            .from('muelles')
            .update({
                nombre: muelle.nombre,
                activo: muelle.activo,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error al actualizar muelle:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe un muelle con ese nombre');
            }
            throw error;
        }

        console.log('Muelle actualizado correctamente');
    }

    async cambiarEstadoActivoMuelle(id: number, activo: boolean, motivoBloqueo?: string): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Cambiando estado activo de muelle:', id, activo, motivoBloqueo);

        // Verificar que el muelle no esté ocupado antes de desactivar
        if (!activo) {
            const { data: muelle } = await this.supabase
                .from('muelles')
                .select('estado')
                .eq('id', id)
                .single();

            if (muelle?.estado === 'Ocupado') {
                throw new Error('No se puede desactivar un muelle ocupado');
            }
        }

        const updateData: any = {
            activo: activo,
            updated_at: new Date().toISOString()
        };

        // Si se está desactivando, incluir el motivo
        if (!activo && motivoBloqueo) {
            updateData.motivo_bloqueo = motivoBloqueo;
        }
        // Si se está activando, el trigger limpiará automáticamente el motivo

        const { error } = await this.supabase
            .from('muelles')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Error al cambiar estado activo de muelle:', error);
            throw error;
        }

        console.log('Estado activo de muelle cambiado correctamente');
    }

    async eliminarMuelle(id: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('Eliminando muelle:', id);

        // Verificar que el muelle esté libre antes de eliminar
        const { data: muelle } = await this.supabase
            .from('muelles')
            .select('estado')
            .eq('id', id)
            .single();

        if (muelle?.estado === 'Ocupado') {
            throw new Error('No se puede eliminar un muelle que está ocupado');
        }

        const { error } = await this.supabase
            .from('muelles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar muelle:', error);
            throw error;
        }

        console.log('Muelle eliminado correctamente');
    }

    async asignarMuelleATicket(ticketId: number, muelleId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('🏢 Asignando muelle', muelleId, 'al ticket', ticketId);

        // Verificar que el muelle esté libre
        const { data: muelle, error: muelleError } = await this.supabase
            .from('muelles')
            .select('estado')
            .eq('id', muelleId)
            .single();

        if (muelleError) {
            console.error('Error al verificar muelle:', muelleError);
            throw muelleError;
        }

        if (muelle?.estado !== 'Libre') {
            throw new Error('El muelle seleccionado no está disponible');
        }

        // Actualizar el muelle a Ocupado
        const { error: updateMuelleError } = await this.supabase
            .from('muelles')
            .update({
                estado: 'Ocupado',
                ticket_actual_id: ticketId
            })
            .eq('id', muelleId);

        if (updateMuelleError) {
            console.error('Error al actualizar muelle:', updateMuelleError);
            throw updateMuelleError;
        }

        // Actualizar el ticket con el muelle asignado
        const { error: updateTicketError } = await this.supabase
            .from('tickets')
            .update({
                muelle_asignado_id: muelleId,
                estado_actual: 'Asignada a Muelle CD'
            })
            .eq('id', ticketId);

        if (updateTicketError) {
            console.error('Error al actualizar ticket con muelle:', updateTicketError);
            throw updateTicketError;
        }

        await this.registrarTiempo(ticketId, 'Asignada a Muelle CD', user.id);
        console.log('✅ Muelle asignado exitosamente');
    }

    async asignarMuelleAutomatico(ticketId: number): Promise<Muelle> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('🤖 Asignando muelle automáticamente al ticket', ticketId);

        // Obtener el primer muelle libre
        const muellesLibres = await this.getMuellesLibres();

        if (muellesLibres.length === 0) {
            throw new Error('No hay muelles disponibles en este momento');
        }

        const muelleAsignado = muellesLibres[0];
        console.log('Muelle seleccionado automáticamente:', muelleAsignado.nombre);

        // Asignar el muelle
        await this.asignarMuelleATicket(ticketId, muelleAsignado.id);

        return muelleAsignado;
    }

    async liberarMuelle(muelleId: number): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        console.log('🔓 Liberando muelle:', muelleId);

        const { error } = await this.supabase
            .from('muelles')
            .update({
                estado: 'Libre',
                ticket_actual_id: null
            })
            .eq('id', muelleId);

        if (error) {
            console.error('Error al liberar muelle:', error);
            throw error;
        }

        console.log('✅ Muelle liberado correctamente');
    }

    subscribeToMuelles(callback: (payload: any) => void) {
        console.log('📡 Iniciando suscripción Realtime a tabla muelles...');

        return this.supabase
            .channel('muelles-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'muelles' },
                (payload) => {
                    console.log('✅ Evento Realtime recibido en muelles:', payload.eventType);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                console.log('📡 Estado de suscripción muelles:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Suscripción a muelles exitosa');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error en canal de muelles');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Timeout en suscripción de muelles');
                }
            });
    }
}