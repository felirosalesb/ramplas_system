# Flujo Completo de Estados - Sistema Ramplas

## Resumen de Cambios Realizados
- ✅ Reemplazado **'Rampla Asignada'** por **'Rampla en Tránsito'** en todo el sistema
- ✅ Actualizado constraint de base de datos para incluir nuevos estados
- ✅ Corregidos todos los filtros, alertas y mapeos de colores/iconos

---

## Flujo Detallado de Estados

### 1. CREACIÓN DE SOLICITUD (ROL: PLANTA)
**Estado:** `Solicitud Creada` → `Pendiente Asignación`

**Acciones:**
- Planta completa formulario con: cantidad pallets, muelle planta, observaciones
- Sistema crea ticket automáticamente
- Se marca `fecha_alerta_cd` para alerta de 2 horas

**Archivo:** `dashboard-planta.component.ts` → `crearSolicitud()`
**Base de datos:** INSERT en tabla `tickets`

---

### 2. ASIGNACIÓN DE RAMPLA (ROL: CD)
**Estado:** `Pendiente Asignación` → `Rampla en Tránsito`

**Acciones:**
- CD selecciona rampla disponible
- Sistema actualiza:
  - `rampla_asignada_id` en ticket
  - Estado de rampla a "En Servicio"
  - `ticket_actual_id` en rampla
  - Limpia `fecha_alerta_cd`

**Archivo:** `supabase.service.ts` → `asignarRampla()`
**Importante:** Se registra estado `'Rampla en Tránsito'` (NO 'Rampla Asignada')

---

### 3. CONFIRMACIÓN DE LLEGADA (ROL: PLANTA)
**Estado:** `Rampla en Tránsito` → `Carga iniciada`

**Acciones:**
- Planta ve botón "Confirmar Llegada e Iniciar Carga" cuando estado es `'Rampla en Tránsito'`
- Planta puede:
  - **Aceptar:** Pasa directo a "Carga iniciada"
  - **Aceptar con observación:** Pasa a "Carga iniciada" y guarda observación
  - **Rechazar:** Vuelve a "Pendiente Asignación" y libera rampla

**Archivos:**
- `dashboard-planta.component.ts` → `confirmarLlegadaRampla()`
- `supabase.service.ts` → `confirmarLlegadaRampla()`

**Importante:** 
- Se registran 2 estados en historial: `'Rampla en Planta'` y `'Carga iniciada'`
- El estado del ticket en DB es `'Carga iniciada'` (simplificado, sin paso intermedio)

---

### 4. FINALIZAR CARGA (ROL: PLANTA)
**Estado:** `Carga iniciada` → `Cargado - Espera Chofer`

**Acciones:**
- Planta ve botón "Finalizar Carga" cuando estado es `'Carga iniciada'`
- Sistema:
  - Registra estado `'Fin de Carga'` en historial
  - Cambia estado ticket a `'Cargado - Espera Chofer'`
  - Marca `fecha_alerta_cd` para alerta de 30 minutos
  - Crea notificaciones para todos los usuarios CD

**Archivo:** `supabase.service.ts` → `finalizarCarga()`

---

### 5. ASIGNACIÓN DE MUELLE CD (ROL: CD)
**Estado:** `Cargado - Espera Chofer` → `Libre`

**Acciones:**
- CD asigna muelle en bodega
- Sistema:
  - Cambia estado a `'Libre'` directamente
  - Libera rampla (estado "Libre", `ticket_actual_id` = null)
  - Limpia `rampla_asignada_id` en ticket
  - Registra estados intermedios en historial para métricas:
    * `'Asignada a Muelle CD'`
    * `'Inicio Descarga'`
    * `'Fin Descarga'`
    * `'Libre'`

**Archivo:** `supabase.service.ts` → `asignarMuelleCD()`

**Importante:** Este paso es AUTOMÁTICO y simplificado (no requiere clicks adicionales)

---

## Validación de Constraint en Base de Datos

**IMPORTANTE:** Ejecutar este script en SQL Editor de Supabase antes de usar la aplicación:

```sql
-- Eliminar constraints antiguos
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_estado_actual_check;
ALTER TABLE registros_tiempo DROP CONSTRAINT IF EXISTS registros_tiempo_estado_registrado_check;

-- Crear nuevos constraints con todos los estados
ALTER TABLE tickets ADD CONSTRAINT tickets_estado_actual_check 
CHECK (estado_actual IN (
    'Solicitud Creada',
    'Pendiente Asignación',
    'Rampla Asignada',
    'Rampla en Tránsito',
    'Rampla en Planta',
    'Carga iniciada',
    'Fin de Carga',
    'Cargado - Espera Chofer',
    'Asignada a Muelle CD',
    'Inicio Descarga',
    'Fin Descarga',
    'Libre',
    'Rechazada'
));

ALTER TABLE registros_tiempo ADD CONSTRAINT registros_tiempo_estado_registrado_check 
CHECK (estado_registrado IN (
    'Solicitud Creada',
    'Pendiente Asignación',
    'Rampla Asignada',
    'Rampla en Tránsito',
    'Rampla en Planta',
    'Carga iniciada',
    'Fin de Carga',
    'Cargado - Espera Chofer',
    'Asignada a Muelle CD',
    'Inicio Descarga',
    'Fin Descarga',
    'Libre',
    'Rechazada'
));
```

---

## Estados en Dashboard CD - Filtros por Pestaña

### Pestaña 1: Pendientes (📋)
**Filtro:** `estado_actual === 'Pendiente Asignación'`
**Acción disponible:** Asignar Rampla

### Pestaña 2: En Planta (🏭)
**Filtro:** `['Rampla en Tránsito', 'Rampla en Planta', 'Carga iniciada', 'Fin de Carga']`
**Función:** Monitorear progreso en planta
**Alertas:** Aviso si rampla lleva más de 15 minutos en "Rampla en Tránsito"

### Pestaña 3: En Tránsito (🚚)
**Filtro:** `['Cargado - Espera Chofer', 'Asignada a Muelle CD', 'Inicio Descarga']`
**Acción disponible:** Asignar Muelle CD
**Alertas:** Aviso si rampla lleva más de 30 minutos en "Cargado - Espera Chofer"

---

## Alertas del Sistema

### Alert 1: Solicitud sin asignar (2 horas)
- **Trigger:** Ticket en "Pendiente Asignación" > 2 horas
- **Destinatarios:** Usuarios CD y Admin
- **Icono:** ⏰

### Alert 2: Rampla en tránsito (15 minutos)
- **Trigger:** Ticket en "Rampla en Tránsito" > 15 minutos
- **Destinatarios:** Usuarios CD
- **Icono:** ⚠️

### Alert 3: Rampla cargada esperando (30 minutos)
- **Trigger:** Ticket en "Cargado - Espera Chofer" > 30 minutos
- **Destinatarios:** Usuarios CD y Admin
- **Icono:** 🚨

---

## Verificación de Condiciones para Botones

### Dashboard Planta

```typescript
// Botón "Confirmar Llegada e Iniciar Carga"
puedeConfirmarLlegada(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Rampla en Tránsito';
}

// Botón "Finalizar Carga"
puedeFinalizarCarga(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Carga iniciada';
}

// Botón "Eliminar"
puedeEliminarTicket(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Pendiente Asignación';
}
```

### Dashboard CD

```typescript
// Botón "Asignar Rampla"
mostrarBotonAsignar(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Pendiente Asignación';
}

// Botón "Asignar Muelle"
puedeAsignarMuelle(ticket: Ticket): boolean {
    return ticket.estado_actual === 'Cargado - Espera Chofer';
}
```

---

## Estados Obsoletos (NO USAR)

❌ **'Rampla Asignada'** → Reemplazado por **'Rampla en Tránsito'**

Estos estados solo existen en `registros_tiempo` para mantener historial, pero NO se usan como `estado_actual` en la tabla `tickets`.

---

## Deployment

**URL Producción:** https://ramplas-system-6y1uqc3uc-felipe-rosales-projects.vercel.app

**Pasos para desplegar cambios:**
1. `npm run build`
2. `vercel --prod`

**Nota:** Ejecutar script SQL de constraints ANTES de usar la aplicación después del deploy.
