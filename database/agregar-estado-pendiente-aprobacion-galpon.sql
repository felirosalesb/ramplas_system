-- Script para agregar el nuevo estado "Pendiente Aprobación Galpón" al constraint de tickets
-- Fecha: 28 de Noviembre, 2025
-- Descripción: Agrega el estado intermedio para que Galpón apruebe solicitudes de pallets vacíos

-- Paso 1: Eliminar el constraint existente
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_estado_actual_check;

-- Paso 2: Crear el constraint actualizado con el nuevo estado en TICKETS
ALTER TABLE tickets 
ADD CONSTRAINT tickets_estado_actual_check 
CHECK (estado_actual IN (
    'Solicitud Creada',
    'Pendiente Aprobación Galpón',  -- NUEVO ESTADO
    'Pendiente Asignación',
    'Rampla Asignada',
    'Rampla en Tránsito',
    'Rampla en Planta',
    'Carga iniciada',
    'Fin de Carga',
    'Cargado - Espera Chofer',
    'Rampla en Galpón',
    'Carga Iniciada Galpón',
    'Rampla Cargada - Tránsito CD',
    'Asignada a Muelle CD',
    'Inicio Descarga',
    'Fin Descarga',
    'Libre',
    'Rechazada',
    'Cancelado por CD'
));

-- Paso 3: Eliminar el constraint de REGISTROS_TIEMPO
ALTER TABLE registros_tiempo 
DROP CONSTRAINT IF EXISTS registros_tiempo_estado_registrado_check;

-- Paso 4: Crear el constraint actualizado con el nuevo estado en REGISTROS_TIEMPO
ALTER TABLE registros_tiempo 
ADD CONSTRAINT registros_tiempo_estado_registrado_check 
CHECK (estado_registrado IN (
    'Solicitud Creada',
    'Pendiente Aprobación Galpón',  -- NUEVO ESTADO
    'Pendiente Asignación',
    'Rampla Asignada',
    'Rampla en Tránsito',
    'Rampla en Planta',
    'Carga iniciada',
    'Fin de Carga',
    'Cargado - Espera Chofer',
    'Rampla en Galpón',
    'Carga Iniciada Galpón',
    'Rampla Cargada - Tránsito CD',
    'Asignada a Muelle CD',
    'Inicio Descarga',
    'Fin Descarga',
    'Libre',
    'Rechazada',
    'Cancelado por CD'
));

-- Verificar que los constraints se aplicaron correctamente
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN ('tickets_estado_actual_check', 'registros_tiempo_estado_registrado_check')
ORDER BY conrelid::regclass;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Estado "Pendiente Aprobación Galpón" agregado exitosamente a tickets y registros_tiempo';
END $$;
