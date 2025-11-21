-- ==================================================
-- ACTUALIZACIÓN DE NOMBRES DE ESTADOS
-- Cambios:
-- 1. "Inicio de Carga" → "Carga iniciada"
-- 2. "Cargado - Espera Chofer" → "Rampla cargada"
-- ==================================================

-- PASO 1: Actualizar registros existentes en la tabla tickets
UPDATE public.tickets
SET estado_actual = 'Carga iniciada'
WHERE estado_actual = 'Inicio de Carga';

UPDATE public.tickets
SET estado_actual = 'Rampla cargada'
WHERE estado_actual = 'Cargado - Espera Chofer';

-- PASO 2: Actualizar registros históricos en la tabla registros_tiempo
UPDATE public.registros_tiempo
SET estado_registrado = 'Carga iniciada'
WHERE estado_registrado = 'Inicio de Carga';

UPDATE public.registros_tiempo
SET estado_registrado = 'Rampla cargada'
WHERE estado_registrado = 'Cargado - Espera Chofer';

-- PASO 3: Eliminar el constraint CHECK existente
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_estado_actual_check;

-- PASO 4: Agregar el nuevo constraint CHECK con los nombres actualizados
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_estado_actual_check 
CHECK (estado_actual IN (
    'Solicitud Creada',
    'Pendiente Asignación',
    'Rampla Asignada',
    'Rampla en Planta',
    'Carga iniciada',
    'Fin de Carga',
    'Rampla cargada',
    'Asignada a Muelle CD',
    'Inicio Descarga',
    'Fin Descarga',
    'Libre',
    'Rechazada'
));

-- ==================================================
-- VERIFICACIÓN
-- ==================================================
-- Contar registros actualizados
SELECT 
    'tickets actualizados' as tabla,
    COUNT(*) as cantidad
FROM public.tickets
WHERE estado_actual IN ('Carga iniciada', 'Rampla cargada')

UNION ALL

SELECT 
    'registros_tiempo actualizados' as tabla,
    COUNT(*) as cantidad
FROM public.registros_tiempo
WHERE estado_registrado IN ('Carga iniciada', 'Rampla cargada');

-- Verificar que no queden estados antiguos
SELECT 
    'Verificación: Estados antiguos restantes' as mensaje,
    COUNT(*) as cantidad
FROM (
    SELECT estado_actual FROM public.tickets
    WHERE estado_actual IN ('Inicio de Carga', 'Cargado - Espera Chofer')
    UNION ALL
    SELECT estado_registrado FROM public.registros_tiempo
    WHERE estado_registrado IN ('Inicio de Carga', 'Cargado - Espera Chofer')
) AS verificacion;

-- ==================================================
-- ✅ Script completado
-- ==================================================
SELECT '✅ Actualización de estados completada exitosamente' as resultado;
