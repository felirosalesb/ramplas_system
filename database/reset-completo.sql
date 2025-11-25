-- Script completo para resetear el sistema
-- CUIDADO: Este script eliminará todos los tickets y liberará todas las ramplas
-- ============================================
-- OPCIÓN 1: Solo liberar ramplas sin eliminar tickets
-- ============================================
-- Ver estado actual de ramplas
SELECT 'ESTADO ACTUAL DE RAMPLAS:' as info;
SELECT id,
    nombre,
    estado,
    ticket_actual_id
FROM ramplas
ORDER BY id;
-- Liberar todas las ramplas
UPDATE ramplas
SET estado = 'Libre',
    ticket_actual_id = NULL
WHERE estado = 'En Servicio';
-- Verificar ramplas liberadas
SELECT 'RAMPLAS DESPUÉS DEL RESET:' as info;
SELECT id,
    nombre,
    estado,
    ticket_actual_id
FROM ramplas
ORDER BY id;
-- ============================================
-- OPCIÓN 2: Reset completo (tickets + ramplas)
-- DESCOMENTA SOLO SI QUIERES ELIMINAR TODOS LOS TICKETS
-- ============================================
/*
 -- 1. Eliminar todas las notificaciones
 DELETE FROM notificaciones;
 
 -- 2. Eliminar todos los registros de tiempo
 DELETE FROM registros_tiempo;
 
 -- 3. Eliminar todos los tickets
 DELETE FROM tickets;
 
 -- 4. Liberar todas las ramplas
 UPDATE ramplas
 SET estado = 'Libre',
 ticket_actual_id = NULL;
 
 -- 5. Resetear secuencias
 ALTER SEQUENCE tickets_id_seq RESTART WITH 1;
 ALTER SEQUENCE notificaciones_id_seq RESTART WITH 1;
 
 -- 6. Verificar que todo está limpio
 SELECT 'Tickets restantes:' as tabla, COUNT(*) as cantidad FROM tickets
 UNION ALL
 SELECT 'Notificaciones restantes:' as tabla, COUNT(*) as cantidad FROM notificaciones
 UNION ALL
 SELECT 'Registros de tiempo restantes:' as tabla, COUNT(*) as cantidad FROM registros_tiempo
 UNION ALL
 SELECT 'Ramplas libres:' as tabla, COUNT(*) as cantidad FROM ramplas WHERE estado = 'Libre'
 UNION ALL
 SELECT 'Ramplas en servicio:' as tabla, COUNT(*) as cantidad FROM ramplas WHERE estado = 'En Servicio';
 */