-- Script para actualizar tickets existentes con nombre_planta
-- Este script asigna automáticamente el nombre_planta basándose en el usuario que creó el ticket
-- Actualizar tickets que no tienen nombre_planta asignado
UPDATE tickets t
SET nombre_planta = u.nombre_planta
FROM usuarios u
WHERE t.planta_user_id = u.id
    AND t.nombre_planta IS NULL
    AND u.nombre_planta IS NOT NULL;
-- Verificar tickets actualizados
SELECT t.id,
    t.nombre_planta,
    t.estado_actual,
    t.muelle_planta,
    u.email as usuario_email,
    u.nombre_planta as planta_usuario,
    t.fecha_creacion
FROM tickets t
    LEFT JOIN usuarios u ON t.planta_user_id = u.id
WHERE u.rol = 'planta'
ORDER BY t.id DESC
LIMIT 50;
-- Contar tickets por planta
SELECT nombre_planta,
    COUNT(*) as total_tickets,
    COUNT(
        CASE
            WHEN estado_actual IN (
                'Pendiente Asignación',
                'Rampla Asignada',
                'Rampla en Planta',
                'Inicio de Carga',
                'Fin de Carga'
            ) THEN 1
        END
    ) as tickets_activos,
    COUNT(
        CASE
            WHEN estado_actual = 'Libre' THEN 1
        END
    ) as tickets_completados
FROM tickets
WHERE nombre_planta IS NOT NULL
GROUP BY nombre_planta
ORDER BY nombre_planta;
-- Ver usuarios de planta y sus tickets
SELECT u.nombre_planta,
    u.email,
    COUNT(t.id) as total_tickets
FROM usuarios u
    LEFT JOIN tickets t ON t.nombre_planta = u.nombre_planta
WHERE u.rol = 'planta'
GROUP BY u.nombre_planta,
    u.email
ORDER BY u.nombre_planta;