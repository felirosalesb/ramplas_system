-- Script para actualizar email de usuario Planta a planta.costa@ramplas.com
-- Este cambio debe hacerse en DOS lugares:
-- PASO 1: Actualizar en Supabase Auth Dashboard
-- Ve a: Authentication → Users
-- Busca el usuario con email: planta@ramplas.com
-- Click en el usuario → Edit User
-- Cambiar email a: planta.costa@ramplas.com
-- Guardar cambios
-- PASO 2: Actualizar en tabla usuarios (ejecutar este SQL)
UPDATE usuarios
SET email = 'planta.costa@ramplas.com',
    nombre_planta = 'costa'
WHERE email = 'planta@ramplas.com';
-- Verificar el cambio
SELECT id,
    email,
    rol,
    nombre,
    nombre_planta
FROM usuarios
WHERE email = 'planta.costa@ramplas.com';
-- Ver todos los usuarios de planta actualizados
SELECT id,
    email,
    rol,
    nombre,
    nombre_planta,
    created_at
FROM usuarios
WHERE rol = 'planta'
ORDER BY nombre_planta;
-- IMPORTANTE: Si existen tickets creados por este usuario con el email anterior,
-- actualizar su nombre_planta para que sigan siendo visibles
UPDATE tickets
SET nombre_planta = 'costa'
WHERE planta_user_id = (
        SELECT id
        FROM usuarios
        WHERE email = 'planta.costa@ramplas.com'
    )
    AND nombre_planta IS NULL;
-- Verificar tickets actualizados
SELECT t.id,
    t.nombre_planta,
    t.estado_actual,
    u.email,
    t.fecha_creacion
FROM tickets t
    JOIN usuarios u ON t.planta_user_id = u.id
WHERE u.email = 'planta.costa@ramplas.com'
ORDER BY t.id DESC
LIMIT 20;