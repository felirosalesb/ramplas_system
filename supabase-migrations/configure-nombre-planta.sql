-- Script para configurar nombre_planta en usuarios existentes
-- Este script debe ejecutarse después de add-nombre-planta.sql
-- Actualizar usuario planta existente (si existe)
-- Puedes cambiar 'costa' por el nombre que corresponda
UPDATE usuarios
SET nombre_planta = 'costa'
SET email = 'planta.costa@ramplas.com'
WHERE rol = 'planta'
    AND email LIKE 'planta%@ramplas.com'
    AND nombre_planta IS NULL;
-- Verificar usuarios de planta
SELECT id,
    email,
    rol,
    nombre,
    nombre_planta,
    created_at
FROM usuarios
WHERE rol = 'planta'
ORDER BY email;
-- EJEMPLOS para crear nuevos usuarios de planta:
-- Recuerda que estos usuarios deben crearse en Supabase Auth primero
/*
 -- Usuario Planta Costa
 INSERT INTO usuarios (id, email, rol, nombre, nombre_planta)
 VALUES (
 '<UUID_DE_SUPABASE_AUTH>',
 'planta.costa@ramplas.com',
 'planta',
 'Planta Costa',
 'costa'
 );
 
 -- Usuario Planta Pasta
 INSERT INTO usuarios (id, email, rol, nombre, nombre_planta)
 VALUES (
 '<UUID_DE_SUPABASE_AUTH>',
 'planta.pasta@ramplas.com',
 'planta',
 'Planta Pasta',
 'pasta'
 );
 */
-- Verificar tickets y su planta de origen
SELECT t.id,
    t.nombre_planta,
    t.estado_actual,
    t.muelle_planta,
    u.email as usuario_planta
FROM tickets t
    LEFT JOIN usuarios u ON t.planta_user_id = u.id
ORDER BY t.id DESC
LIMIT 20;