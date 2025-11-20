-- ============================================
-- SISTEMA DE COORDINACIÓN DE RAMPLAS
-- Script de creación de base de datos Supabase
-- ============================================
-- TABLA: usuarios (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL CHECK (rol IN ('planta', 'cd', 'admin')),
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índice para búsquedas por rol
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol);
-- ============================================
-- TABLA: ramplas
-- ============================================
CREATE TABLE IF NOT EXISTS public.ramplas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    estado TEXT NOT NULL DEFAULT 'Libre' CHECK (estado IN ('Libre', 'En Servicio')),
    ticket_actual_id INTEGER NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índice para búsquedas por estado
CREATE INDEX idx_ramplas_estado ON public.ramplas(estado);
-- Insertar 15 ramplas iniciales
INSERT INTO public.ramplas (nombre)
VALUES ('Rampla 01'),
    ('Rampla 02'),
    ('Rampla 03'),
    ('Rampla 04'),
    ('Rampla 05'),
    ('Rampla 06'),
    ('Rampla 07'),
    ('Rampla 08'),
    ('Rampla 09'),
    ('Rampla 10'),
    ('Rampla 11'),
    ('Rampla 12'),
    ('Rampla 13'),
    ('Rampla 14'),
    ('Rampla 15') ON CONFLICT (nombre) DO NOTHING;
-- ============================================
-- TABLA: tickets
-- ============================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id SERIAL PRIMARY KEY,
    planta_user_id UUID NOT NULL REFERENCES public.usuarios(id),
    cd_user_id UUID NULL REFERENCES public.usuarios(id),
    cantidad_pallet INTEGER NOT NULL CHECK (cantidad_pallet > 0),
    muelle_planta INTEGER NOT NULL CHECK (muelle_planta > 0),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado_actual TEXT NOT NULL DEFAULT 'Solicitud Creada' CHECK (
        estado_actual IN (
            'Solicitud Creada',
            'Pendiente Asignación',
            'Rampla Asignada',
            'Rampla en Planta',
            'Inicio de Carga',
            'Fin de Carga',
            'Cargado - Espera Chofer',
            'Asignada a Muelle CD',
            'Inicio Descarga',
            'Fin Descarga',
            'Libre',
            'Rechazada'
        )
    ),
    rampla_asignada_id INTEGER NULL REFERENCES public.ramplas(id),
    fecha_alerta_cd TIMESTAMP WITH TIME ZONE NULL,
    observacion_planta TEXT NULL,
    muelle_cd_asignado INTEGER NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para optimizar consultas
CREATE INDEX idx_tickets_estado ON public.tickets(estado_actual);
CREATE INDEX idx_tickets_planta_user ON public.tickets(planta_user_id);
CREATE INDEX idx_tickets_cd_user ON public.tickets(cd_user_id);
CREATE INDEX idx_tickets_rampla ON public.tickets(rampla_asignada_id);
CREATE INDEX idx_tickets_fecha_creacion ON public.tickets(fecha_creacion DESC);
CREATE INDEX idx_tickets_fecha_alerta ON public.tickets(fecha_alerta_cd)
WHERE fecha_alerta_cd IS NOT NULL;
-- ============================================
-- TABLA: registros_tiempo
-- ============================================
CREATE TABLE IF NOT EXISTS public.registros_tiempo (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    estado_registrado TEXT NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    observaciones TEXT NULL
);
-- Índices para análisis de tiempos
CREATE INDEX idx_registros_ticket ON public.registros_tiempo(ticket_id, fecha_hora);
CREATE INDEX idx_registros_estado ON public.registros_tiempo(estado_registrado);
-- ============================================
-- TABLA: notificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    ticket_id INTEGER NULL REFERENCES public.tickets(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('info', 'warning', 'success', 'error')),
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para notificaciones
CREATE INDEX idx_notificaciones_usuario ON public.notificaciones(usuario_id, leido);
CREATE INDEX idx_notificaciones_fecha ON public.notificaciones(created_at DESC);
-- ============================================
-- FOREIGN KEY CONSTRAINT
-- ============================================
ALTER TABLE public.ramplas
ADD CONSTRAINT fk_ramplas_ticket FOREIGN KEY (ticket_actual_id) REFERENCES public.tickets(id) ON DELETE
SET NULL;
-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================
-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE
UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ramplas_updated_at BEFORE
UPDATE ON public.ramplas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE
UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- VISTAS ÚTILES PARA ANÁLISIS
-- ============================================
-- Vista de tickets con información completa
CREATE OR REPLACE VIEW v_tickets_completos AS
SELECT t.*,
    r.nombre as rampla_nombre,
    r.estado as rampla_estado,
    up.nombre as usuario_planta_nombre,
    up.email as usuario_planta_email,
    ub.nombre as usuario_cd_nombre,
    ub.email as usuario_cd_email
FROM public.tickets t
    LEFT JOIN public.ramplas r ON t.rampla_asignada_id = r.id
    LEFT JOIN public.usuarios up ON t.planta_user_id = up.id
    LEFT JOIN public.usuarios ub ON t.cd_user_id = ub.id;
-- Vista de análisis de tiempos
CREATE OR REPLACE VIEW v_analisis_tiempos AS
SELECT t.id as ticket_id,
    t.estado_actual,
    t.fecha_creacion,
    r.estado_registrado,
    r.fecha_hora,
    r.usuario_id,
    EXTRACT(
        EPOCH
        FROM (
                r.fecha_hora - LAG(r.fecha_hora) OVER (
                    PARTITION BY t.id
                    ORDER BY r.fecha_hora
                )
            )
    ) / 60 as minutos_en_estado
FROM public.tickets t
    JOIN public.registros_tiempo r ON t.id = r.ticket_id
ORDER BY t.id,
    r.fecha_hora;
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramplas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_tiempo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propia información" ON public.usuarios FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propia información" ON public.usuarios FOR
UPDATE USING (auth.uid() = id);
-- Políticas para ramplas (todos pueden ver)
CREATE POLICY "Cualquiera autenticado puede ver ramplas" ON public.ramplas FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Solo usuarios de CD pueden actualizar ramplas" ON public.ramplas FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol IN ('cd', 'admin')
        )
    );
-- Políticas para tickets
CREATE POLICY "Usuarios pueden ver tickets relacionados" ON public.tickets FOR
SELECT TO authenticated USING (
        planta_user_id = auth.uid()
        OR cd_user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol IN ('cd', 'admin')
        )
    );
CREATE POLICY "Usuarios de planta pueden crear tickets" ON public.tickets FOR
INSERT TO authenticated WITH CHECK (
        planta_user_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol IN ('planta', 'admin')
        )
    );
CREATE POLICY "Usuarios pueden actualizar sus tickets" ON public.tickets FOR
UPDATE TO authenticated USING (
        planta_user_id = auth.uid()
        OR cd_user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol IN ('cd', 'admin')
        )
    );
-- Políticas para registros_tiempo
CREATE POLICY "Usuarios pueden ver registros de sus tickets" ON public.registros_tiempo FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.tickets
            WHERE id = ticket_id
                AND (
                    planta_user_id = auth.uid()
                    OR cd_user_id = auth.uid()
                )
        )
        OR EXISTS (
            SELECT 1
            FROM public.usuarios
            WHERE id = auth.uid()
                AND rol = 'admin'
        )
    );
CREATE POLICY "Sistema puede insertar registros_tiempo" ON public.registros_tiempo FOR
INSERT TO authenticated WITH CHECK (true);
-- Políticas para notificaciones
CREATE POLICY "Usuarios pueden ver sus notificaciones" ON public.notificaciones FOR
SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuarios pueden actualizar sus notificaciones" ON public.notificaciones FOR
UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Sistema puede crear notificaciones" ON public.notificaciones FOR
INSERT TO authenticated WITH CHECK (true);
-- ============================================
-- FUNCIÓN PARA CREAR USUARIOS DE EJEMPLO
-- ============================================
CREATE OR REPLACE FUNCTION crear_usuarios_ejemplo() RETURNS void AS $$ BEGIN -- Esta función debe ejecutarse DESPUÉS de crear los usuarios en Supabase Auth
    -- Los IDs deben coincidir con los usuarios creados en auth.users
    RAISE NOTICE 'Para crear usuarios de ejemplo:';
RAISE NOTICE '1. Ve al panel de Supabase Authentication';
RAISE NOTICE '2. Crea usuarios con los siguientes emails:';
RAISE NOTICE '   - planta@ramplas.com (rol: planta)';
RAISE NOTICE '   - cd@ramplas.com (rol: cd)';
RAISE NOTICE '   - admin@ramplas.com (rol: admin)';
RAISE NOTICE '3. Luego inserta los registros en la tabla usuarios con sus UUIDs correspondientes';
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================
COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema con roles específicos';
COMMENT ON TABLE public.ramplas IS 'Catálogo de ramplas/camiones disponibles';
COMMENT ON TABLE public.tickets IS 'Solicitudes de retiro y su ciclo de vida completo';
COMMENT ON TABLE public.registros_tiempo IS 'Auditoría de cambios de estado para análisis de tiempos';
COMMENT ON TABLE public.notificaciones IS 'Notificaciones para usuarios';
-- ============================================
-- FINALIZACIÓN
-- ============================================
SELECT 'Schema creado exitosamente!' as mensaje;
SELECT 'Total de ramplas:' as info,
    COUNT(*) as cantidad
FROM public.ramplas;