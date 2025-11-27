# 🔔 Sistema de Notificaciones Mejorado

## 📋 Resumen de Mejoras

El sistema de notificaciones ha sido completamente rediseñado para proporcionar una experiencia más intuitiva y efectiva:

### ✨ Características Nuevas

1. **Filtrado por Rol** 🎯
   - Las notificaciones se filtran automáticamente según el rol del usuario
   - Solo recibes notificaciones relevantes para tu función
   - Roles soportados: `planta`, `cd`, `admin`, `galpon`

2. **Notificaciones Nativas del Navegador** 🖥️
   - Alertas fuera de la aplicación para eventos críticos y de alta prioridad
   - Funciona incluso cuando el navegador está minimizado
   - Solicita permiso automáticamente en el primer inicio

3. **Sistema de Prioridades** 📊
   - **Crítica**: No se cierra automáticamente, sonido alto, notificación nativa
   - **Alta**: 10 segundos de duración, sonido medio, notificación nativa
   - **Media**: 5 segundos de duración, sonido estándar
   - **Baja**: 3 segundos de duración, sonido bajo

4. **Panel Visual Mejorado** 🎨
   - Botón flotante con badge de notificaciones no leídas
   - Panel deslizante desde la derecha con animaciones fluidas
   - Indicadores visuales de prioridad (colores y animaciones)
   - Acciones rápidas para cada notificación

---

## 🛠️ Implementación Técnica

### 1. Service (notification.service.ts)

#### Nuevos Tipos y Interfaces

```typescript
export type RolUsuario = 'planta' | 'cd' | 'admin' | 'galpon';
export type PrioridadNotificacion = 'baja' | 'media' | 'alta' | 'critica';

export interface PopupNotification {
  id: string;
  mensaje: string;
  ticket_id: number;
  timestamp: Date;
  leido: boolean;
  tipo: 'info' | 'warning' | 'success' | 'error';
  prioridad?: PrioridadNotificacion;
  rolesDestino?: RolUsuario[];
  icono?: string;
  accion?: {
    texto: string;
    url: string;
  };
}
```

#### Métodos Principales

**Configuración de Rol**
```typescript
setRolUsuario(rol: RolUsuario): void
```
Establece el rol del usuario actual para filtrar notificaciones.

**Solicitar Permisos**
```typescript
async solicitarPermisoNotificaciones(): Promise<boolean>
```
Solicita permiso al navegador para mostrar notificaciones nativas.

**Agregar Notificación (mejorado)**
```typescript
agregarNotificacion(
  mensaje: string,
  ticketId: number,
  tipo: 'info' | 'warning' | 'success' | 'error' = 'info',
  prioridad: PrioridadNotificacion = 'media',
  rolesDestino: RolUsuario[] = ['planta', 'cd', 'admin', 'galpon'],
  icono?: string,
  accion?: { texto: string; url: string }
): void
```

**Obtener Notificaciones Filtradas**
```typescript
getNotificacionesPorRol(): Observable<PopupNotification[]>
```
Devuelve solo las notificaciones aplicables al rol actual del usuario.

---

## 🎯 Configuración por Rol

### Ejemplos de Notificaciones por Evento

#### 1. Nueva Solicitud de Retiro
- **Destinatarios**: CD, Admin
- **Prioridad**: Alta
- **Icono**: 🚨
- **Acción**: "Ver Ticket"

```typescript
notificarNuevaSolicitud(ticketId: number, muellePlanta: number): void {
  const mensaje = `Nueva solicitud de retiro desde Muelle ${muellePlanta}`;
  this.agregarNotificacion(
    mensaje,
    ticketId,
    'info',
    'alta',
    ['cd', 'admin'],
    '🚨',
    { texto: 'Ver Ticket', url: `/tickets/${ticketId}` }
  );
}
```

#### 2. Rampla Asignada
- **Destinatarios**: Planta, Admin
- **Prioridad**: Media
- **Icono**: ✅
- **Acción**: "Ver Ticket"

```typescript
notificarRamplaAsignada(ticketId: number, ramplaNombre: string): void {
  const mensaje = `Rampla ${ramplaNombre} asignada a tu solicitud`;
  this.agregarNotificacion(
    mensaje,
    ticketId,
    'success',
    'media',
    ['planta', 'admin'],
    '✅',
    { texto: 'Ver Ticket', url: `/tickets/${ticketId}` }
  );
}
```

#### 3. Alerta de Tiempo
- **Destinatarios**: CD, Admin
- **Prioridad**: Crítica
- **Icono**: ⚠️
- **Acción**: "Asignar Ahora"

```typescript
notificarAlertaPendiente(ticketId: number): void {
  const mensaje = `⚠️ URGENTE: Solicitud #${ticketId} lleva más de 2 horas sin asignar rampla`;
  this.agregarNotificacion(
    mensaje,
    ticketId,
    'warning',
    'critica',
    ['cd', 'admin'],
    '⚠️',
    { texto: 'Asignar Ahora', url: `/tickets/${ticketId}` }
  );
}
```

#### 4. Fin de Carga
- **Destinatarios**: Planta, CD, Admin
- **Prioridad**: Media
- **Icono**: 📦
- **Acción**: "Ver Ticket"

```typescript
notificarFinCarga(ticketId: number, ramplaNombre: string): void {
  const mensaje = `Carga finalizada en ${ramplaNombre} - Ticket #${ticketId}`;
  this.agregarNotificacion(
    mensaje,
    ticketId,
    'success',
    'media',
    ['planta', 'cd', 'admin'],
    '📦',
    { texto: 'Ver Ticket', url: `/tickets/${ticketId}` }
  );
}
```

#### 5. Rampla Rechazada
- **Destinatarios**: Planta, CD, Admin
- **Prioridad**: Alta
- **Icono**: ❌
- **Acción**: "Ver Detalles"

```typescript
notificarRechazo(ticketId: number, observacion?: string): void {
  const mensaje = `Rampla rechazada para Ticket #${ticketId}${observacion ? ': ' + observacion : ''}`;
  this.agregarNotificacion(
    mensaje,
    ticketId,
    'error',
    'alta',
    ['planta', 'cd', 'admin'],
    '❌',
    { texto: 'Ver Detalles', url: `/tickets/${ticketId}` }
  );
}
```

---

## 🎨 Componente Visual (NotificacionesPanelComponent)

### Uso en Plantillas

Para integrar el panel de notificaciones en cualquier dashboard:

```html
<app-notificaciones-panel></app-notificaciones-panel>
```

### Características del Panel

1. **Botón Flotante**
   - Posición fija (bottom-right)
   - Badge con contador de no leídas
   - Animación de pulso cuando hay notificaciones

2. **Panel Deslizante**
   - Ancho: 450px (100% en móviles)
   - Animación suave de entrada/salida
   - Overlay oscuro al abrir

3. **Items de Notificación**
   - Indicador de prioridad (barra lateral coloreada)
   - Icono del tipo de notificación
   - Mensaje y metadatos (ticket ID, tiempo)
   - Botón de acción principal
   - Controles (marcar leída, eliminar)

4. **Código de Colores**
   - **Crítica**: Rojo (#F44336) con pulso
   - **Alta**: Naranja (#FF9800) con pulso
   - **Media**: Amarillo (#FFC107)
   - **Baja**: Azul (#2196F3)

---

## 🔧 Configuración en Dashboards

Cada dashboard debe configurar su rol en el `ngOnInit`:

### Dashboard Planta
```typescript
async ngOnInit(): Promise<void> {
  this.notificationService.setRolUsuario('planta');
  // ... resto del código
}
```

### Dashboard CD
```typescript
async ngOnInit(): Promise<void> {
  this.notificationService.setRolUsuario('cd');
  // ... resto del código
}
```

### Dashboard Admin
```typescript
async ngOnInit(): Promise<void> {
  this.notificationService.setRolUsuario('admin');
  // ... resto del código
}
```

### Dashboard Galpón
```typescript
async ngOnInit(): Promise<void> {
  this.notificationService.setRolUsuario('galpon');
  // ... resto del código
}
```

---

## 🔔 Notificaciones Nativas del Navegador

### Funcionamiento

1. **Solicitud de Permiso**
   - Se solicita automáticamente al iniciar el servicio
   - El usuario puede aceptar o denegar
   - El estado se guarda en la configuración del navegador

2. **Cuándo se Muestran**
   - Solo para notificaciones de prioridad **Alta** o **Crítica**
   - Cuando el usuario está fuera de la aplicación o en otra pestaña
   - Con sonido y vibración (si está soportado)

3. **Características**
   - Título: "Sistema de Ramplas" con emoji del tipo
   - Cuerpo: Mensaje completo
   - Icono: Logo de la aplicación
   - Requiere interacción: Sí para error/warning
   - Al hacer clic: Enfoca la ventana y navega a la URL de acción

### Ejemplo de Notificación Nativa

```typescript
private mostrarNotificacionNativa(
  mensaje: string,
  tipo: 'info' | 'warning' | 'success' | 'error',
  ticketId: number,
  accion?: { texto: string; url: string }
): void {
  const notification = new Notification(`✅ Sistema de Ramplas`, {
    body: mensaje,
    icon: '/favicon.ico',
    requireInteraction: tipo === 'error' || tipo === 'warning',
  });

  notification.onclick = () => {
    window.focus();
    if (accion?.url) {
      window.location.href = accion.url;
    }
  };
}
```

---

## 🎵 Sistema de Sonidos

### Archivos de Audio

El sistema soporta diferentes sonidos según la prioridad:

```
assets/sounds/
├── notification.mp3          # Prioridad media/baja
├── notification-alta.mp3     # Prioridad alta
└── notification-critica.mp3  # Prioridad crítica
```

### Volúmenes

- **Crítica**: 70%
- **Alta**: 50%
- **Media/Baja**: 30%

> **Nota**: Si los archivos de audio no existen, el navegador simplemente ignorará el error sin afectar la funcionalidad.

---

## 📱 Responsive Design

El panel se adapta automáticamente a dispositivos móviles:

- **Desktop**: Panel de 450px desde la derecha
- **Mobile**: Panel de ancho completo (100%)
- **Botón flotante**: Siempre visible y accesible

---

## 🧪 Testing

Para probar el sistema de notificaciones:

1. **Iniciar sesión** con diferentes roles
2. **Verificar filtrado**: Solo deben aparecer notificaciones relevantes
3. **Probar prioridades**: 
   - Baja/Media: Solo en la app
   - Alta/Crítica: Notificación nativa del navegador
4. **Acciones**: Hacer clic en "Ver Ticket" debe navegar correctamente
5. **Marcar como leída**: Debe actualizar el badge y el estado visual

---

## 🔄 Migración desde Sistema Anterior

### Cambios en el Código

**Antes:**
```typescript
this.notificationService.agregarNotificacion(mensaje, ticketId, 'info');
```

**Ahora:**
```typescript
this.notificationService.agregarNotificacion(
  mensaje,
  ticketId,
  'info',
  'alta',              // Nueva: prioridad
  ['cd', 'admin'],     // Nueva: roles destinatarios
  '🚨',                // Nueva: icono personalizado
  { texto: 'Ver Ticket', url: `/tickets/${ticketId}` } // Nueva: acción
);
```

### Compatibilidad

El sistema es **retrocompatible**. Las llamadas antiguas siguen funcionando con valores por defecto:
- Prioridad: `'media'`
- Roles: Todos los roles
- Sin icono ni acción personalizada

---

## 🎓 Mejores Prácticas

1. **Definir Roles Correctamente**
   - Siempre configurar el rol al iniciar el dashboard
   - Un usuario solo debe tener un rol activo

2. **Prioridades Apropiadas**
   - **Crítica**: Solo para emergencias (tickets >2h sin asignar)
   - **Alta**: Eventos importantes que requieren atención pronta
   - **Media**: Información relevante estándar
   - **Baja**: Actualizaciones de estado normales

3. **Acciones Útiles**
   - Siempre proporcionar una URL de acción cuando sea posible
   - Texto claro y orientado a la acción ("Ver Ticket", "Asignar Ahora")

4. **Mensajes Claros**
   - Incluir contexto suficiente (IDs, nombres, estados)
   - Usar emojis para mejor visualización
   - Mantener mensajes concisos pero informativos

---

## 🚀 Próximos Pasos (Futuras Mejoras)

- [ ] Configuración de preferencias de notificación por usuario
- [ ] Historial completo de notificaciones con paginación
- [ ] Agrupación de notificaciones similares
- [ ] Sincronización entre dispositivos
- [ ] Templates personalizables para notificaciones
- [ ] Estadísticas de notificaciones enviadas/leídas

---

## 📞 Soporte

Para problemas o preguntas sobre el sistema de notificaciones:
- Revisar la consola del navegador para logs
- Verificar permisos del navegador para notificaciones
- Comprobar que el rol esté configurado correctamente en el dashboard
