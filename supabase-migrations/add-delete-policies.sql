-- Política para permitir a usuarios de planta eliminar sus propios tickets
-- Solo si están en estado 'Pendiente Asignación'
-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Usuarios de planta pueden eliminar sus tickets pendientes" ON tickets;
-- Crear política para DELETE en tickets
CREATE POLICY "Usuarios de planta pueden eliminar sus tickets pendientes" ON tickets FOR DELETE TO authenticated USING (
    planta_user_id = auth.uid()
    AND estado_actual = 'Pendiente Asignación'
);
-- Política para permitir eliminar tiempos asociados a tickets propios
DROP POLICY IF EXISTS "Usuarios pueden eliminar tiempos de sus tickets" ON tiempos;
CREATE POLICY "Usuarios pueden eliminar tiempos de sus tickets" ON tiempos FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM tickets
        WHERE tickets.id = tiempos.ticket_id
            AND tickets.planta_user_id = auth.uid()
            AND tickets.estado_actual = 'Pendiente Asignación'
    )
);
-- Verificar políticas creadas
SELECT schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('tickets', 'registros_tiempo')
    AND (
        policyname LIKE '%eliminar%'
        OR policyname LIKE '%delete%'
    )
ORDER BY tablename,
    policyname;