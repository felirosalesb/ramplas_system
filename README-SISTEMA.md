# Sistema de Coordinación de Ramplas

Sistema de gestión y coordinación de camiones (ramplas) entre la fábrica y el centro de distribución (CD).

## 📋 Características

- **Gestión de Solicitudes**: La planta puede crear solicitudes de retiro de pallets
- **Asignación de Ramplas**: CD asigna ramplas disponibles a las solicitudes
- **Seguimiento en Tiempo Real**: Monitoreo del estado de todas las ramplas
- **Sistema de Alertas**: Notificaciones automáticas por popup y Microsoft Teams
- **Control de Tiempos**: Registro detallado de tiempos en cada etapa del proceso
- **Estados del Flujo**:
  1. Solicitud Creada
  2. Pendiente Asignación (alerta a 2 horas)
  3. Rampla Asignada
  4. Rampla en Planta (acepta/rechaza/observación)
  5. Inicio de Carga
  6. Fin de Carga
  7. Cargado - Espera Chofer
  8. Asignada a Muelle CD
  9. Inicio Descarga
  10. Fin Descarga
  11. Libre

## 🛠️ Tecnologías

- **Frontend**: Angular 19 + Angular Material
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **Notificaciones**: Microsoft Teams Webhooks

## 📦 Instalación

### 1. Clonar el repositorio

```bash
cd ramplas-system
npm install
```

### 2. Configurar Supabase

#### A. Crear proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Anota la URL del proyecto y la API Key (anon/public)

#### B. Ejecutar el script SQL
1. En el panel de Supabase, ve a "SQL Editor"
2. Copia el contenido de `supabase-schema.sql`
3. Ejecuta el script completo
4. Verifica que se crearon todas las tablas

#### C. Crear usuarios de ejemplo
1. Ve a "Authentication" → "Users"
2. Crea los siguientes usuarios:
   - Email: `planta@ramplas.com` / Password: `Planta123!`
   - Email: `cd@ramplas.com` / Password: `Cd123!`
   - Email: `admin@ramplas.com` / Password: `Admin123!`

3. Ejecuta el siguiente SQL para vincular los usuarios con sus roles:

```sql
-- Reemplaza los UUIDs con los IDs reales de los usuarios creados
INSERT INTO public.usuarios (id, email, rol, nombre) VALUES
('UUID_USUARIO_PLANTA', 'planta@ramplas.com', 'planta', 'Usuario Planta'),
('UUID_USUARIO_CD', 'cd@ramplas.com', 'cd', 'Usuario CD'),
('UUID_USUARIO_ADMIN', 'admin@ramplas.com', 'admin', 'Administrador');
```

### 3. Configurar variables de entorno

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL', // https://xxxxx.supabase.co
  supabaseKey: 'TU_SUPABASE_ANON_KEY',
  teamsWebhookUrl: 'TU_TEAMS_WEBHOOK_URL' // Opcional
};
```

### 4. Configurar Microsoft Teams (Opcional)

Para habilitar notificaciones en Teams:

1. En Teams, ve al canal donde quieres recibir notificaciones
2. Haz clic en "..." → "Conectores"
3. Busca "Incoming Webhook" y configúralo
4. Copia la URL del webhook
5. Pégala en `environment.teamsWebhookUrl`

### 5. Ejecutar el proyecto

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## 👥 Usuarios y Roles

### Rol: Planta (Fábrica)
- Crear solicitudes de retiro
- Confirmar llegada de ramplas
- Iniciar/finalizar carga
- Ver historial de sus solicitudes

### Rol: CD (Centro de Distribución)
- Ver solicitudes pendientes
- Asignar ramplas disponibles
- Asignar muelles en CD
- Iniciar/finalizar descarga
- Liberar ramplas

### Rol: Admin
- Acceso completo a todas las funcionalidades
- Ver monitor de todas las ramplas
- Acceso a métricas y análisis

## 🚀 Uso del Sistema

### Dashboard Planta

1. **Crear Nueva Solicitud**:
   - Click en "Nueva Solicitud"
   - Ingresa cantidad de pallets
   - Ingresa número de muelle en planta
   - Submit

2. **Confirmar Llegada de Rampla**:
   - Cuando la rampla asignada llegue
   - Click en "Confirmar Llegada"
   - Selecciona: Aceptar / Aceptar con observación / Rechazar

3. **Proceso de Carga**:
   - Click en "Iniciar Carga" cuando comiences
   - Click en "Finalizar Carga" al terminar

### Dashboard CD

1. **Asignar Rampla**:
   - Ve a la sección de "Tickets Pendientes"
   - Selecciona una solicitud
   - Click en "Asignar Rampla"
   - Selecciona una rampla libre
   - Confirma

2. **Asignar Muelle CD**:
   - Cuando la rampla llegue al CD
   - Click en "Asignar Muelle CD"
   - Ingresa número de muelle

3. **Proceso de Descarga**:
   - Click en "Inicio Descarga"
   - Click en "Fin Descarga" al terminar
   - El sistema liberará automáticamente la rampla

### Monitor de Ramplas

- Vista en tiempo real de las 15 ramplas
- Estados: Libre / En Servicio
- Información del ticket actual
- Tiempo en estado actual
- Cambiar entre vista grid y lista

## 📊 Análisis de Tiempos

Todos los cambios de estado se registran con timestamp en la tabla `registros_tiempo`.

### Consulta de ejemplo para análisis:

```sql
SELECT 
    ticket_id,
    estado_registrado,
    fecha_hora,
    LAG(fecha_hora) OVER (PARTITION BY ticket_id ORDER BY fecha_hora) as estado_anterior,
    EXTRACT(EPOCH FROM (
        fecha_hora - LAG(fecha_hora) OVER (PARTITION BY ticket_id ORDER BY fecha_hora)
    )) / 60 as minutos_en_estado
FROM registros_tiempo
ORDER BY ticket_id, fecha_hora;
```

## 🔔 Sistema de Notificaciones

### Alertas Automáticas

- **2 horas sin asignación**: Si una solicitud no tiene rampla asignada en 2 horas, se envía alerta
- **Rampla asignada**: Notificación a usuario de planta
- **Fin de carga**: Notificación a usuario de CD
- **Rampla rechazada**: Notificación a usuario de CD

### Canales de Notificación

1. **Popup en Dashboard**: Aparece inmediatamente
2. **Badge de notificaciones**: En el navbar
3. **Microsoft Teams**: Mensaje al canal configurado

## 🔧 Configuración Avanzada

### Cambiar intervalo de alertas

En `dashboard-cd.component.ts`:

```typescript
private iniciarMonitoreoAlertas(): void {
  // Cambiar 5 * 60 * 1000 por el intervalo deseado en milisegundos
  setInterval(() => {
    this.revisarAlertasPendientes();
  }, 5 * 60 * 1000); // 5 minutos por defecto
}
```

### Modificar tiempo de alerta inicial

En `supabase.service.ts`:

```typescript
fecha_alerta_cd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
// Cambiar "2 * 60 * 60 * 1000" por el tiempo deseado en milisegundos
```

## 📱 Responsive Design

El sistema está optimizado para:
- Desktops (1920px+)
- Tablets (768px - 1024px)
- Móviles (< 768px)

## 🛡️ Seguridad

- **Autenticación**: Supabase Auth con JWT
- **Row Level Security (RLS)**: Políticas de acceso a nivel de fila
- **Roles y Permisos**: Validación de acciones por rol
- **Auditoría**: Todos los cambios registrados con usuario y timestamp

## 📈 Métricas del Sistema

### En Monitor de Ramplas:
- Total de ramplas
- Ramplas libres
- Ramplas en servicio
- Porcentaje de utilización

### Análisis Disponibles:
- Tiempo promedio por estado
- Tiempo total de ciclo completo
- Ramplas más utilizadas
- Horas pico de actividad

## 🤝 Flujo Completo de Ejemplo

1. **Planta** crea solicitud: 30 pallets, Muelle 5
2. **Sistema** genera Ticket #123 y alerta al CD
3. **CD** recibe notificación popup + Teams
4. **CD** asigna Rampla 07 al Ticket #123
5. **Planta** recibe notificación de rampla asignada
6. **Rampla 07** viaja a planta
7. **Planta** confirma llegada (Acepta/Rechaza/Observación)
8. **Planta** inicia carga
9. **Planta** finaliza carga → Notifica al CD
10. **Rampla 07** viaja al CD
11. **CD** asigna Muelle CD (ej: Muelle 3)
12. **CD** inicia descarga
13. **CD** finaliza descarga
14. **Sistema** libera Rampla 07 automáticamente
15. **Rampla 07** queda disponible para nuevo ticket

## 🐛 Troubleshooting

### Error: "Usuario no autenticado"
- Verifica que hayas iniciado sesión
- Revisa que el token no haya expirado
- Limpia el localStorage y vuelve a iniciar sesión

### Error: "Rampla no disponible"
- Verifica en el monitor que la rampla esté en estado "Libre"
- Refresca la página para actualizar estados

### Notificaciones no aparecen
- Verifica que el servicio de notificaciones esté correctamente configurado
- Revisa la consola del navegador por errores
- Verifica permisos del navegador para notificaciones

### Teams no recibe mensajes
- Verifica que la URL del webhook sea correcta
- Verifica que el webhook esté activo en Teams
- Revisa que el formato del mensaje sea válido

## 📝 Licencia

Este proyecto es privado y de uso interno.

## 👨‍💻 Soporte

Para soporte técnico, contacta al equipo de desarrollo.
