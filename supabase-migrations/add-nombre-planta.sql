-- Agregar columna nombre_planta a la tabla usuarios
-- Esta columna identifica la planta específica para usuarios con rol "planta"
-- Ejemplo: "costa", "pasta", etc.
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS nombre_planta VARCHAR(100);
-- Agregar comentario a la columna
COMMENT ON COLUMN usuarios.nombre_planta IS 'Nombre de la planta para usuarios con rol planta (costa, pasta, etc.). NULL para roles cd y administrador';
-- Agregar columna nombre_planta a la tabla tickets
-- Registra de qué planta proviene cada ticket
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS nombre_planta VARCHAR(100);
-- Agregar comentario
COMMENT ON COLUMN tickets.nombre_planta IS 'Nombre de la planta que generó el ticket';
-- Crear índice para mejorar consultas por nombre_planta en tickets
CREATE INDEX IF NOT EXISTS idx_tickets_nombre_planta ON tickets(nombre_planta);
-- Crear índice para mejorar consultas por nombre_planta en usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre_planta ON usuarios(nombre_planta);
-- Actualizar tickets existentes con el nombre_planta del usuario que los creó
UPDATE tickets t
SET nombre_planta = u.nombre_planta
FROM usuarios u
WHERE t.planta_user_id = u.id
    AND t.nombre_planta IS NULL
    AND u.nombre_planta IS NOT NULL;
-- Verificar cambios
SELECT table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('usuarios', 'tickets')
    AND column_name = 'nombre_planta';
-- Mostrar usuarios de planta con su nombre_planta
SELECT id,
    email,
    rol,
    nombre_planta
FROM usuarios
WHERE rol = 'planta'
ORDER BY nombre_planta;