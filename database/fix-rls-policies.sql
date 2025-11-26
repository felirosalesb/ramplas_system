-- Script para verificar y corregir políticas RLS (Row Level Security)
-- Este script permite que los usuarios puedan crear y modificar tickets
-- ============================================
-- 1. Ver políticas actuales de la tabla tickets
-- ============================================
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'tickets';
-- ============================================
-- 2. Eliminar políticas existentes (si existen)
-- ============================================
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios tickets" ON tickets;
DROP POLICY IF EXISTS "Usuarios pueden insertar tickets" ON tickets;
DROP POLICY IF EXISTS "Usuarios pueden actualizar tickets" ON tickets;
DROP POLICY IF EXISTS "Usuarios pueden ver todos los tickets" ON tickets;
DROP POLICY IF EXISTS "Permitir INSERT para usuarios autenticados" ON tickets;
DROP POLICY IF EXISTS "Permitir UPDATE para usuarios autenticados" ON tickets;
DROP POLICY IF EXISTS "Permitir SELECT para usuarios autenticados" ON tickets;
-- ============================================
-- 3. Crear nuevas políticas permisivas
-- ============================================
-- Política para SELECT (ver tickets)
CREATE POLICY "Permitir SELECT para usuarios autenticados" ON tickets FOR
SELECT TO authenticated USING (true);
-- Política para INSERT (crear tickets)
CREATE POLICY "Permitir INSERT para usuarios autenticados" ON tickets FOR
INSERT TO authenticated WITH CHECK (true);
-- Política para UPDATE (actualizar tickets)
CREATE POLICY "Permitir UPDATE para usuarios autenticados" ON tickets FOR
UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Política para DELETE (eliminar tickets)
CREATE POLICY "Permitir DELETE para usuarios autenticados" ON tickets FOR DELETE TO authenticated USING (true);
-- ============================================
-- 4. Verificar que RLS está habilitado
-- ============================================
SELECT tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'tickets';
-- Si rowsecurity es false, descomentar la siguiente línea:
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- ============================================
-- 5. Repetir para otras tablas importantes
-- ============================================
-- Tabla ramplas
DROP POLICY IF EXISTS "Permitir SELECT para usuarios autenticados" ON ramplas;
DROP POLICY IF EXISTS "Permitir UPDATE para usuarios autenticados" ON ramplas;
CREATE POLICY "Permitir SELECT para usuarios autenticados" ON ramplas FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Permitir UPDATE para usuarios autenticados" ON ramplas FOR
UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Tabla registros_tiempo
DROP POLICY IF EXISTS "Permitir INSERT para usuarios autenticados" ON registros_tiempo;
DROP POLICY IF EXISTS "Permitir SELECT para usuarios autenticados" ON registros_tiempo;
CREATE POLICY "Permitir SELECT para usuarios autenticados" ON registros_tiempo FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Permitir INSERT para usuarios autenticados" ON registros_tiempo FOR
INSERT TO authenticated WITH CHECK (true);
-- Tabla notificaciones
DROP POLICY IF EXISTS "Permitir todas las operaciones" ON notificaciones;
CREATE POLICY "Permitir todas las operaciones" ON notificaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================
-- 6. Verificar todas las políticas creadas
-- ============================================
SELECT schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN (
        'tickets',
        'ramplas',
        'registros_tiempo',
        'notificaciones'
    )
ORDER BY tablename,
    policyname;