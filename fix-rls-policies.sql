-- ==================================================
-- FIX: Políticas RLS para permitir que CD vea y actualice tickets
-- ==================================================
-- 1. Eliminar la política antigua de SELECT
DROP POLICY IF EXISTS "Usuarios pueden ver tickets relacionados" ON public.tickets;
-- 2. Crear nueva política de SELECT que permite:
--    - Planta ver sus propios tickets
--    - CD ver TODOS los tickets (para asignar ramplas)
--    - Admin ver todo
CREATE POLICY "Usuarios pueden ver tickets relacionados" ON public.tickets FOR
SELECT TO authenticated USING (
        planta_user_id = auth.uid() -- Planta ve sus tickets
        OR cd_user_id = auth.uid() -- CD ve tickets asignados a él
        OR EXISTS (
            -- CD/Admin ven todos los tickets
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol IN ('cd', 'admin')
        )
    );
-- 3. Eliminar la política antigua de UPDATE
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus tickets" ON public.tickets;
-- 4. Crear nueva política de UPDATE que permite:
--    - Planta actualizar sus propios tickets
--    - CD actualizar TODOS los tickets (para asignar ramplas y gestionar)
--    - Admin actualizar todo
CREATE POLICY "Usuarios pueden actualizar sus tickets" ON public.tickets FOR
UPDATE TO authenticated USING (
        planta_user_id = auth.uid() -- Planta actualiza sus tickets
        OR cd_user_id = auth.uid() -- CD actualiza tickets asignados a él
        OR EXISTS (
            -- CD/Admin actualizan todos los tickets
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol IN ('cd', 'admin')
        )
    );
-- ==================================================
-- 5. POLÍTICAS PARA REGISTROS_TIEMPO Y NOTIFICACIONES
-- ==================================================
-- Verificar que existe la política de INSERT para registros_tiempo
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'registros_tiempo'
        AND policyname = 'Sistema puede insertar registros_tiempo'
) THEN CREATE POLICY "Sistema puede insertar registros_tiempo" ON public.registros_tiempo FOR
INSERT TO authenticated WITH CHECK (true);
RAISE NOTICE 'Política de INSERT para registros_tiempo creada';
ELSE RAISE NOTICE 'Política de INSERT para registros_tiempo ya existe';
END IF;
END $$;
-- Verificar que existe la política de INSERT para notificaciones
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'notificaciones'
        AND policyname = 'Sistema puede crear notificaciones'
) THEN CREATE POLICY "Sistema puede crear notificaciones" ON public.notificaciones FOR
INSERT TO authenticated WITH CHECK (true);
RAISE NOTICE 'Política de INSERT para notificaciones creada';
ELSE RAISE NOTICE 'Política de INSERT para notificaciones ya existe';
END IF;
END $$;
-- ==================================================
-- VERIFICACIÓN
-- ==================================================
-- Ejecuta estas queries para verificar que funciona:
-- 1. Ver todas las políticas de la tabla tickets
SELECT schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('tickets', 'registros_tiempo', 'notificaciones')
ORDER BY tablename,
    policyname;
-- 2. Probar acceso (ejecutar como usuario CD)
-- SELECT * FROM tickets WHERE estado_actual = 'Pendiente Asignación';
-- 3. Probar actualización (ejecutar como usuario CD)
-- UPDATE tickets SET estado_actual = 'Rampla Asignada', muelle_cd_asignado = 1 WHERE id = 1;