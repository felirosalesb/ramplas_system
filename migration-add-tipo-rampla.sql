-- ==================================================
-- MIGRACIÓN: Agregar tipo_rampla y activo a tabla ramplas
-- ==================================================
-- IMPORTANTE: Antes de ejecutar este script, crear usuario admin:
-- 
-- 1. Ir a: Supabase Dashboard → Authentication → Users → Add user
-- 2. Crear usuario con:
--    - Email: admin@ramplas.com
--    - Password: Admin123!
-- 3. Copiar el UUID generado
-- 4. Ejecutar en SQL Editor:
--    INSERT INTO public.usuarios (id, email, rol, nombre) 
--    VALUES ('UUID-COPIADO-AQUI', 'admin@ramplas.com', 'admin', 'Administrador');
--
-- Luego ejecutar el resto de este script en Supabase SQL Editor
-- 1. Agregar columna tipo_rampla (temporal sin NOT NULL)
ALTER TABLE public.ramplas
ADD COLUMN IF NOT EXISTS tipo_rampla TEXT;
-- 2. Agregar columna activo
ALTER TABLE public.ramplas
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
-- 3. Actualizar ramplas existentes con valores por defecto
-- Alternando entre frugon_cerrado y cortina
UPDATE public.ramplas
SET tipo_rampla = CASE
        WHEN id % 2 = 0 THEN 'cortina'
        ELSE 'frugon_cerrado'
    END
WHERE tipo_rampla IS NULL;
-- 4. Ahora hacer tipo_rampla NOT NULL y agregar constraint
ALTER TABLE public.ramplas
ALTER COLUMN tipo_rampla
SET NOT NULL;
ALTER TABLE public.ramplas
ADD CONSTRAINT check_tipo_rampla CHECK (tipo_rampla IN ('frugon_cerrado', 'cortina'));
-- 5. Crear índice para activo
CREATE INDEX IF NOT EXISTS idx_ramplas_activo ON public.ramplas(activo);
-- 6. Verificar cambios
SELECT id,
    nombre,
    tipo_rampla,
    estado,
    activo
FROM public.ramplas
ORDER BY id;
-- ==================================================
-- POLÍTICAS RLS PARA RAMPLAS
-- ==================================================
-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver ramplas" ON public.ramplas;
DROP POLICY IF EXISTS "Admin puede modificar ramplas" ON public.ramplas;
-- Política SELECT: Todos los autenticados ven ramplas
CREATE POLICY "Usuarios autenticados pueden ver ramplas" ON public.ramplas FOR
SELECT TO authenticated USING (true);
-- Política INSERT: Solo admin puede crear ramplas
CREATE POLICY "Admin puede crear ramplas" ON public.ramplas FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol = 'admin'
        )
    );
-- Política UPDATE: Admin y sistema pueden actualizar
CREATE POLICY "Admin y sistema pueden actualizar ramplas" ON public.ramplas FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol IN ('admin', 'cd')
        )
    );
-- Política DELETE: Solo admin puede eliminar
CREATE POLICY "Admin puede eliminar ramplas" ON public.ramplas FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.usuarios
        WHERE id = auth.uid()
            AND rol = 'admin'
    )
);
-- ==================================================
-- VERIFICACIÓN
-- ==================================================
SELECT 'Migración completada exitosamente' as resultado;
SELECT tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'ramplas'
ORDER BY policyname;