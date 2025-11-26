-- =========================================================
-- SCRIPT DE PRUEBA: FORZAR LIBERACIÓN DE RAMPLAS
-- =========================================================
-- Este script libera manualmente todas las ramplas que estén "En Servicio"

-- PASO 1: Ver estado actual
SELECT 
    'ANTES DE LA LIBERACIÓN' as momento,
    id,
    nombre,
    estado,
    ticket_actual_id
FROM public.ramplas
WHERE estado = 'En Servicio';

-- PASO 2: Liberar todas las ramplas manualmente
UPDATE public.ramplas
SET 
    estado = 'Libre',
    ticket_actual_id = NULL
WHERE estado = 'En Servicio';

-- PASO 3: Ver resultado
SELECT 
    'DESPUÉS DE LA LIBERACIÓN' as momento,
    id,
    nombre,
    estado,
    ticket_actual_id
FROM public.ramplas
ORDER BY id;

-- PASO 4: También marcar todos los tickets como libres para consistencia
UPDATE public.tickets
SET estado_actual = 'Libre'
WHERE estado_actual != 'Libre';

SELECT '✅ TODAS LAS RAMPLAS LIBERADAS MANUALMENTE' as resultado;