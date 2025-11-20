# 🚀 Guía Rápida de Configuración y Puesta en Marcha

## ✅ Checklist de Configuración

### 1️⃣ Configurar Supabase (15 minutos)

#### A. Crear Proyecto
- [ ] Ir a [supabase.com](https://supabase.com)
- [ ] Crear nuevo proyecto: "ramplas-system"
- [ ] Elegir región (recomendado: South America)
- [ ] Anotar las credenciales:
  ```
  Project URL: https://xcvmtlvaskkrencfzobb.supabase.co
  Anon/Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjdm10bHZhc2trcmVuY2Z6b2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTc1MDcsImV4cCI6MjA3OTEzMzUwN30.kGpg1LxCGadaW1OoeUbLS32QbSf6Tw69OOZLRhf_jzk

#### B. Ejecutar Script de Base de Datos
1. En Supabase, ir a: **SQL Editor**
2. Copiar todo el contenido de: `supabase-schema.sql`
3. Pegar y ejecutar (botón "Run" o Ctrl+Enter)
4. Verificar mensajes de éxito

#### C. Crear Usuarios
1. Ir a: **Authentication** → **Users** → **Add user**
2. Crear estos 3 usuarios:

| Email | Password | Rol |
|-------|----------|-----|
| planta@ramplas.com | Planta123! | planta |
| cd@ramplas.com | Cd123! | cd |
| admin@ramplas.com | Admin123! | admin |

3. Después de crear cada usuario, anotar su UUID
4. Ejecutar en **SQL Editor**:

```sql
-- Reemplaza los UUIDs con los valores reales
    INSERT INTO public.usuarios (id, email, rol, nombre) VALUES
    ('93c458db-f678-4cf6-842c-149192c7e33c', 'planta@ramplas.com', 'planta', 'Usuario Planta'),
    ('f181a471-b08f-4d16-b97a-d8b8e043b965', 'cd@ramplas.com', 'cd', 'Usuario CD'),
    ('cecbd60c-9a62-4fce-8ced-deb9222c6e36', 'admin@ramplas.com', 'admin', 'Administrador');
```

#### D. Verificar Ramplas
```sql
-- Debe mostrar 15 ramplas
SELECT * FROM public.ramplas;
```

### 2️⃣ Configurar Variables de Entorno (2 minutos)

Editar: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://xcvmtlvaskkrencfzobb.supabase.co',  // ← TU URL
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjdm10bHZhc2trcmVuY2Z6b2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTc1MDcsImV4cCI6MjA3OTEzMzUwN30.kGpg1LxCGadaW1OoeUbLS32QbSf6Tw69OOZLRhf_jzk',                 // ← TU KEY
  teamsWebhookUrl: ''  // Opcional por ahora
};
```

### 3️⃣ Instalar Dependencias (5 minutos)

```bash
cd ramplas-system
npm install
```

### 4️⃣ Ejecutar el Proyecto (1 minuto)

```bash
npm start
```

Abrir navegador en: [http://localhost:4200](http://localhost:4200)

### 5️⃣ Probar el Sistema (10 minutos)

#### Test 1: Login
- [ ] Abrir http://localhost:4200
- [ ] Login con: `planta@ramplas.com` / `Planta123!`
- [ ] Debe redirigir a Dashboard Planta

#### Test 2: Crear Solicitud
- [ ] Click en "Nueva Solicitud"
- [ ] Cantidad pallets: `50`
- [ ] Muelle planta: `5`
- [ ] Click "Crear Solicitud"
- [ ] Debe aparecer en la lista de activos

#### Test 3: Cambiar a Usuario CD
- [ ] Cerrar sesión
- [ ] Login con: `cd@ramplas.com` / `Cd123!`
- [ ] Debe redirigir a Dashboard CD
- [ ] Debe ver la solicitud pendiente con alerta naranja

#### Test 4: Asignar Rampla
- [ ] En la solicitud pendiente, click "Asignar Rampla"
- [ ] Seleccionar "Rampla 01"
- [ ] Confirmar
- [ ] El ticket debe cambiar de estado

#### Test 5: Monitor de Ramplas
- [ ] Click en "Monitor" en el navbar
- [ ] Debe ver las 15 ramplas
- [ ] "Rampla 01" debe estar "En Servicio"
- [ ] Las demás deben estar "Libres"

#### Test 6: Completar Flujo Planta
- [ ] Cambiar a usuario planta
- [ ] En el ticket, click "Confirmar Llegada" → "Aceptar"
- [ ] Click "Iniciar Carga"
- [ ] Click "Finalizar Carga"
- [ ] El ticket debe pasar a "Cargado - Espera Chofer"

#### Test 7: Completar Flujo CD
- [ ] Cambiar a usuario CD
- [ ] En el ticket, click "Asignar Muelle CD"
- [ ] Ingresar muelle: `3`
- [ ] Click "Inicio Descarga"
- [ ] Click "Fin Descarga"
- [ ] El ticket debe pasar a "Libre"
- [ ] Rampla 01 debe volver a estado "Libre" en el monitor

---

## 🔧 Configuración Opcional

### Microsoft Teams Webhooks

#### Paso 1: Crear Webhook en Teams
1. Abrir Teams
2. Ir al canal donde quieres recibir notificaciones
3. Click en "..." → "Connectors"
4. Buscar "Incoming Webhook"
5. Click "Configure"
6. Nombre: "Sistema Ramplas"
7. Upload imagen (opcional)
8. Click "Create"
9. **COPIAR LA URL** (se ve así: https://outlook.office.com/webhook/...)

#### Paso 2: Configurar en el Sistema
Editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxxx.supabase.co',
  supabaseKey: 'eyJhbGci...',
  teamsWebhookUrl: 'https://outlook.office.com/webhook/...' // ← PEGAR AQUÍ
};
```

#### Paso 3: Actualizar Servicio
Editar `src/app/services/notification.service.ts` línea 25:

```typescript
private teamsWebhookUrl = environment.teamsWebhookUrl;
```

Agregar el import al inicio:
```typescript
import { environment } from '../../environments/environment';
```

#### Paso 4: Reiniciar y Probar
```bash
# Detener el servidor (Ctrl+C)
npm start
```

Crear una nueva solicitud, debe llegar mensaje a Teams.

---

## 📊 Queries Útiles para Análisis

### Ver todos los tickets con sus tiempos
```sql
SELECT * FROM v_tickets_completos ORDER BY id DESC;
```

### Análisis de tiempos promedio por estado
```sql
SELECT 
    estado_registrado,
    COUNT(*) as cantidad,
    AVG(minutos_en_estado) as promedio_minutos,
    MAX(minutos_en_estado) as maximo_minutos
FROM v_analisis_tiempos
WHERE minutos_en_estado IS NOT NULL
GROUP BY estado_registrado
ORDER BY promedio_minutos DESC;
```

### Tickets activos por rampla
```sql
SELECT 
    r.nombre as rampla,
    r.estado,
    t.id as ticket_id,
    t.estado_actual,
    t.fecha_creacion
FROM ramplas r
LEFT JOIN tickets t ON r.ticket_actual_id = t.id
ORDER BY r.id;
```

### Historial completo de un ticket
```sql
SELECT 
    rt.estado_registrado,
    rt.fecha_hora,
    u.nombre as usuario,
    rt.observaciones
FROM registros_tiempo rt
JOIN usuarios u ON rt.usuario_id = u.id
WHERE rt.ticket_id = 1  -- Cambiar por el ID del ticket
ORDER BY rt.fecha_hora;
```

---

## 🐛 Solución de Problemas Comunes

### Error: "No se puede conectar a Supabase"
**Causa**: Credenciales incorrectas
**Solución**:
1. Verificar `environment.ts` tiene los valores correctos
2. En Supabase, ir a Settings → API → Copiar nuevamente URL y Key
3. Reiniciar el servidor

### Error: "Usuario no autenticado"
**Causa**: Sesión expirada o no configurada
**Solución**:
1. Cerrar todas las pestañas
2. Abrir navegador en modo incógnito
3. Ir a http://localhost:4200
4. Login nuevamente

### Error: "Rampla no está disponible"
**Causa**: La rampla ya está asignada a otro ticket
**Solución**:
1. Ir a Monitor de Ramplas
2. Verificar el estado de la rampla
3. Seleccionar una rampla que esté "Libre"

### Las notificaciones no aparecen
**Causa**: Service worker o permisos del navegador
**Solución**:
1. Abrir DevTools (F12)
2. Ir a Console, buscar errores
3. Verificar permisos del navegador para notificaciones
4. En Chrome: Configuración → Privacidad → Notificaciones

### Mensajes de Teams no llegan
**Causa**: Webhook incorrecto o inactivo
**Solución**:
1. Verificar que la URL del webhook sea correcta
2. En Teams, verificar que el conector esté activo
3. Probar el webhook con curl:
```bash
curl -X POST https://TU_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test desde curl"}'
```

---

## 📞 Contacto y Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs de Supabase (Logs → API Logs)
3. Verifica que todas las tablas se hayan creado correctamente

---

## ✨ Próximos Pasos

Una vez funcionando el sistema básico, puedes:

1. **Metricas y Reportes**: Crear dashboard de análisis de tiempos
2. **Exportar Datos**: Añadir funcionalidad de exportar a Excel
3. **Notificaciones Push**: Implementar notificaciones push reales
4. **Aplicación Móvil**: Crear versión móvil con Capacitor
5. **Roles Adicionales**: Agregar más roles (supervisor, gerente, etc.)
6. **Campos Personalizados**: Añadir más campos según necesidades
7. **Integración con ERP**: Conectar con sistema ERP existente

---

¡El sistema está listo para usar! 🎉
