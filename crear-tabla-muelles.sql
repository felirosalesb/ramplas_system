-- ============================================
-- SCRIPT DE CREACIÓN DE TABLA MUELLES
-- Sistema de Gestión de Muelles para CD
-- ============================================

-- 1. CREAR TABLA MUELLES
CREATE TABLE IF NOT EXISTS muelles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'Libre' CHECK (estado IN ('Libre', 'Ocupado')),
    ticket_actual_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AGREGAR COLUMNA EN TABLA TICKETS
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS muelle_asignado_id INTEGER REFERENCES muelles(id) ON DELETE SET NULL;

-- 3. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_muelles_estado ON muelles(estado);
CREATE INDEX IF NOT EXISTS idx_muelles_activo ON muelles(activo);
CREATE INDEX IF NOT EXISTS idx_tickets_muelle_asignado ON tickets(muelle_asignado_id);

-- 4. TRIGGER PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_muelles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_muelles_timestamp
BEFORE UPDATE ON muelles
FOR EACH ROW
EXECUTE FUNCTION update_muelles_updated_at();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en la tabla muelles
ALTER TABLE muelles ENABLE ROW LEVEL SECURITY;

-- Política 1: Todos los usuarios autenticados pueden VER muelles
CREATE POLICY "Usuarios autenticados pueden ver muelles"
ON muelles FOR SELECT
TO authenticated
USING (true);

-- Política 2: Solo ADMIN puede CREAR muelles
CREATE POLICY "Solo admin puede crear muelles"
ON muelles FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador'
);

-- Política 3: Solo ADMIN puede ACTUALIZAR muelles
CREATE POLICY "Solo admin puede actualizar muelles"
ON muelles FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador'
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador'
);

-- Política 4: Solo ADMIN puede ELIMINAR muelles
CREATE POLICY "Solo admin puede eliminar muelles"
ON muelles FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador'
);

-- ============================================
-- FUNCIONES SQL AUXILIARES
-- ============================================

-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS asignar_muelle_automatico(INTEGER);
DROP FUNCTION IF EXISTS liberar_muelle(INTEGER);

-- Función: Asignar muelle automáticamente (primer muelle libre)
CREATE OR REPLACE FUNCTION asignar_muelle_automatico(p_ticket_id INTEGER)
RETURNS TABLE(muelle_id INTEGER, muelle_nombre VARCHAR) AS $$
DECLARE
    v_muelle_id INTEGER;
    v_muelle_nombre VARCHAR;
BEGIN
    -- Buscar primer muelle libre y activo
    SELECT id, nombre INTO v_muelle_id, v_muelle_nombre
    FROM muelles
    WHERE estado = 'Libre' 
      AND activo = true
    ORDER BY id
    LIMIT 1;

    -- Si no hay muelles disponibles, lanzar error
    IF v_muelle_id IS NULL THEN
        RAISE EXCEPTION 'No hay muelles disponibles';
    END IF;

    -- Actualizar el muelle
    UPDATE muelles
    SET estado = 'Ocupado',
        ticket_actual_id = p_ticket_id,
        updated_at = NOW()
    WHERE id = v_muelle_id;

    -- Actualizar el ticket
    UPDATE tickets
    SET muelle_asignado_id = v_muelle_id,
        estado_actual = 'Asignada a Muelle CD',
        fecha_actualizacion = NOW()
    WHERE id = p_ticket_id;

    -- Retornar información del muelle asignado
    RETURN QUERY SELECT v_muelle_id, v_muelle_nombre;
END;
$$ LANGUAGE plpgsql;

-- Función: Liberar muelle
CREATE OR REPLACE FUNCTION liberar_muelle(p_muelle_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_ticket_id INTEGER;
BEGIN
    -- Obtener el ticket actual del muelle
    SELECT ticket_actual_id INTO v_ticket_id
    FROM muelles
    WHERE id = p_muelle_id;

    -- Actualizar el muelle a estado Libre
    UPDATE muelles
    SET estado = 'Libre',
        ticket_actual_id = NULL,
        updated_at = NOW()
    WHERE id = p_muelle_id;

    -- Si había un ticket asignado, limpiar la referencia
    IF v_ticket_id IS NOT NULL THEN
        UPDATE tickets
        SET muelle_asignado_id = NULL
        WHERE id = v_ticket_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar 6 muelles por defecto
INSERT INTO muelles (nombre, estado, activo) VALUES
    ('Muelle 1', 'Libre', true),
    ('Muelle 2', 'Libre', true),
    ('Muelle 3', 'Libre', true),
    ('Muelle 4', 'Libre', true),
    ('Muelle 5', 'Libre', true),
    ('Muelle 6', 'Libre', true)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la tabla se creó correctamente
SELECT 
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'muelles';

-- Verificar que se agregó la columna en tickets
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'tickets' AND column_name = 'muelle_asignado_id';

-- Verificar los muelles creados
SELECT id, nombre, estado, activo FROM muelles ORDER BY id;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
