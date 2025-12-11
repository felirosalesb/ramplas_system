# Manual de Usuario - Sistema de Gestión de Ramplas

## Índice
1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Manual - Usuario Planta](#manual---usuario-planta)
4. [Manual - Usuario Centro de Distribución (CD)](#manual---usuario-centro-de-distribución-cd)
5. [Manual - Usuario Galpón/Bodega](#manual---usuario-galpónbodega)
6. [Monitor de Ramplas](#monitor-de-ramplas)
7. [Sistema de Notificaciones](#sistema-de-notificaciones)
8. [Preguntas Frecuentes (FAQ)](#preguntas-frecuentes-faq)
9. [Soporte Técnico](#soporte-técnico)

---

## Introducción

### ¿Qué es el Sistema de Gestión de Ramplas?

El Sistema de Gestión de Ramplas es una herramienta web que permite coordinar el transporte de pallets entre las plantas de producción, el galpón de almacenamiento y el Centro de Distribución (CD). 

### Funcionalidades principales

- ✅ **Solicitar ramplas** para retirar pallets de producción
- ✅ **Solicitar pallets vacíos** desde el galpón
- ✅ **Seguimiento en tiempo real** del estado de cada solicitud
- ✅ **Notificaciones instantáneas** de cambios de estado
- ✅ **Historial completo** de cada ticket
- ✅ **Monitoreo de ramplas** disponibles y en servicio

### Tipos de Solicitud

**1. Retiro de Pallets Producción**
- Planta solicita una rampla para retirar pallets llenos
- La rampla va de CD a Planta, se carga y regresa al CD

**2. Solicitar Pallets Vacíos**
- Planta solicita pallets vacíos para la producción
- La rampla va de CD a Galpón, se carga con pallets vacíos y va a Planta

---

## Acceso al Sistema

### URL del Sistema

```
https://[tu-dominio].vercel.app
```

### Inicio de Sesión

1. Abra su navegador web (Chrome, Firefox, Edge o Safari)
2. Ingrese la URL del sistema
3. Introduzca su **correo electrónico** y **contraseña**
4. Haga clic en **"Iniciar Sesión"**

![Pantalla de Login](assets/images/login-screen.png)

### Recuperar Contraseña

Si olvidó su contraseña:
1. Haga clic en **"¿Olvidó su contraseña?"**
2. Ingrese su correo electrónico
3. Recibirá un correo con instrucciones para restablecer su contraseña
4. Siga el enlace del correo y establezca una nueva contraseña

### Cerrar Sesión

Para salir del sistema:
1. Haga clic en su nombre de usuario (esquina superior derecha)
2. Seleccione **"Cerrar Sesión"**

---

## Manual - Usuario Planta

### Vista General

Como usuario de Planta, usted puede:
- ✅ Crear solicitudes de retiro de pallets
- ✅ Solicitar pallets vacíos al galpón
- ✅ Confirmar la llegada de ramplas
- ✅ Gestionar la carga de ramplas
- ✅ Ver el estado de sus solicitudes

### Dashboard de Planta

Al iniciar sesión, verá el **Dashboard de Planta** con:

**Secciones principales:**
1. **Estadísticas rápidas** (tarjetas superiores)
   - Tickets activos
   - Ramplas en proceso
   - Solicitudes completadas

2. **Pestañas de trabajo:**
   - **Mis Tickets**: Todas sus solicitudes
   - **Crear Nueva Solicitud**: Formulario para solicitar ramplas

### Crear una Solicitud de Retiro de Pallets

**Paso 1:** Haga clic en la pestaña **"Crear Nueva Solicitud"**

**Paso 2:** Complete el formulario:
- **Tipo de Solicitud**: Seleccione **"Retiro pallets producción"**
- **Número de Muelle Planta**: Ingrese el número de muelle donde se cargará la rampla
- Haga clic en **"Crear Solicitud"**

**Paso 3:** El sistema:
- ✅ Crea el ticket con estado **"Solicitud Creada"**
- ✅ Notifica automáticamente al Centro de Distribución
- ✅ El ticket aparecerá en su lista de "Mis Tickets"

### Crear una Solicitud de Pallets Vacíos

**Paso 1:** Haga clic en la pestaña **"Crear Nueva Solicitud"**

**Paso 2:** Complete el formulario:
- **Tipo de Solicitud**: Seleccione **"Solicitar Pallets vacíos"**
- **Número de Muelle Planta**: Ingrese el número de muelle
- **Cantidad de Pallets**: Ingrese la cantidad de pallets vacíos necesarios (mínimo 1)
- Haga clic en **"Crear Solicitud"**

**Paso 3:** El sistema:
- ✅ Crea el ticket con estado **"Pendiente Aprobación Galpón"**
- ✅ Notifica al Galpón para aprobación
- ✅ Una vez aprobado, notifica al CD para asignación de rampla

### Confirmar Llegada de Rampla

Cuando una rampla llega a su planta, recibirá una notificación.

**Paso 1:** En "Mis Tickets", busque el ticket con estado **"Rampla en Tránsito a Planta"**

**Paso 2:** Haga clic en el botón **"Confirmar Llegada"**

**Paso 3:** Seleccione una de las opciones:

**Opción A: Aceptar Rampla**
- La rampla está en perfectas condiciones
- Haga clic en **"Aceptar"**
- Estado cambia a **"Rampla en Planta"**

**Opción B: Aceptar con Observación**
- La rampla tiene un problema menor pero se puede usar
- Seleccione el motivo de la observación:
  - ☐ Cortina no cierra
  - ☐ Paredes en mal estado
  - ☐ Piso en mal estado (lata)
  - ☐ Rampla sucia
- Haga clic en **"Aceptar con Observación"**
- Estado cambia a **"Rampla en Planta"**
- CD recibirá la observación

**Opción C: Rechazar Rampla**
- La rampla NO se puede usar debido a problemas graves
- Seleccione el motivo del rechazo (mismas opciones que observación)
- Haga clic en **"Rechazar"**
- Estado cambia a **"Rechazada"**
- La rampla se libera y CD es notificado

### Iniciar Carga

Una vez confirmada la llegada de la rampla:

**Paso 1:** En el ticket con estado **"Rampla en Planta"**, haga clic en **"Iniciar Carga"**

**Paso 2:** El sistema:
- ✅ Cambia el estado a **"Carga iniciada"**
- ✅ Registra la hora de inicio
- ✅ Notifica al CD

### Finalizar Carga

Una vez completada la carga:

**Paso 1:** En el ticket con estado **"Carga iniciada"**, haga clic en **"Finalizar Carga"**

**Paso 2:** Ingrese la **cantidad de pallets cargados** (dato obligatorio)

**Paso 3:** Haga clic en **"Confirmar"**

**Paso 4:** El sistema:
- ✅ Cambia el estado a **"Cargado - Espera Chofer"**
- ✅ Registra la cantidad de pallets
- ✅ Notifica al CD que la rampla está lista

### Estados de un Ticket - Vista Planta

| Estado | Significado | Acción Disponible |
|--------|-------------|-------------------|
| **Solicitud Creada** | Ticket recién creado | Esperar asignación de CD |
| **Pendiente Aprobación Galpón** | Solo para Solicitar Pallets Vacíos | Esperar aprobación |
| **Pendiente Asignación** | Esperando que CD asigne rampla | Esperar (alerta si > 2 horas) |
| **Rampla en Tránsito a Planta** | Rampla en camino a su planta | **Confirmar Llegada** |
| **Rampla en Planta** | Rampla confirmada en planta | **Iniciar Carga** |
| **Carga iniciada** | Carga en proceso | **Finalizar Carga** |
| **Cargado - Espera Chofer** | Rampla lista, esperando chofer | Esperar llegada a CD |
| **Asignada a Muelle CD** | Rampla llegó al CD, muelle asignado | CD gestiona |
| **Inicio Descarga** | CD está descargando | CD gestiona |
| **Fin Descarga** | Descarga completada | - |
| **Libre** | Ciclo completado | - |
| **Rechazada** | Ticket rechazado | Ver motivo en detalle |
| **Cancelado por CD** | CD canceló el ticket | Ver motivo en detalle |

### Ver Detalle de Ticket

Para ver información completa de un ticket:

**Paso 1:** Haga clic en el botón **"Ver Detalle"** en cualquier ticket

**Paso 2:** Se abre una ventana modal con:
- 📋 **Información General**: ID, tipo, estado, fechas
- 🚛 **Rampla Asignada**: Nombre y tipo de rampla
- 📍 **Planta y Muelle**: Datos de origen
- 📦 **Cantidad de Pallets**: Solicitados y cargados
- 💬 **Observaciones**: Aceptación con observación o motivos de rechazo
- 🕐 **Línea de Tiempo**: Historial completo de cambios de estado

**Paso 3:** Haga clic en **"Cerrar"** o fuera de la ventana para salir

### Consejos para Usuario Planta

✅ **Revise las notificaciones** regularmente para estar al tanto de cambios
✅ **Confirme la llegada** de ramplas lo antes posible
✅ **Seleccione el motivo correcto** al aceptar con observación o rechazar
✅ **Registre la cantidad exacta** de pallets al finalizar la carga
✅ **Use el detalle del ticket** para ver el historial completo

---

## Manual - Usuario Centro de Distribución (CD)

### Vista General

Como usuario del Centro de Distribución, usted puede:
- ✅ Asignar ramplas a solicitudes pendientes
- ✅ Monitorear ramplas en planta
- ✅ Gestionar llegada y descarga en CD
- ✅ Asignar muelles de descarga
- ✅ Cancelar tickets en tránsito
- ✅ Rechazar cargas que no cumplan requisitos

### Dashboard CD

Al iniciar sesión, verá el **Dashboard CD** con:

**Estadísticas rápidas (tarjetas superiores):**
- **Pendientes de Asignar**: Tickets esperando asignación de rampla
- **Asignado**: Ramplas asignadas y en proceso de carga en planta
- **En Tránsito a CD**: Ramplas cargadas en camino o en descarga en CD
- **Ramplas Disponibles**: Ramplas libres para asignar

**Resumen por Estados del Flujo:**
- Gráfico visual con cantidad de ramplas en cada etapa del proceso

**Pestañas de trabajo:**
1. **Pendientes de Asignar**
2. **Asignado**
3. **En Tránsito a CD**

### Asignar Rampla a Solicitud Pendiente

**Paso 1:** Vaya a la pestaña **"Pendientes de Asignar"**

**Paso 2:** Verá todas las solicitudes en estado **"Pendiente Asignación"**

⚠️ **IMPORTANTE**: Si un ticket tiene más de 2 horas sin asignar, aparecerá marcado como **URGENTE** con una alerta

**Paso 3:** Haga clic en el botón **"Asignar Rampla"** del ticket que desea procesar

**Paso 4:** Seleccione una rampla de la lista de **ramplas disponibles**

**Paso 5:** Haga clic en **"Confirmar Asignación"**

**Paso 6:** El sistema:
- ✅ Asigna la rampla al ticket
- ✅ Cambia el estado según el destino:
  - **"Rampla en Tránsito a Planta"** (para Retiro de Pallets)
  - **"Rampla en Tránsito a Galpón"** (para Solicitar Pallets Vacíos)
- ✅ La rampla pasa a estado **"En Servicio"**
- ✅ Notifica a Planta/Galpón sobre la asignación

### Monitorear Ramplas Asignadas

**Pestaña "Asignado":**

Aquí verá todos los tickets con ramplas asignadas que están en proceso de carga:

**Estados incluidos:**
- Rampla en Tránsito a Galpón/Planta
- Rampla en Planta/Galpón
- Carga iniciada
- Fin de Carga

**Información visible:**
- Ticket ID
- Tipo de solicitud
- Rampla asignada
- Estado actual
- Muelle Planta
- Nombre de Planta
- Observaciones (si hay)
- Tiempo transcurrido

**Acción disponible:**
- **Ver Detalle**: Ver historial completo del ticket
- **Cancelar Ticket**: Si la rampla aún está en tránsito (ver sección siguiente)

### Cancelar Ticket

Si necesita cancelar un ticket mientras la rampla está en tránsito:

**Paso 1:** En la pestaña **"Asignado"**, localice el ticket con estado:
- "Rampla en Tránsito a Galpón"
- "Rampla en Tránsito a Planta"

**Paso 2:** Haga clic en el botón **"Cancelar Ticket"**

**Paso 3:** Seleccione el **motivo de cancelación**:
- ☐ Muelle obstruido
- ☐ Otro (debe especificar)

**Paso 4:** Si seleccionó "Otro", escriba el motivo en el campo de texto

**Paso 5:** Haga clic en **"Confirmar Cancelación"**

**Paso 6:** El sistema:
- ✅ Cambia el estado a **"Cancelado por CD"**
- ✅ Libera la rampla (vuelve a estado "Libre")
- ✅ Libera el muelle (si estaba asignado)
- ✅ Notifica a Planta con el motivo de la cancelación
- ✅ Notifica a Administración

### Gestionar Ramplas en Tránsito a CD

**Pestaña "En Tránsito a CD":**

Aquí verá todas las ramplas cargadas que están:
- En camino al CD
- Esperando asignación de muelle
- En proceso de descarga

**Estados incluidos:**
- Cargado - Espera Chofer
- Asignada a Muelle CD
- Inicio Descarga

### Asignar Muelle de Descarga

Cuando una rampla cargada llega al CD:

**Paso 1:** En la pestaña **"En Tránsito a CD"**, localice el ticket con estado **"Cargado - Espera Chofer"**

**Paso 2:** Haga clic en el menú de acciones (⋮) y seleccione **"Asignar Muelle CD"**

**Paso 3:** Seleccione un **muelle disponible** de la lista

**Paso 4:** Haga clic en **"Confirmar Asignación"**

**Paso 5:** El sistema:
- ✅ Asigna el muelle al ticket
- ✅ Cambia el estado a **"Asignada a Muelle CD"**
- ✅ El muelle pasa a estado "Ocupado"
- ✅ Notifica a Planta

### Iniciar Descarga

Una vez la rampla esté en el muelle:

**Paso 1:** En el ticket con estado **"Asignada a Muelle CD"**, abra el menú de acciones (⋮)

**Paso 2:** Haga clic en **"Iniciar Descarga"**

**Paso 3:** El sistema:
- ✅ Cambia el estado a **"Inicio Descarga"**
- ✅ Registra la hora de inicio
- ✅ Notifica a Planta

### Rechazar Carga

Si la carga no cumple con los requisitos de calidad:

**Paso 1:** En el ticket con estado **"Asignada a Muelle CD"** o **"Inicio Descarga"**, abra el menú de acciones (⋮)

**Paso 2:** Haga clic en **"Rechazar Carga"**

**Paso 3:** Seleccione el **motivo del rechazo**:
- ☐ etiqueta borrosa
- ☐ no cumple con pallet perfecto
- ☐ Otro (debe especificar)

**Paso 4:** Si seleccionó "Otro", escriba el motivo en el campo de texto

**Paso 5:** Haga clic en **"Confirmar Rechazo"**

**Paso 6:** El sistema:
- ✅ Cambia el estado a **"Rechazada"**
- ✅ Libera la rampla y el muelle
- ✅ Registra el motivo del rechazo
- ✅ Notifica a Planta con el motivo
- ✅ Notifica a Administración con el nombre de la rampla para considerar su deshabilitación

### Finalizar Descarga

Una vez completada la descarga:

**Paso 1:** En el ticket con estado **"Inicio Descarga"**, abra el menú de acciones (⋮)

**Paso 2:** Haga clic en **"Finalizar Descarga"**

**Paso 3:** El sistema:
- ✅ Cambia el estado a **"Libre"**
- ✅ Libera la rampla (vuelve a estado "Libre")
- ✅ Libera el muelle (vuelve a estado "Libre")
- ✅ Registra la hora de finalización
- ✅ Notifica a Planta que el ticket está completado

### Sistema de Alertas para CD

El sistema genera alertas automáticas:

**Alerta 1: Ticket sin asignar por 2 horas**
- 🔴 Notificación cada 2 horas si un ticket sigue en "Pendiente Asignación"
- El ticket aparece marcado como **URGENTE** en el dashboard

**Alerta 2: Rampla en tránsito por más de 15 minutos**
- ⚠️ Notificación si una rampla lleva más de 15 minutos en tránsito
- Ayuda a detectar posibles retrasos

**Alerta 3: Rampla esperando chofer por más de 30 minutos**
- 🚨 Notificación si una rampla lleva más de 30 minutos en "Cargado - Espera Chofer"
- Requiere seguimiento para evitar demoras

### Resumen de Estados del Flujo

El dashboard muestra un resumen visual con:
- Cantidad de ramplas en cada estado
- Iconos representativos
- Colores según prioridad:
  - 🔴 Rojo: Rechazada, Pendiente
  - 🟡 Amarillo: Espera
  - 🔵 Azul: En proceso
  - 🟢 Verde: Completado

### Consejos para Usuario CD

✅ **Priorice tickets urgentes** (marcados en rojo con alerta de 2 horas)
✅ **Asigne ramplas rápidamente** para evitar demoras
✅ **Use el monitor de estados** para tener visibilidad completa del flujo
✅ **Cancele tickets solo cuando sea necesario** y siempre con motivo claro
✅ **Rechace cargas** que no cumplan estándares de calidad
✅ **Libere muelles rápidamente** al finalizar descargas
✅ **Revise alertas** de ramplas en tránsito prolongado

---

## Manual - Usuario Galpón/Bodega

### Vista General

Como usuario del Galpón, usted puede:
- ✅ Aprobar o rechazar solicitudes de pallets vacíos
- ✅ Confirmar llegada de ramplas al galpón
- ✅ Gestionar carga de pallets vacíos
- ✅ Monitorear solicitudes pendientes

### Dashboard Galpón

Al iniciar sesión, verá el **Dashboard Galpón** con:

**Estadísticas rápidas:**
- Solicitudes pendientes de aprobación
- Ramplas en proceso de carga
- Solicitudes completadas

**Pestañas de trabajo:**
1. **Pendientes de Aprobación**
2. **En Proceso**
3. **Historial**

### Aprobar Solicitud de Pallets Vacíos

**Paso 1:** Vaya a la pestaña **"Pendientes de Aprobación"**

**Paso 2:** Verá todas las solicitudes en estado **"Pendiente Aprobación Galpón"**

**Información visible:**
- Ticket ID
- Planta solicitante
- Muelle Planta
- Cantidad de pallets solicitados
- Fecha de creación

**Paso 3:** Revise la solicitud y haga clic en **"Aprobar"**

**Paso 4:** El sistema:
- ✅ Cambia el estado a **"Pendiente Asignación"**
- ✅ Notifica al CD para que asigne una rampla
- ✅ Establece alerta de 2 horas para CD

**Rechazar solicitud:**
- Si la solicitud no puede ser atendida, haga clic en **"Rechazar"**
- Ingrese el motivo del rechazo
- El ticket se marca como **"Rechazada"**
- Se notifica a Planta con el motivo

### Confirmar Llegada de Rampla al Galpón

Cuando una rampla llega al galpón:

**Paso 1:** En la pestaña **"En Proceso"**, localice el ticket con estado **"Rampla en Tránsito a Galpón"**

**Paso 2:** Haga clic en **"Confirmar Llegada"**

**Paso 3:** El sistema:
- ✅ Cambia el estado a **"Rampla en Galpón"**
- ✅ Registra la hora de llegada
- ✅ Notifica al CD

### Iniciar Carga en Galpón

Una vez confirmada la llegada:

**Paso 1:** En el ticket con estado **"Rampla en Galpón"**, haga clic en **"Iniciar Carga"**

**Paso 2:** El sistema:
- ✅ Cambia el estado a **"Carga Iniciada Galpón"**
- ✅ Registra la hora de inicio

### Finalizar Carga en Galpón

Una vez completada la carga de pallets vacíos:

**Paso 1:** En el ticket con estado **"Carga Iniciada Galpón"**, haga clic en **"Finalizar Carga"**

**Paso 2:** Ingrese la **cantidad de pallets vacíos cargados**

**Paso 3:** Haga clic en **"Confirmar"**

**Paso 4:** El sistema:
- ✅ Cambia el estado a **"Rampla Cargada - Tránsito CD"**
- ✅ Registra la cantidad de pallets
- ✅ Notifica al CD que la rampla está en camino

### Estados - Vista Galpón

| Estado | Significado | Acción Disponible |
|--------|-------------|-------------------|
| **Pendiente Aprobación Galpón** | Solicitud recibida | **Aprobar / Rechazar** |
| **Rampla en Tránsito a Galpón** | Rampla en camino | **Confirmar Llegada** |
| **Rampla en Galpón** | Rampla en galpón | **Iniciar Carga** |
| **Carga Iniciada Galpón** | Carga en proceso | **Finalizar Carga** |
| **Rampla Cargada - Tránsito CD** | Rampla cargada, en camino a CD | Esperar |

### Consejos para Usuario Galpón

✅ **Apruebe solicitudes rápidamente** para no demorar el proceso
✅ **Verifique disponibilidad de pallets** antes de aprobar
✅ **Confirme llegadas de inmediato** al recibir ramplas
✅ **Registre cantidades exactas** al finalizar cargas
✅ **Rechace solo con motivo válido** y comunique alternativas a Planta

---

## Monitor de Ramplas

### Acceso al Monitor

El **Monitor de Ramplas** es accesible para todos los roles desde el menú principal.

### Información Mostrada

**Vista de Cuadrícula:**
- Muestra todas las ramplas del sistema
- Cada tarjeta incluye:
  - 🚛 **Nombre de Rampla** (ej: Rampla 01)
  - 📍 **Estado**: Libre / En Servicio
  - 🎫 **Ticket Asociado** (si está en servicio)
  - 🏭 **Destino**: Planta de destino (si aplica)
  - 📋 **Tipo de Solicitud**: Retiro / Solicitar Pallets

**Vista de Lista:**
- Tabla con todas las ramplas
- Columnas: Nombre, Estado, Ticket, Destino Planta, Tipo
- Opción de búsqueda y filtrado

### Interpretación de Estados

**Rampla Libre** (verde):
- Disponible para asignar
- No tiene ticket asociado

**Rampla En Servicio** (azul):
- Asignada a un ticket
- En proceso de transporte o carga
- Muestra destino y ticket activo

### Uso del Monitor

✅ **CD**: Ver ramplas disponibles para asignar
✅ **Planta**: Verificar qué rampla está asignada a su ticket
✅ **Galpón**: Ver ramplas en proceso de carga de pallets vacíos
✅ **Admin**: Supervisión general del estado de la flota

---

## Sistema de Notificaciones

### Tipos de Notificaciones

El sistema envía notificaciones en tiempo real para mantenerlo informado:

**Notificaciones de Éxito** (verde):
- ✅ Ticket creado exitosamente
- ✅ Rampla asignada
- ✅ Carga completada

**Notificaciones de Información** (azul):
- ℹ️ Cambio de estado
- ℹ️ Rampla en camino

**Notificaciones de Advertencia** (amarillo):
- ⚠️ Ticket sin asignar por 2 horas
- ⚠️ Rampla en tránsito prolongado

**Notificaciones de Error** (rojo):
- 🔴 Ticket cancelado
- 🔴 Carga rechazada
- 🔴 Error en operación

### Visualización de Notificaciones

**Campana de notificaciones:**
- Ubicada en la esquina superior derecha
- Muestra un badge con el número de notificaciones no leídas
- Al hacer clic, se despliega la lista de notificaciones

**Notificaciones popup:**
- Aparecen automáticamente en la pantalla
- Incluyen sonido de alerta (según tipo)
- Se cierran automáticamente después de 5 segundos
- Puede cerrarlas manualmente con la "X"

### Gestión de Notificaciones

**Marcar como leída:**
- Haga clic en la notificación
- Se abrirá el detalle del ticket asociado (si aplica)

**Ver historial:**
- Haga clic en el icono de campana
- Verá todas las notificaciones recientes
- Scroll para ver notificaciones antiguas

**Filtrado por rol:**
- El sistema solo muestra notificaciones relevantes para su rol
- Ejemplo: Usuario Planta solo ve notificaciones de sus tickets

### Notificaciones por Microsoft Teams (Opcional)

Si su organización configuró integración con Teams:
- Recibirá notificaciones importantes también en Teams
- Canal específico del Sistema de Ramplas
- Mensajes con enlace directo al ticket

---

## Preguntas Frecuentes (FAQ)

### Generales

**P: ¿Qué navegadores son compatibles?**
R: Google Chrome, Mozilla Firefox, Microsoft Edge y Safari (versiones recientes).

**P: ¿Puedo usar el sistema desde mi teléfono móvil?**
R: Sí, el sistema es responsive y funciona en dispositivos móviles. Use gestos de deslizamiento para cambiar de pestaña.

**P: ¿Cómo sé si el sistema está actualizado?**
R: El sistema se actualiza automáticamente. Si hay cambios importantes, verá una notificación al iniciar sesión.

### Para Usuario Planta

**P: ¿Cuánto tiempo tarda CD en asignar una rampla?**
R: Usualmente entre 15-30 minutos. Si pasan 2 horas sin asignación, CD recibe una alerta automática.

**P: ¿Puedo cancelar mi solicitud?**
R: No directamente. Contacte al CD para solicitar la cancelación.

**P: ¿Qué hago si la rampla llega con problemas graves?**
R: Seleccione "Rechazar" al confirmar llegada y especifique el motivo. La rampla será liberada.

**P: ¿Puedo editar la cantidad de pallets después de crear el ticket?**
R: No, la cantidad se registra al finalizar la carga. Asegúrese de ingresar el valor correcto en ese momento.

**P: ¿Qué significa "Aceptar con Observación"?**
R: Significa que la rampla tiene un problema menor (ej: cortina no cierra bien) pero se puede usar. El CD será notificado para dar seguimiento.

### Para Usuario CD

**P: ¿Qué hago si no hay ramplas disponibles?**
R: Priorice tickets urgentes (> 2 horas). Considere finalizar descargas en proceso para liberar ramplas.

**P: ¿Puedo reasignar una rampla a otro ticket?**
R: No directamente. Debe cancelar el ticket actual primero y luego asignar la rampla al nuevo ticket.

**P: ¿Cuándo debo rechazar una carga?**
R: Cuando los pallets no cumplan con los estándares de calidad (ej: etiquetas borrosas, pallets imperfectos). Siempre especifique el motivo.

**P: ¿Qué pasa si cancelo un ticket?**
R: La rampla y el muelle (si estaba asignado) se liberan automáticamente. Planta recibe notificación con el motivo.

**P: ¿Cómo sé si una rampla está tardando mucho en llegar?**
R: El sistema envía alertas automáticas:
- ⚠️ Más de 15 minutos en tránsito
- 🚨 Más de 30 minutos esperando chofer

### Para Usuario Galpón

**P: ¿Cuánto tiempo tengo para aprobar una solicitud?**
R: No hay límite, pero es recomendable aprobar en menos de 1 hora para no demorar el proceso.

**P: ¿Qué hago si no tengo pallets vacíos disponibles?**
R: Rechace la solicitud e indique el motivo (ej: "Sin stock disponible"). Coordine con Planta una fecha futura.

**P: ¿Puedo aprobar parcialmente una solicitud?**
R: No, debe aprobar o rechazar completamente. Si hay una cantidad menor disponible, coordine directamente con Planta.

### Problemas Técnicos

**P: No recibo notificaciones**
R: Verifique que:
- Tiene sesión activa
- El navegador permite notificaciones del sitio
- No está en modo "No molestar" del navegador

**P: El sistema no actualiza los datos**
R: 
- Refresque la página (F5 o botón de refresco)
- Verifique su conexión a Internet
- Cierre sesión y vuelva a ingresar

**P: No puedo ver el botón de acción que necesito**
R: Verifique que el ticket esté en el estado correcto para esa acción. Use "Ver Detalle" para revisar el estado actual.

**P: Aparece un error al intentar realizar una acción**
R: 
- Refresque la página e intente nuevamente
- Verifique que el ticket no haya cambiado de estado
- Si persiste, contacte a Soporte Técnico

---

## Soporte Técnico

### Contacto de Soporte

**Horario de atención:**
- Lunes a Viernes: 8:00 AM - 6:00 PM
- Sábados: 8:00 AM - 1:00 PM

**Canales de soporte:**
- 📧 **Email**: soporte-ramplas@empresa.com
- 📞 **Teléfono**: +56 X XXXX XXXX (opción 2)
- 💬 **Teams**: Canal "Soporte Sistema Ramplas"

### Información a Proporcionar

Al contactar soporte, tenga a mano:
- ✅ Su nombre y rol (Planta/CD/Galpón)
- ✅ Número de ticket (si aplica)
- ✅ Descripción del problema
- ✅ Capturas de pantalla (si es posible)
- ✅ Mensaje de error (si aparece)

### Escalamiento

**Nivel 1 - Soporte Técnico:**
- Problemas de acceso
- Dudas de funcionamiento
- Errores comunes

**Nivel 2 - Desarrollo:**
- Bugs del sistema
- Problemas de integración
- Solicitudes de nuevas funcionalidades

**Nivel 3 - Administrador del Sistema:**
- Gestión de usuarios
- Configuraciones avanzadas
- Deshabilitación/habilitación de ramplas o muelles

### Recursos Adicionales

**Documentación:**
- Manual Técnico para Desarrolladores
- Videos tutoriales (próximamente)
- Guías rápidas por rol

**Capacitación:**
- Solicite sesiones de capacitación para nuevos usuarios
- Talleres de actualización ante cambios importantes

---

**Versión del Manual:** 1.0  
**Última actualización:** Diciembre 2025  
**Sistema:** Gestión de Ramplas v1.0

---

### Glosario de Términos

- **Rampla**: Camión utilizado para transporte de pallets
- **Ticket**: Solicitud de transporte en el sistema
- **Muelle**: Punto de carga/descarga (en Planta o CD)
- **CD**: Centro de Distribución
- **Galpón**: Almacén de pallets vacíos
- **Pallet Perfecto**: Pallet que cumple con estándares de calidad
- **Estado**: Etapa actual del proceso de un ticket
- **Observación**: Nota sobre condición de rampla al aceptar
- **Rechazo**: Cancelación de ticket por incumplimiento de requisitos

---

¡Gracias por usar el Sistema de Gestión de Ramplas!
