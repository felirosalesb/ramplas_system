-- Crear usuario Planta Pasta
-- IMPORTANTE: Primero debes crear el usuario en Supabase Auth con:
-- Email: planta.pasta@ramplas.com
-- Password: Planta123!
-- Luego reemplaza <UUID_GENERADO_POR_SUPABASE> con el UUID real
INSERT INTO usuarios (id, email, rol, nombre, nombre_planta)
VALUES (
        '<UUID_GENERADO_POR_SUPABASE>',
        -- Reemplazar con el UUID de Supabase Auth
        'planta.pasta@ramplas.com',
        'planta',
        'Planta Pasta',
        'pasta'
    );
-- Verificar que se creó correctamente
SELECT id,
    email,
    rol,
    nombre,
    nombre_planta
FROM usuarios
WHERE email = 'planta.pasta@ramplas.com';
-- Ver todos los usuarios de planta
SELECT id,
    email,
    rol,
    nombre,
    nombre_planta,
    created_at
FROM usuarios
WHERE rol = 'planta'
ORDER BY nombre_planta;