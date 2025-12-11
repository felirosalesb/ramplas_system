-- database-schema.sql
-- Esquema completo para Sistema de Gestión de Ramplas (PostgreSQL / Supabase)
-- =============================
-- 1. Tipos ENUM
-- =============================
CREATE TYPE tipo_rampla AS ENUM ('frugon_cerrado', 'cortina');
CREATE TYPE tipo_ticket AS ENUM (
  'Retiro pallets producción',
  'Solicitar Pallets vacíos'
);
CREATE TYPE rol_usuario AS ENUM ('planta', 'cd', 'admin', 'galpon');
CREATE TYPE estado_ticket AS ENUM (
  'Solicitud Creada',
  'Pendiente Aprobación Galpón',
  'Pendiente Asignación',
  'Rampla Asignada',
  'Rampla en Tránsito a Galpón',
  'Rampla en Tránsito a Planta',
  'Rampla en Tránsito',
  'Rampla en Planta',
  'Carga iniciada',
  'Fin de Carga',
  'Cargado - Espera Chofer',
  'Rampla en Galpón',
  'Carga Iniciada Galpón',
  'Rampla Cargada - Tránsito CD',
  'Asignada a Muelle CD',
  'Inicio Descarga',
  'Fin Descarga',
  'Libre',
  'Rechazada',
  'Cancelado por CD'
);
CREATE TYPE estado_rampla AS ENUM ('Libre', 'En Servicio');
CREATE TYPE estado_muelle AS ENUM ('Libre', 'Ocupado');
CREATE TYPE motivo_bloqueo AS ENUM ('Mantención', 'Fuera de servicio');
-- =============================
-- 2. Tablas base
-- =============================
-- 2.1 usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  rol rol_usuario NOT NULL,
  nombre text NOT NULL,
  nombre_planta text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- 2.2 ramplas
CREATE TABLE IF NOT EXISTS ramplas (
  id bigserial PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  tipo_rampla tipo_rampla NOT NULL,
  estado estado_rampla NOT NULL DEFAULT 'Libre',
  activo boolean NOT NULL DEFAULT true,
  motivo_bloqueo text,
  ticket_actual_id bigint REFERENCES tickets(id) ON DELETE
  SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);
-- 2.3 muelles
CREATE TABLE IF NOT EXISTS muelles (
  id bigserial PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  estado estado_muelle NOT NULL DEFAULT 'Libre',
  ticket_actual_id bigint REFERENCES tickets(id) ON DELETE
  SET NULL,
    activo boolean NOT NULL DEFAULT true,
    motivo_bloqueo text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);
-- 2.4 tickets
CREATE TABLE IF NOT EXISTS tickets (
  id bigserial PRIMARY KEY,
  planta_user_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  cd_user_id uuid REFERENCES usuarios(id) ON DELETE
  SET NULL,
    tipo_ticket tipo_ticket NOT NULL,
    cantidad_pallet integer NOT NULL CHECK (cantidad_pallet > 0),
    cantidad_pallets integer CHECK (
      cantidad_pallets IS NULL
      OR cantidad_pallets > 0
    ),
    muelle_planta integer NOT NULL CHECK (muelle_planta > 0),
    nombre_planta text,
    fecha_creacion timestamptz NOT NULL DEFAULT now(),
    estado_actual estado_ticket NOT NULL,
    rampla_asignada_id bigint REFERENCES ramplas(id) ON DELETE
  SET NULL,
    muelle_asignado_id bigint REFERENCES muelles(id) ON DELETE
  SET NULL,
    fecha_alerta_cd timestamptz,
    observacion_planta text,
    observaciones text,
    muelle_cd_asignado integer,
    CONSTRAINT chk_estado_ticket_valido CHECK (
      estado_actual IN (
        'Solicitud Creada',
        'Pendiente Aprobación Galpón',
        'Pendiente Asignación',
        'Rampla Asignada',
        'Rampla en Tránsito a Galpón',
        'Rampla en Tránsito a Planta',
        'Rampla en Tránsito',
        'Rampla en Planta',
        'Carga iniciada',
        'Fin de Carga',
        'Cargado - Espera Chofer',
        'Rampla en Galpón',
        'Carga Iniciada Galpón',
        'Rampla Cargada - Tránsito CD',
        'Asignada a Muelle CD',
        'Inicio Descarga',
        'Fin Descarga',
        'Libre',
        'Rechazada',
        'Cancelado por CD'
      )
    )
);
-- 2.5 registros_tiempo
CREATE TABLE IF NOT EXISTS registros_tiempo (
  id bigserial PRIMARY KEY,
  ticket_id bigint NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  estado_registrado estado_ticket NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  CONSTRAINT chk_estado_registro_valido CHECK (
    estado_registrado IN (
      'Solicitud Creada',
      'Pendiente Aprobación Galpón',
      'Pendiente Asignación',
      'Rampla Asignada',
      'Rampla en Tránsito a Galpón',
      'Rampla en Tránsito a Planta',
      'Rampla en Tránsito',
      'Rampla en Planta',
      'Carga iniciada',
      'Fin de Carga',
      'Cargado - Espera Chofer',
      'Rampla en Galpón',
      'Carga Iniciada Galpón',
      'Rampla Cargada - Tránsito CD',
      'Asignada a Muelle CD',
      'Inicio Descarga',
      'Fin Descarga',
      'Libre',
      'Rechazada',
      'Cancelado por CD'
    )
  )
);
-- =============================
-- 3. Índices recomendados
-- =============================
-- tickets
CREATE INDEX IF NOT EXISTS idx_tickets_estado_actual ON tickets(estado_actual);
CREATE INDEX IF NOT EXISTS idx_tickets_planta_user ON tickets(planta_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cd_user ON tickets(cd_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_creacion ON tickets(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_alerta_cd ON tickets(fecha_alerta_cd)
WHERE estado_actual = 'Pendiente Asignación';
-- ramplas
CREATE INDEX IF NOT EXISTS idx_ramplas_estado ON ramplas(estado);
CREATE INDEX IF NOT EXISTS idx_ramplas_activo ON ramplas(activo);
-- muelles
CREATE INDEX IF NOT EXISTS idx_muelles_estado ON muelles(estado);
CREATE INDEX IF NOT EXISTS idx_muelles_activo ON muelles(activo);
-- registros_tiempo
CREATE INDEX IF NOT EXISTS idx_registros_ticket ON registros_tiempo(ticket_id);
CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros_tiempo(estado_registrado);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_tiempo(fecha_hora DESC);
-- =============================
-- 4. Reglas de integridad adicionales
-- =============================
-- Asegurar que una rampla activa no tenga motivo_bloqueo
CREATE OR REPLACE FUNCTION trg_clear_motivo_bloqueo_rampla() RETURNS trigger AS $$ BEGIN IF NEW.activo THEN NEW.motivo_bloqueo := NULL;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER clear_motivo_bloqueo_rampla BEFORE
UPDATE ON ramplas FOR EACH ROW EXECUTE FUNCTION trg_clear_motivo_bloqueo_rampla();
-- Asegurar que un muelle activo no tenga motivo_bloqueo
CREATE OR REPLACE FUNCTION trg_clear_motivo_bloqueo_muelle() RETURNS trigger AS $$ BEGIN IF NEW.activo THEN NEW.motivo_bloqueo := NULL;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER clear_motivo_bloqueo_muelle BEFORE
UPDATE ON muelles FOR EACH ROW EXECUTE FUNCTION trg_clear_motivo_bloqueo_muelle();
-- =============================
-- 5. Vistas útiles
-- =============================
-- Vista: tickets activos con relaciones de rampla y muelle
CREATE OR REPLACE VIEW vw_tickets_activos AS
SELECT t.id,
  t.tipo_ticket,
  t.estado_actual,
  t.planta_user_id,
  t.cd_user_id,
  t.muelle_planta,
  t.nombre_planta,
  t.fecha_creacion,
  t.cantidad_pallet,
  t.cantidad_pallets,
  t.observacion_planta,
  t.observaciones,
  r.id AS rampla_id,
  r.nombre AS rampla_nombre,
  r.estado AS rampla_estado,
  m.id AS muelle_id,
  m.nombre AS muelle_nombre,
  m.estado AS muelle_estado
FROM tickets t
  LEFT JOIN ramplas r ON r.id = t.rampla_asignada_id
  LEFT JOIN muelles m ON m.id = t.muelle_asignado_id
WHERE t.estado_actual <> 'Libre';
-- Vista: último estado de cada ticket
CREATE OR REPLACE VIEW vw_ticket_ultimo_estado AS
SELECT DISTINCT ON (ticket_id) ticket_id,
  estado_registrado,
  fecha_hora,
  usuario_id
FROM registros_tiempo
ORDER BY ticket_id,
  fecha_hora DESC;
-- =============================
-- 6. Triggers críticos de validación
-- =============================
-- Evitar asignar una rampla ocupada a más de un ticket
CREATE OR REPLACE FUNCTION trg_validar_rampla_unica() RETURNS trigger AS $$
DECLARE otros_tickets integer;
BEGIN IF NEW.rampla_asignada_id IS NULL THEN RETURN NEW;
END IF;
SELECT COUNT(*) INTO otros_tickets
FROM tickets
WHERE rampla_asignada_id = NEW.rampla_asignada_id
  AND id <> COALESCE(NEW.id, 0)
  AND estado_actual <> 'Libre';
IF otros_tickets > 0 THEN RAISE EXCEPTION 'La rampla % ya está asignada a otro ticket activo',
NEW.rampla_asignada_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER validar_rampla_unica BEFORE
INSERT
  OR
UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION trg_validar_rampla_unica();
-- Evitar asignar un muelle ocupado a más de un ticket
CREATE OR REPLACE FUNCTION trg_validar_muelle_unico() RETURNS trigger AS $$
DECLARE otros_tickets integer;
BEGIN IF NEW.muelle_asignado_id IS NULL THEN RETURN NEW;
END IF;
SELECT COUNT(*) INTO otros_tickets
FROM tickets
WHERE muelle_asignado_id = NEW.muelle_asignado_id
  AND id <> COALESCE(NEW.id, 0)
  AND estado_actual NOT IN ('Libre', 'Cancelado por CD', 'Rechazada');
IF otros_tickets > 0 THEN RAISE EXCEPTION 'El muelle % ya está asignado a otro ticket activo',
NEW.muelle_asignado_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER validar_muelle_unico BEFORE
INSERT
  OR
UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION trg_validar_muelle_unico();
-- Mantener coherencia rampla.ticket_actual_id con tickets
CREATE OR REPLACE FUNCTION trg_sync_ticket_actual_rampla() RETURNS trigger AS $$ BEGIN IF NEW.rampla_asignada_id IS NOT NULL THEN
UPDATE ramplas
SET ticket_actual_id = NEW.id,
  estado = 'En Servicio'
WHERE id = NEW.rampla_asignada_id;
END IF;
IF (
  OLD.rampla_asignada_id IS NOT NULL
  AND OLD.rampla_asignada_id <> NEW.rampla_asignada_id
)
OR (
  NEW.estado_actual IN ('Libre', 'Cancelado por CD', 'Rechazada')
) THEN
UPDATE ramplas
SET ticket_actual_id = NULL,
  estado = 'Libre'
WHERE id = OLD.rampla_asignada_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER sync_ticket_actual_rampla
AFTER
UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION trg_sync_ticket_actual_rampla();
-- Mantener coherencia muelle.ticket_actual_id con tickets
CREATE OR REPLACE FUNCTION trg_sync_ticket_actual_muelle() RETURNS trigger AS $$ BEGIN IF NEW.muelle_asignado_id IS NOT NULL THEN
UPDATE muelles
SET ticket_actual_id = NEW.id,
  estado = 'Ocupado'
WHERE id = NEW.muelle_asignado_id;
END IF;
IF (
  OLD.muelle_asignado_id IS NOT NULL
  AND OLD.muelle_asignado_id <> NEW.muelle_asignado_id
)
OR (
  NEW.estado_actual IN ('Libre', 'Cancelado por CD', 'Rechazada')
) THEN
UPDATE muelles
SET ticket_actual_id = NULL,
  estado = 'Libre'
WHERE id = OLD.muelle_asignado_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER sync_ticket_actual_muelle
AFTER
UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION trg_sync_ticket_actual_muelle();
-- =============================
-- FIN DE ESQUEMA
-- =============================