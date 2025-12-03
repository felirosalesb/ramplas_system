-- Script para actualizar la constraint de estados en la tabla tickets
-- Ejecutar en Supabase SQL Editor
-- 1. Eliminar la constraint antigua
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_estado_actual_check;
-- 2. Crear la nueva constraint con los estados actualizados
ALTER TABLE tickets
ADD CONSTRAINT tickets_estado_actual_check CHECK (
        estado_actual IN (
            'Solicitud Creada',
            'Pendiente Aprobación Galpón',
            'Pendiente Asignación',
            'Rampla Asignada',
            -- Estados de tránsito específicos por destino
            'Rampla en Tránsito a Galpón',
            'Rampla en Tránsito a Planta',
            'Rampla en Tránsito',
            -- Mantener por compatibilidad
            -- Estados específicos de RETIRO 
            'Rampla en Planta',
            'Carga iniciada',
            'Fin de Carga',
            'Cargado - Espera Chofer',
            -- Estados específicos de ENVÍO 
            'Rampla en Galpón',
            'Carga Iniciada Galpón',
            'Rampla Cargada - Tránsito CD',
            -- Estados de descarga en CD
            'Asignada a Muelle CD',
            'Inicio Descarga',
            'Fin Descarga',
            'Libre',
            'Rechazada',
            'Cancelado por CD'
        )
    );
-- 3. Verificar que la constraint se creó correctamente
SELECT conname,
    pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'tickets'::regclass
    AND conname = 'tickets_estado_actual_check';