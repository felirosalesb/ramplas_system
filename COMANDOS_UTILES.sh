# ═══════════════════════════════════════════════════════════════════════════
# COMANDOS ÚTILES - Sistema de Gestión de Ramplas
# ═══════════════════════════════════════════════════════════════════════════
# Este archivo contiene todos los comandos que necesitarás.
# Copia y pega según necesites.
# ═══════════════════════════════════════════════════════════════════════════


# ═══════════════════════════════════════════════════════════════════════════
# 1. INSTALACIÓN INICIAL
# ═══════════════════════════════════════════════════════════════════════════

# Verificar Node.js instalado
node --version
npm --version

# Clonar repositorio (reemplaza con tu URL)
git clone <URL_DEL_REPOSITORIO>
cd ramplas-system

# Instalar dependencias
npm install

# Instalar Angular CLI globalmente (si no lo tienes)
npm install -g @angular/cli


# ═══════════════════════════════════════════════════════════════════════════
# 2. DESARROLLO
# ═══════════════════════════════════════════════════════════════════════════

# Iniciar servidor de desarrollo
npm start
# o
ng serve

# Iniciar en un puerto específico
ng serve --port 4300

# Iniciar y abrir navegador automáticamente
ng serve --open


# ═══════════════════════════════════════════════════════════════════════════
# 3. BUILD / COMPILACIÓN
# ═══════════════════════════════════════════════════════════════════════════

# Build de desarrollo
npm run build
# o
ng build

# Build de producción
ng build --configuration production

# Build con análisis de bundle size
ng build --stats-json

# Ver análisis de bundle (después del comando anterior)
npx webpack-bundle-analyzer dist/ramplas-system/browser/stats.json


# ═══════════════════════════════════════════════════════════════════════════
# 4. TESTING
# ═══════════════════════════════════════════════════════════════════════════

# Ejecutar tests
npm test
# o
ng test

# Tests con coverage
ng test --code-coverage

# Tests en modo CI (sin watch)
ng test --watch=false


# ═══════════════════════════════════════════════════════════════════════════
# 5. LINTING Y FORMATEO
# ═══════════════════════════════════════════════════════════════════════════

# Verificar sintaxis (si está configurado)
ng lint

# Formatear código con Prettier (si está instalado)
npx prettier --write "src/**/*.{ts,html,css,scss}"


# ═══════════════════════════════════════════════════════════════════════════
# 6. DESPLIEGUE - VERCEL
# ═══════════════════════════════════════════════════════════════════════════

# Instalar Vercel CLI
npm install -g vercel

# Login en Vercel
vercel login

# Desplegar a preview
vercel

# Desplegar a producción
vercel --prod

# Ver logs de producción
vercel logs


# ═══════════════════════════════════════════════════════════════════════════
# 7. BASE DE DATOS - SUPABASE (SQL)
# ═══════════════════════════════════════════════════════════════════════════

# Estos comandos se ejecutan en Supabase SQL Editor

# ─────────────────────────────────────────────────────────────────────────
# 7.1 Crear toda la base de datos
# ─────────────────────────────────────────────────────────────────────────
# (Copiar todo el contenido de database/database-schema.sql y ejecutar)


# ─────────────────────────────────────────────────────────────────────────
# 7.2 Crear usuarios iniciales
# ─────────────────────────────────────────────────────────────────────────

-- Primero crear en Authentication → Users de Supabase
-- Luego ejecutar esto reemplazando los UUIDs:

INSERT INTO usuarios (id, email, rol, nombre, nombre_planta)
VALUES 
  ('UUID-DEL-USUARIO-AUTH', 'admin@empresa.com', 'admin', 'Admin Sistema', NULL),
  ('UUID-DEL-USUARIO-AUTH', 'cd@empresa.com', 'cd', 'Operador CD', NULL),
  ('UUID-DEL-USUARIO-AUTH', 'planta@empresa.com', 'planta', 'Operador Planta', 'Planta Santiago'),
  ('UUID-DEL-USUARIO-AUTH', 'galpon@empresa.com', 'galpon', 'Operador Galpón', NULL);


# ─────────────────────────────────────────────────────────────────────────
# 7.3 Crear ramplas iniciales
# ─────────────────────────────────────────────────────────────────────────

INSERT INTO ramplas (nombre, tipo_rampla, estado, activo)
VALUES 
  ('R-001', 'frugon_cerrado', 'Libre', true),
  ('R-002', 'frugon_cerrado', 'Libre', true),
  ('R-003', 'cortina', 'Libre', true),
  ('R-004', 'cortina', 'Libre', true),
  ('R-005', 'frugon_cerrado', 'Libre', true);


# ─────────────────────────────────────────────────────────────────────────
# 7.4 Crear muelles iniciales
# ─────────────────────────────────────────────────────────────────────────

INSERT INTO muelles (nombre, estado, activo)
VALUES 
  ('Muelle A1', 'Libre', true),
  ('Muelle A2', 'Libre', true),
  ('Muelle B1', 'Libre', true),
  ('Muelle B2', 'Libre', true),
  ('Muelle C1', 'Libre', true);


# ─────────────────────────────────────────────────────────────────────────
# 7.5 Habilitar Row Level Security
# ─────────────────────────────────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ramplas ENABLE ROW LEVEL SECURITY;
ALTER TABLE muelles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_tiempo ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política básica para usuarios
CREATE POLICY "Los usuarios pueden ver sus propios datos" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Políticas básicas para tickets (ajustar según necesidades)
CREATE POLICY "Los usuarios autenticados pueden ver tickets" ON tickets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios pueden crear tickets" ON tickets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios pueden actualizar tickets" ON tickets
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Agregar políticas similares para otras tablas según roles específicos


# ─────────────────────────────────────────────────────────────────────────
# 7.6 Queries útiles de administración
# ─────────────────────────────────────────────────────────────────────────

-- Ver todos los tickets activos
SELECT * FROM vw_tickets_activos;

-- Ver histórico de un ticket específico
SELECT * FROM registros_tiempo WHERE ticket_id = 123 ORDER BY fecha_hora;

-- Ver ramplas en servicio
SELECT * FROM ramplas WHERE estado = 'En Servicio';

-- Ver muelles ocupados
SELECT * FROM muelles WHERE estado = 'Ocupado';

-- Liberar rampla manualmente (en caso de inconsistencia)
UPDATE ramplas SET estado = 'Libre', ticket_actual_id = NULL WHERE id = 1;

-- Liberar muelle manualmente
UPDATE muelles SET estado = 'Libre', ticket_actual_id = NULL WHERE id = 1;

-- Ver tickets sin finalizar (auditoría)
SELECT * FROM tickets WHERE estado_actual NOT IN ('Libre', 'Rechazada', 'Cancelado por CD');


# ═══════════════════════════════════════════════════════════════════════════
# 8. GIT - CONTROL DE VERSIONES
# ═══════════════════════════════════════════════════════════════════════════

# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Pull cambios
git pull origin main

# Crear rama
git checkout -b feature/nueva-funcionalidad

# Ver branches
git branch

# Cambiar de branch
git checkout main


# ═══════════════════════════════════════════════════════════════════════════
# 9. NPM - GESTIÓN DE DEPENDENCIAS
# ═══════════════════════════════════════════════════════════════════════════

# Ver dependencias desactualizadas
npm outdated

# Actualizar dependencias menores
npm update

# Actualizar Angular
ng update @angular/core @angular/cli

# Actualizar Angular Material
ng update @angular/material

# Instalar nueva dependencia
npm install nombre-paquete

# Instalar dependencia de desarrollo
npm install --save-dev nombre-paquete

# Desinstalar dependencia
npm uninstall nombre-paquete

# Limpiar caché de npm
npm cache clean --force

# Reinstalar todo desde cero
rm -rf node_modules package-lock.json
npm install


# ═══════════════════════════════════════════════════════════════════════════
# 10. DEBUGGING
# ═══════════════════════════════════════════════════════════════════════════

# Iniciar con source maps (para debug en navegador)
ng serve --source-map

# Ver errores de compilación con más detalle
ng build --verbose

# Limpiar caché de Angular
rm -rf .angular/cache

# Verificar configuración de TypeScript
npx tsc --showConfig


# ═══════════════════════════════════════════════════════════════════════════
# 11. UTILIDADES
# ═══════════════════════════════════════════════════════════════════════════

# Generar nuevo componente
ng generate component components/nombre-componente

# Generar nuevo servicio
ng generate service services/nombre-servicio

# Generar guard
ng generate guard guards/nombre-guard

# Ver estructura del proyecto
tree -L 3 -I 'node_modules|dist'

# Contar líneas de código
find src -name '*.ts' | xargs wc -l


# ═══════════════════════════════════════════════════════════════════════════
# 12. SERVIDOR LOCAL PARA BUILD DE PRODUCCIÓN
# ═══════════════════════════════════════════════════════════════════════════

# Instalar http-server
npm install -g http-server

# Build de producción
ng build --configuration production

# Servir el build
cd dist/ramplas-system/browser
http-server -p 8080

# Abrir: http://localhost:8080


# ═══════════════════════════════════════════════════════════════════════════
# 13. BACKUP Y RESTORE (Supabase)
# ═══════════════════════════════════════════════════════════════════════════

# En Supabase SQL Editor:

-- Exportar datos de una tabla (ejemplo)
COPY tickets TO '/tmp/tickets_backup.csv' DELIMITER ',' CSV HEADER;

-- Ver tamaño de las tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


# ═══════════════════════════════════════════════════════════════════════════
# 14. LIMPIEZA
# ═══════════════════════════════════════════════════════════════════════════

# Limpiar build
rm -rf dist

# Limpiar node_modules
rm -rf node_modules

# Limpiar caché de Angular
rm -rf .angular

# Limpieza completa
rm -rf dist node_modules .angular package-lock.json


# ═══════════════════════════════════════════════════════════════════════════
# 15. QUICK START - DESDE CERO
# ═══════════════════════════════════════════════════════════════════════════

# Todo en uno para empezar:

# 1. Clonar e instalar
git clone <URL_REPO>
cd ramplas-system
npm install

# 2. Configurar environment.ts con credenciales de Supabase
# (Editar manualmente el archivo)

# 3. En Supabase SQL Editor:
#    - Ejecutar database/database-schema.sql
#    - Crear usuarios iniciales
#    - Crear ramplas y muelles

# 4. Iniciar aplicación
npm start

# 5. Abrir http://localhost:4200 y hacer login


# ═══════════════════════════════════════════════════════════════════════════
# FIN DE COMANDOS ÚTILES
# ═══════════════════════════════════════════════════════════════════════════
# Para más información, consulta:
# - README.md
# - INICIO_RAPIDO.txt
# - CONFIGURACION_PENDIENTE.txt
# ═══════════════════════════════════════════════════════════════════════════
