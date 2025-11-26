-- =========================================================
-- DIAGNÓSTICO DE RAMPLAS Y TICKETS
-- =========================================================
-- Script para verificar el estado de las ramplas y tickets

-- VER TODOS LOS TICKETS ACTIVOS CON SU RAMPLA ASIGNADA
SELECT 
    '=== TICKETS ACTIVOS ===' as seccion,
    t.id as ticket_id,
    t.estado_actual,
    t.tipo_ticket,
    t.rampla_asignada_id,
    r.nombre as rampla_nombre,
    r.estado as rampla_estado,
    r.ticket_actual_id as rampla_ticket_actual
FROM public.tickets t
LEFT JOIN public.ramplas r ON t.rampla_asignada_id = r.id
WHERE t.estado_actual != 'Libre'
ORDER BY t.id;

-- VER TODAS LAS RAMPLAS Y SU ESTADO
SELECT 
    '=== TODAS LAS RAMPLAS ===' as seccion,
    r.id,
    r.nombre,
    r.estado,
    r.ticket_actual_id,
    r.activo,
    t.estado_actual as ticket_estado
FROM public.ramplas r
LEFT JOIN public.tickets t ON r.ticket_actual_id = t.id
ORDER BY r.id;

-- VERIFICAR INCONSISTENCIAS
SELECT 
    '=== INCONSISTENCIAS ===' as seccion,
    'Ramplas En Servicio sin ticket_actual_id' as problema,
    COUNT(*) as cantidad
FROM public.ramplas
WHERE estado = 'En Servicio' AND ticket_actual_id IS NULL

UNION ALL

SELECT 
    '=== INCONSISTENCIAS ===' as seccion,
    'Ramplas Libre con ticket_actual_id' as problema,
    COUNT(*) as cantidad
FROM public.ramplas
WHERE estado = 'Libre' AND ticket_actual_id IS NOT NULL

UNION ALL

SELECT 
    '=== INCONSISTENCIAS ===' as seccion,
    'Tickets con rampla_asignada_id pero rampla Libre' as problema,
    COUNT(*) as cantidad
FROM public.tickets t
JOIN public.ramplas r ON t.rampla_asignada_id = r.id
WHERE t.estado_actual != 'Libre' AND r.estado = 'Libre';

-- CONTEO GENERAL
SELECT 
    '=== RESUMEN ===' as seccion,
    'Total ramplas' as tipo,
    COUNT(*) as cantidad
FROM public.ramplas
WHERE activo = true

UNION ALL

SELECT 
    '=== RESUMEN ===' as seccion,
    'Ramplas libres' as tipo,
    COUNT(*) as cantidad
FROM public.ramplas
WHERE estado = 'Libre' AND activo = true

UNION ALL

SELECT 
    '=== RESUMEN ===' as seccion,
    'Ramplas en servicio' as tipo,
    COUNT(*) as cantidad
FROM public.ramplas
WHERE estado = 'En Servicio' AND activo = true

UNION ALL

SELECT 
    '=== RESUMEN ===' as seccion,
    'Tickets activos' as tipo,
    COUNT(*) as cantidad
FROM public.tickets
WHERE estado_actual != 'Libre';