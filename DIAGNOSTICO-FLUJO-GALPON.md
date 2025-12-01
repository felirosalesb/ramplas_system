# 🔍 Diagnóstico: Flujo "Solicitar Pallets Vacíos"

**Fecha:** 1 de Diciembre, 2025  
**Problema reportado:** Los tickets de "Solicitar Pallets vacíos" aparecen directamente en Dashboard CD en vez de Dashboard Galpón

---

## ✅ Verificación del Código Frontend

### 1. Servicio de Creación de Tickets ✅
**Archivo:** `src/app/services/supabase.service.ts` (líneas 107-120)

```typescript
// Determinar el estado inicial según el tipo de ticket
const estadoInicial = dto.tipo_ticket === 'Solicitar Pallets vacíos' 
    ? 'Pendiente Aprobación Galpón'  // Va primero a Galpón para aprobación
    : 'Pendiente Asignación';        // Retiro de producción va directo a CD
```

**Estado:** ✅ CORRECTO - El código establece el estado inicial correcto

---

### 2. Dashboard Galpón - Filtro de Solicitudes ✅
**Archivo:** `src/app/components/dashboard-galpon/dashboard-galpon.component.ts` (líneas 68-72)

```typescript
// Filtrar solo tickets de tipo 'Solicitar Pallets vacíos'
const ticketsEnvio = todosTickets.filter(t => t.tipo_ticket === 'Solicitar Pallets vacíos');

// NUEVO: Solicitudes de planta esperando aprobación de galpón
this.ticketsSolicitudes = ticketsEnvio.filter(t => 
    t.estado_actual === 'Pendiente Aprobación Galpón'
);
```

**Estado:** ✅ CORRECTO - Filtra correctamente por estado

---

### 3. Dashboard CD - Filtro de Pendientes ✅
**Archivo:** `src/app/components/dashboard-cd/dashboard-cd.component.ts` (líneas 138-140)

```typescript
// Pestaña 1: Solo "Pendiente Asignación"
this.ticketsPendientes = todosTickets
    .filter(t => t.estado_actual === 'Pendiente Asignación')
```

**Estado:** ✅ CORRECTO - CD solo ve tickets en 'Pendiente Asignación'

---

### 4. Función de Aprobación Galpón ✅
**Archivo:** `src/app/services/supabase.service.ts` (líneas 763-780)

```typescript
async aprobarSolicitudGalpon(ticketId: number): Promise<void> {
    // Cambiar estado a "Pendiente Asignación" para que CD pueda asignar rampla
    const { error } = await this.supabase
        .from('tickets')
        .update({
            estado_actual: 'Pendiente Asignación',
            fecha_alerta_cd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', ticketId)
        .eq('estado_actual', 'Pendiente Aprobación Galpón');
}
```

**Estado:** ✅ CORRECTO - Transición de estados implementada

---

## ⚠️ Verificación de Base de Datos

### Script SQL de Migración
**Archivo:** `database/agregar-estado-pendiente-aprobacion-galpon.sql`

**Estado:** ✅ EXISTE - El script está creado correctamente

**Contenido del script:**
- ✅ Actualiza constraint de tabla `tickets`
- ✅ Actualiza constraint de tabla `registros_tiempo`
- ✅ Incluye 'Pendiente Aprobación Galpón' en ambos

---

## 🔴 PROBLEMA IDENTIFICADO

### El script SQL NO se ha ejecutado en Supabase

**Síntomas:**
1. Tickets de "Solicitar Pallets vacíos" aparecen directamente en CD
2. No aparecen en Dashboard Galpón
3. No hay errores en consola del navegador

**Causa raíz:**
El constraint de la base de datos NO incluye el nuevo estado 'Pendiente Aprobación Galpón', por lo que:
- La inserción del ticket falla silenciosamente O
- Se inserta con un estado por defecto ('Pendiente Asignación')

---

## ✅ SOLUCIÓN

### Paso 1: Verificar Estado Actual de la BD

Ejecuta este SQL en **Supabase SQL Editor**:

```sql
-- Ver los constraints actuales
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN ('tickets_estado_actual_check', 'registros_tiempo_estado_registrado_check')
ORDER BY conrelid::regclass;
```

**¿Qué buscar?**
- Si el constraint incluye `'Pendiente Aprobación Galpón'` → La BD está actualizada
- Si NO lo incluye → Necesitas ejecutar la migración

---

### Paso 2: Ejecutar Script de Migración

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia TODO el contenido de: `database/agregar-estado-pendiente-aprobacion-galpon.sql`
4. Pega y ejecuta
5. Verifica que aparezca: ✅ Estado "Pendiente Aprobación Galpón" agregado exitosamente

---

### Paso 3: Verificar Ticket de Prueba

1. **Limpia caché del navegador** (Ctrl + Shift + Delete)
2. **Recarga la aplicación** (F5)
3. Como **Rol Planta**, crea un nuevo ticket:
   - Tipo: "Solicitar Pallets vacíos"
   - Muelle: Cualquier número
4. **Verifica:**
   - ✅ NO aparece en Dashboard CD
   - ✅ SÍ aparece en Dashboard Galpón (sección "Solicitudes Pendientes de Aprobación")
5. Como **Rol Galpón**, aprueba la solicitud
6. **Verifica:**
   - ✅ Desaparece de Dashboard Galpón
   - ✅ Aparece en Dashboard CD (pestaña "Pendientes de Asignar")

---

## 🐛 Diagnóstico Adicional

### Si el problema persiste después de ejecutar el SQL:

#### Revisar Console del Navegador (F12)
```javascript
// Busca estos logs al crear un ticket:
'=== CREAR TICKET PLANTA ==='
'Datos a insertar:'
// Verifica que estado_actual sea: 'Pendiente Aprobación Galpón'
```

#### Revisar Supabase Logs
1. Ve a Supabase Dashboard → Logs
2. Busca errores relacionados con `INSERT INTO tickets`
3. Busca errores de `CHECK constraint violation`

#### Verificar Tipo de Ticket Exacto
```sql
-- Ver tickets recientes y su tipo exacto
SELECT 
    id,
    tipo_ticket,
    estado_actual,
    fecha_creacion,
    LENGTH(tipo_ticket) as tipo_length,
    LENGTH(estado_actual) as estado_length
FROM tickets
ORDER BY fecha_creacion DESC
LIMIT 5;
```

**Posibles problemas:**
- Espacios extra en el string
- Diferencia de mayúsculas/minúsculas
- Caracteres ocultos

---

## 📊 Flujo Completo Correcto: "Solicitar Pallets Vacíos"

```
PASO 1 - SOLICITUD:
PLANTA: Crea ticket "Solicitar Pallets vacíos"
    ↓
Estado: 'Pendiente Aprobación Galpón'
    ↓
Aparece en: Dashboard Galpón → Sección "Solicitudes Pendientes de Aprobación"

PASO 2 - APROBACIÓN:
GALPÓN: Click en "Aprobar y Solicitar Rampla"
    ↓
Estado cambia a: 'Pendiente Asignación'
    ↓
Aparece en: Dashboard CD → Pestaña "Pendientes de Asignar"

PASO 3 - ASIGNACIÓN DE RAMPLA:
CD: Asigna rampla vacía
    ↓
Estado: 'Rampla en Tránsito' (hacia Galpón)
    ↓
Aparece en: Dashboard Galpón → Sección "Ramplas Asignadas por CD"

PASO 4 - CARGA EN GALPÓN:
GALPÓN: Confirma llegada
    ↓
Estado: 'Rampla en Galpón'
    ↓
GALPÓN: Click "Iniciar Carga"
    ↓
Estado: 'Carga Iniciada Galpón'
    ↓
Aparece en: Dashboard Galpón → Sección "Cargando Pallets Vacíos"
    ↓
GALPÓN: Carga pallets vacíos
    ↓
GALPÓN: Click "Finalizar Carga y Enviar"
    ↓
Estados: 'Fin de Carga' → 'Rampla en Tránsito' (hacia Planta)

PASO 5 - ENTREGA EN PLANTA:
Estado: 'Rampla en Tránsito' (hacia Planta solicitante)
    ↓
Aparece en: Dashboard Planta (solicitante) → Con botón "Confirmar Llegada"
    ↓
PLANTA: Confirma llegada
    ↓
Estado: 'Rampla en Planta'
    ↓
PLANTA: Click "Iniciar Descarga"
    ↓
Estado: 'Inicio Descarga'
    ↓
PLANTA: Descarga pallets vacíos
    ↓
PLANTA: Click "Finalizar Descarga"
    ↓
Estados: 'Fin Descarga' → 'Libre'
    ↓
Rampla liberada ✅
Ticket completado ✅
```

---

## 📝 Checklist de Verificación

- [ ] Script SQL ejecutado en Supabase
- [ ] Constraint verificado con query SELECT
- [ ] Caché del navegador limpiado
- [ ] Aplicación recargada (F5)
- [ ] Ticket de prueba creado como Planta
- [ ] Ticket NO aparece en Dashboard CD
- [ ] Ticket SÍ aparece en Dashboard Galpón
- [ ] Aprobación funciona correctamente
- [ ] Ticket pasa a Dashboard CD después de aprobar

---

## 🆘 Si aún no funciona

**Contacto con información de:**
1. Screenshot de Console (F12) al crear ticket
2. Screenshot de Dashboard Galpón después de crear ticket
3. Screenshot de Dashboard CD después de crear ticket
4. Resultado del query de verificación de constraints
5. Logs de Supabase (si hay errores)

---

**Última actualización:** 1 de Diciembre, 2025
