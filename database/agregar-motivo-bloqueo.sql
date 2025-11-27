-- Agregar columna motivo_bloqueo a las tablas ramplas y muelles
-- Esta columna almacenará el motivo por el cual una rampla o muelle está inactivo

-- Paso 1: Agregar columna motivo_bloqueo a la tabla ramplas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ramplas' 
        AND column_name = 'motivo_bloqueo'
    ) THEN
        ALTER TABLE ramplas ADD COLUMN motivo_bloqueo TEXT;
        RAISE NOTICE 'Columna motivo_bloqueo agregada a ramplas exitosamente';
    ELSE
        RAISE NOTICE 'La columna motivo_bloqueo ya existe en ramplas';
    END IF;
END $$;

-- Paso 2: Agregar columna motivo_bloqueo a la tabla muelles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'muelles' 
        AND column_name = 'motivo_bloqueo'
    ) THEN
        ALTER TABLE muelles ADD COLUMN motivo_bloqueo TEXT;
        RAISE NOTICE 'Columna motivo_bloqueo agregada a muelles exitosamente';
    ELSE
        RAISE NOTICE 'La columna motivo_bloqueo ya existe en muelles';
    END IF;
END $$;

-- Paso 3: Agregar constraint CHECK para validar los motivos permitidos en ramplas
ALTER TABLE ramplas 
DROP CONSTRAINT IF EXISTS ramplas_motivo_bloqueo_check;

ALTER TABLE ramplas 
ADD CONSTRAINT ramplas_motivo_bloqueo_check 
CHECK (motivo_bloqueo IS NULL OR motivo_bloqueo IN ('Mantención', 'Fuera de servicio'));

-- Paso 4: Agregar constraint CHECK para validar los motivos permitidos en muelles
ALTER TABLE muelles 
DROP CONSTRAINT IF EXISTS muelles_motivo_bloqueo_check;

ALTER TABLE muelles 
ADD CONSTRAINT muelles_motivo_bloqueo_check 
CHECK (motivo_bloqueo IS NULL OR motivo_bloqueo IN ('Mantención', 'Fuera de servicio'));

-- Paso 5: Comentarios para documentación
COMMENT ON COLUMN ramplas.motivo_bloqueo IS 'Motivo por el cual la rampla está inactiva. Valores permitidos: "Mantención", "Fuera de servicio". NULL cuando está activa.';
COMMENT ON COLUMN muelles.motivo_bloqueo IS 'Motivo por el cual el muelle está inactivo. Valores permitidos: "Mantención", "Fuera de servicio". NULL cuando está activo.';

-- Paso 6: Limpiar motivo_bloqueo cuando se reactive una rampla o muelle
-- Trigger para ramplas
CREATE OR REPLACE FUNCTION limpiar_motivo_rampla()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.activo = TRUE THEN
        NEW.motivo_bloqueo = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_limpiar_motivo_rampla ON ramplas;
CREATE TRIGGER trigger_limpiar_motivo_rampla
    BEFORE UPDATE ON ramplas
    FOR EACH ROW
    EXECUTE FUNCTION limpiar_motivo_rampla();

-- Trigger para muelles
CREATE OR REPLACE FUNCTION limpiar_motivo_muelle()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.activo = TRUE THEN
        NEW.motivo_bloqueo = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_limpiar_motivo_muelle ON muelles;
CREATE TRIGGER trigger_limpiar_motivo_muelle
    BEFORE UPDATE ON muelles
    FOR EACH ROW
    EXECUTE FUNCTION limpiar_motivo_muelle();

-- Verificación
DO $$
BEGIN
    RAISE NOTICE '✅ Script ejecutado exitosamente';
    RAISE NOTICE 'Columna motivo_bloqueo agregada a ramplas y muelles';
    RAISE NOTICE 'Constraints y triggers configurados correctamente';
    RAISE NOTICE 'Motivos permitidos: "Mantención", "Fuera de servicio"';
END $$;
