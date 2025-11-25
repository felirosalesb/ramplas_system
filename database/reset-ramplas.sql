-- Script para resetear estados de ramplas
-- Este script libera todas las ramplas que están marcadas como "En Servicio"
-- 1. Ver el estado actual de las ramplas
SELECT id,
    nombre,
    estado,
    ticket_actual_id
FROM ramplas
ORDER BY id;
-- 2. Liberar todas las ramplas que están "En Servicio"
UPDATE ramplas
SET estado = 'Libre',
    ticket_actual_id = NULL
WHERE estado = 'En Servicio';
-- 3. Verificar que todas las ramplas están libres
SELECT id,
    nombre,
    estado,
    ticket_actual_id
FROM ramplas
ORDER BY id;
-- 4. Contar ramplas por estado
SELECT estado,
    COUNT(*) as cantidad
FROM ramplas
GROUP BY estado;