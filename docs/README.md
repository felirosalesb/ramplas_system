# Sistema de Gestión de Ramplas 🚚

Sistema web para gestionar el flujo de ramplas entre plantas de producción, centros de distribución (CD) y galpones de almacenamiento. Desarrollado con Angular 19 y Supabase.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Requisitos Previos](#requisitos-previos)
4. [Configuración Inicial](#configuración-inicial)
5. [Instalación](#instalación)
6. [Ejecución en Desarrollo](#ejecución-en-desarrollo)
7. [Compilación para Producción](#compilación-para-producción)
8. [Estructura del Proyecto](#estructura-del-proyecto)
9. [Configuración de Base de Datos](#configuración-de-base-de-datos)
10. [Roles y Permisos](#roles-y-permisos)
11. [Flujos de Trabajo](#flujos-de-trabajo)
12. [Documentación Técnica](#documentación-técnica)
13. [Solución de Problemas](#solución-de-problemas)
14. [Mantenimiento](#mantenimiento)

---

## 📖 Descripción General

El Sistema de Gestión de Ramplas es una aplicación web que automatiza y controla el flujo de ramplas (camiones/contenedores) entre diferentes puntos de una cadena logística:

- **Plantas de Producción**: Solicitan ramplas para retirar pallets de productos terminados o solicitar pallets vacíos
- **Centro de Distribución (CD)**: Asigna ramplas, gestiona muelles y coordina el transporte
- **Galpones**: Aprueban solicitudes y cargan pallets vacíos
- **Administradores**: Supervisan todo el sistema y gestionan recursos

### Características Principales

✅ Gestión de tickets con estados automáticos  
✅ Asignación inteligente de ramplas y muelles  
✅ Notificaciones en tiempo real con Supabase Realtime  
✅ Sistema de alertas (2h sin asignación, 15min en tránsito, 30min esperando chofer)  
✅ Auditoría completa con registro de tiempos  
✅ Reportes exportables a Excel  
✅ Interfaz responsive con Angular Material  
✅ Integración opcional con Microsoft Teams  

---

## 🛠 Tecnologías Utilizadas

### Frontend
- **Angular 19.2** - Framework principal
- **Angular Material 19.2** - Componentes UI
- **TypeScript 5.7** - Lenguaje de programación
- **RxJS 7.8** - Programación reactiva
- **XLSX** - Exportación de reportes a Excel

### Backend
- **Supabase** - Backend as a Service (PostgreSQL + Auth + Realtime)
- **PostgreSQL** - Base de datos relacional

### Herramientas de Desarrollo
- **Angular CLI 19.2** - Herramientas de desarrollo
- **Jasmine & Karma** - Testing

---

## ⚙️ Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener:

- **Node.js** 18.x o superior ([Descargar](https://nodejs.org/))
- **npm** 9.x o superior (incluido con Node.js)
- **Angular CLI** 19.x (se instalará globalmente)
- **Git** (para control de versiones)
- Cuenta en **Supabase** ([Registrarse gratis](https://supabase.com/))

### Verificar instalación

```bash
node --version    # Debe mostrar v18.x o superior
npm --version     # Debe mostrar 9.x o superior
```

---

## 🔧 Configuración Inicial

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com/](https://supabase.com/) y crea una cuenta
2. Crea un nuevo proyecto:
   - **Nombre**: `ramplas-system` (o el que prefieras)
   - **Región**: Elige la más cercana a tu ubicación
   - **Contraseña de base de datos**: Guárdala en un lugar seguro
3. Espera a que el proyecto se inicialice (2-3 minutos)

### 2. Obtener Credenciales de Supabase

Una vez creado el proyecto:

1. Ve a **Project Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL**: `https://[tu-proyecto].supabase.co`
   - **anon/public key**: La clave pública (empieza con `eyJ...`)

### 3. Configurar Base de Datos

1. Ve a **SQL Editor** en Supabase
2. Abre el archivo `database/database-schema.sql` de este proyecto
3. Copia todo el contenido y ejecútalo en el SQL Editor
4. Verifica que se crearon las tablas:
   - `usuarios`
   - `tickets`
   - `ramplas`
   - `muelles`
   - `registros_tiempo`
   - `notificaciones`

### 4. Configurar Autenticación

1. Ve a **Authentication** → **Providers**
2. Habilita **Email** como proveedor
3. Configura las URL de redirección (importante para producción)

### 5. Configurar Row Level Security (RLS)

**⚠️ IMPORTANTE**: Por seguridad, debes configurar políticas RLS en Supabase.

Ejecuta en SQL Editor:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ramplas ENABLE ROW LEVEL SECURITY;
ALTER TABLE muelles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_tiempo ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política para usuarios (cada usuario solo ve sus datos)
CREATE POLICY "Los usuarios pueden ver sus propios datos" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Política para tickets (ejemplo básico - ajustar según roles)
CREATE POLICY "Los usuarios autenticados pueden ver tickets" ON tickets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios pueden crear tickets" ON tickets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios pueden actualizar tickets" ON tickets
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Agregar políticas similares para otras tablas según tus necesidades de negocio
```

> **Nota**: Las políticas RLS deben ajustarse según tus reglas de negocio. Consulta la documentación de Supabase para políticas avanzadas.

---

## 📥 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd ramplas-system
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias listadas en `package.json`.

### 3. Configurar Variables de Entorno

#### Desarrollo (`src/environments/environment.ts`)

**⚠️ IMPORTANTE**: Reemplaza las credenciales de ejemplo con las tuyas.

```typescript
export const environment = {
    production: false,
    supabaseUrl: 'TU_SUPABASE_URL',  // Ej: https://xxxxx.supabase.co
    supabaseKey: 'TU_SUPABASE_ANON_KEY',  // Tu clave pública
    teamsWebhookUrl: 'TU_TEAMS_WEBHOOK_URL' // Opcional - Ver sección de Teams
};
```

#### Producción (`src/environments/environment.prod.ts`)

```typescript
export const environment = {
    production: true,
    supabaseUrl: 'TU_SUPABASE_URL_PRODUCCION',
    supabaseKey: 'TU_SUPABASE_ANON_KEY_PRODUCCION',
    teamsWebhookUrl: 'TU_TEAMS_WEBHOOK_URL_PRODUCCION' // Opcional
};
```

> **🔒 Seguridad**: Nunca subas tus credenciales reales a repositorios públicos. Usa variables de entorno o servicios como Vercel Environment Variables.

### 4. Configurar Microsoft Teams (Opcional)

Si deseas notificaciones en Microsoft Teams:

1. En Teams, ve al canal donde quieres recibir notificaciones
2. Click en **⋯** → **Connectors** → **Incoming Webhook**
3. Configura el webhook y copia la URL
4. Pégala en `teamsWebhookUrl` en tu archivo de environment

Si no usas Teams, puedes dejar el valor como cadena vacía `''`.

---

## 🚀 Ejecución en Desarrollo

### Iniciar Servidor de Desarrollo

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en: [http://localhost:4200/](http://localhost:4200/)

El servidor se recargará automáticamente cuando hagas cambios en el código.

### Usuarios de Prueba

Para probar el sistema, crea usuarios en Supabase:

1. Ve a **Authentication** → **Users**
2. Click en **Add User** → **Create new user**
3. Agrega email y contraseña
4. Copia el `UUID` del usuario
5. Inserta el usuario en la tabla `usuarios`:

```sql
INSERT INTO usuarios (id, email, rol, nombre, nombre_planta)
VALUES 
    ('uuid-del-usuario', 'planta@ejemplo.com', 'planta', 'Juan Pérez', 'Planta Santiago'),
    ('otro-uuid', 'cd@ejemplo.com', 'cd', 'María González', NULL),
    ('otro-uuid-mas', 'admin@ejemplo.com', 'admin', 'Admin Sistema', NULL);
```

**Roles disponibles:**
- `planta` - Operador de planta
- `cd` - Centro de distribución
- `galpon` - Operador de galpón
- `admin` - Administrador del sistema

---

## 📦 Compilación para Producción

### Build

```bash
npm run build
# o
ng build --configuration production
```

Los archivos compilados estarán en `dist/ramplas-system/browser/`.

### Verificar Build

```bash
# Instalar servidor estático
npm install -g http-server

# Servir la aplicación compilada
cd dist/ramplas-system/browser
http-server -p 8080
```

Abre [http://localhost:8080/](http://localhost:8080/) para verificar.

### Despliegue en Vercel (Recomendado)

1. Instala Vercel CLI:
```bash
npm install -g vercel
```

2. Inicia sesión:
```bash
vercel login
```

3. Despliega:
```bash
vercel --prod
```

4. Configura las variables de entorno en Vercel:
   - Ve a tu proyecto en [vercel.com](https://vercel.com/)
   - **Settings** → **Environment Variables**
   - Agrega:
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
     - `TEAMS_WEBHOOK_URL` (opcional)

> **Nota**: Vercel detecta automáticamente proyectos Angular y configura el build correctamente.

---

## 📁 Estructura del Proyecto

```
ramplas-system/
│
├── src/
│   ├── app/
│   │   ├── components/          # Componentes de la aplicación
│   │   │   ├── login/           # Pantalla de inicio de sesión
│   │   │   ├── dashboard-planta/    # Dashboard para operadores de planta
│   │   │   ├── dashboard-bodega/    # Dashboard para galpón/bodega
│   │   │   ├── dashboard-cd/        # Dashboard para centro de distribución
│   │   │   ├── monitor-ramplas/     # Monitor de ramplas (Admin)
│   │   │   ├── detalle-ticket/      # Vista detallada de ticket
│   │   │   ├── navbar/              # Barra de navegación
│   │   │   └── notificaciones/      # Centro de notificaciones
│   │   │
│   │   ├── services/            # Servicios de negocio
│   │   │   ├── supabase.service.ts      # Lógica de backend y DB
│   │   │   ├── notification.service.ts  # Sistema de notificaciones
│   │   │   └── alert.service.ts         # Alertas visuales
│   │   │
│   │   ├── guards/              # Protección de rutas
│   │   │   └── auth.guard.ts    # Guard de autenticación
│   │   │
│   │   ├── models/              # Modelos de datos TypeScript
│   │   │   └── models.ts        # Interfaces y tipos
│   │   │
│   │   ├── app.component.*      # Componente raíz
│   │   ├── app.config.ts        # Configuración de la app
│   │   ├── app.module.ts        # Módulo principal (si aplica)
│   │   └── app-routing.module.ts # Configuración de rutas
│   │
│   ├── environments/            # Configuración por entorno
│   │   ├── environment.ts       # Desarrollo
│   │   └── environment.prod.ts  # Producción
│   │
│   ├── assets/                  # Recursos estáticos
│   │   ├── images/              # Imágenes
│   │   └── sounds/              # Sonidos de notificación
│   │
│   ├── index.html               # HTML principal
│   ├── main.ts                  # Punto de entrada
│   └── styles.css               # Estilos globales
│
├── database/
│   └── database-schema.sql      # Script de creación de base de datos
│
├── docs/                        # Documentación del proyecto
│   ├── DOCUMENTACION_TECNICA.md           # Documentación técnica completa
│   ├── DOCUMENTACION_TECNICA_COMPLEMENTARIA.md  # Detalles avanzados
│   ├── MANUAL_USUARIO.md                  # Manual para usuarios finales
│   └── DOCUMENTACION_INDEX.md             # Índice de documentación
│
├── angular.json                 # Configuración de Angular
├── package.json                 # Dependencias del proyecto
├── tsconfig.json                # Configuración de TypeScript
├── README.md                    # Este archivo
└── CONFIGURACION_PENDIENTE.txt  # Configuraciones que requieren atención
```

---

## 🗄️ Configuración de Base de Datos

### Esquema de Datos

El sistema usa las siguientes tablas principales:

#### `usuarios`
- Gestiona usuarios del sistema con roles
- Vinculado a Supabase Auth (`auth.users`)

#### `tickets`
- Registros de solicitudes de ramplas
- Estados del flujo de trabajo
- Relaciones con ramplas, muelles y usuarios

#### `ramplas`
- Inventario de ramplas disponibles
- Estados: `Libre`, `En Servicio`
- Tipos: `frugon_cerrado`, `cortina`

#### `muelles`
- Puntos de carga/descarga
- Estados: `Libre`, `Ocupado`

#### `registros_tiempo`
- Auditoría de cambios de estado
- Historial completo de cada ticket

#### `notificaciones`
- Sistema de notificaciones persistentes
- Filtradas por rol de usuario

### Diagrama de Estados

Ver documentación completa en `docs/DOCUMENTACION_TECNICA_COMPLEMENTARIA.md` sección 4.

**Estados principales de tickets:**

1. Solicitud Creada
2. Pendiente Asignación
3. Rampla en Tránsito
4. Rampla en Planta/Galpón
5. Carga iniciada
6. Cargado - Espera Chofer
7. Asignada a Muelle CD
8. Inicio/Fin Descarga
9. Libre (cerrado)

**Estados de excepción:**
- Rechazada
- Cancelado por CD

---

## 👥 Roles y Permisos

### 🏭 Planta
**Capacidades:**
- Crear tickets (Retiro de pallets / Solicitar pallets vacíos)
- Confirmar llegada de ramplas (aceptar/rechazar)
- Iniciar y finalizar carga
- Ver historial propio

### 📦 Centro de Distribución (CD)
**Capacidades:**
- Ver todas las solicitudes pendientes
- Asignar ramplas a tickets
- Asignar muelles
- Iniciar y finalizar descarga
- Cancelar tickets en tránsito
- Rechazar cargas con observaciones
- Gestionar alertas

### 🏠 Galpón/Bodega
**Capacidades:**
- Aprobar solicitudes de pallets vacíos
- Confirmar llegada de ramplas
- Cargar pallets vacíos
- Enviar ramplas cargadas

### ⚙️ Administrador
**Capacidades:**
- Acceso total al sistema
- Gestionar ramplas (crear/editar/eliminar)
- Gestionar muelles
- Ver monitor global de ramplas
- Gestionar usuarios (a través de Supabase)
- Ver reportes y auditorías

---

## 🔄 Flujos de Trabajo

### Flujo 1: Retiro de Pallets de Producción

```
1. Planta crea ticket de "Retiro pallets producción"
   ↓
2. CD asigna rampla disponible
   ↓
3. Rampla viaja a Planta (estado: "En Tránsito")
   ↓
4. Planta confirma llegada (acepta/rechaza/observa)
   ↓
5. Planta inicia carga
   ↓
6. Planta finaliza carga → Notifica a CD
   ↓
7. CD asigna muelle
   ↓
8. CD inicia descarga en muelle
   ↓
9. CD finaliza descarga → Libera rampla y muelle
```

### Flujo 2: Solicitud de Pallets Vacíos

```
1. Planta crea ticket de "Solicitar Pallets vacíos"
   ↓
2. Galpón aprueba solicitud
   ↓
3. CD asigna rampla
   ↓
4. Rampla viaja a Galpón
   ↓
5. Galpón confirma llegada
   ↓
6. Galpón carga pallets vacíos
   ↓
7. Rampla viaja a Planta
   ↓
8. Planta confirma llegada y descarga
   ↓
9. CD gestiona retorno a CD y libera recursos
```

### Sistema de Alertas Automáticas

El sistema monitorea y genera alertas en los siguientes casos:

- **⏰ 2 horas sin asignación**: Tickets pendientes sin rampla asignada
- **🚨 15 minutos en tránsito**: Ramplas que exceden el tiempo esperado
- **⏳ 30 minutos esperando chofer**: Ramplas cargadas sin asignación de muelle

Las alertas se muestran en:
- Dashboard de CD (badges rojos)
- Notificaciones en tiempo real
- Lista de tickets con indicador visual

---

## 📚 Documentación Técnica

Para información técnica detallada, consulta:

### 📄 Documentos Disponibles

1. **`docs/DOCUMENTACION_TECNICA.md`**
   - Arquitectura completa del sistema
   - Modelo de datos lógico
   - Descripción de servicios
   - Pseudocódigo de procesos

2. **`docs/DOCUMENTACION_TECNICA_COMPLEMENTARIA.md`**
   - Esquema SQL completo
   - Catálogo de funciones backend
   - Máquinas de estado detalladas
   - Eventos Realtime
   - Casos borde y anti-colisión
   - Pseudocódigo UI orientado a Angular
   - Recomendaciones de arquitectura

3. **`docs/MANUAL_USUARIO.md`**
   - Guía de uso para cada rol
   - Pantallas y funcionalidades
   - Preguntas frecuentes

4. **`database/database-schema.sql`**
   - Script completo de base de datos
   - Triggers y vistas
   - Políticas de integridad

### 🔍 Temas Técnicos Clave

#### Realtime con Supabase
- Suscripciones a cambios en `tickets`, `ramplas`, `muelles`
- Actualización automática de dashboards
- Ver: `SupabaseService.subscribeToTickets()`

#### Sistema de Notificaciones
- Notificaciones en app (popup)
- Notificaciones nativas del navegador
- Integración opcional con Microsoft Teams
- Ver: `NotificationService`

#### Auditoría y Trazabilidad
- Tabla `registros_tiempo`: historial completo de estados
- Registro automático en cada cambio de estado
- Consultas de auditoría disponibles

---

## 🔧 Solución de Problemas

### Problema: "Error al conectar con Supabase"

**Solución:**
1. Verifica que las credenciales en `environment.ts` sean correctas
2. Confirma que el proyecto de Supabase esté activo
3. Revisa la consola del navegador para detalles del error
4. Verifica que no haya bloqueadores de CORS

### Problema: "Usuario no autenticado"

**Solución:**
1. Verifica que el usuario exista en Authentication de Supabase
2. Confirma que el usuario esté en la tabla `usuarios`
3. Revisa que el `id` en `usuarios` coincida con el UUID de Auth
4. Limpia el localStorage y vuelve a iniciar sesión

### Problema: "No se actualizan los datos en tiempo real"

**Solución:**
1. Verifica que Realtime esté habilitado en Supabase
2. Ve a **Database** → **Replication** y habilita las tablas necesarias
3. Revisa la consola del navegador por errores de suscripción
4. Confirma que el componente se suscribe en `ngOnInit`

### Problema: "No puedo crear/editar registros"

**Solución:**
1. Verifica las políticas RLS en Supabase
2. Confirma que el usuario tenga el rol correcto
3. Revisa los permisos de la tabla en cuestión
4. Consulta los logs de Supabase (API → Logs)

### Problema: "Las notificaciones no funcionan"

**Solución:**
1. Verifica que hayas dado permisos de notificaciones en el navegador
2. Revisa `NotificationService.solicitarPermisoNotificaciones()`
3. Confirma que el rol esté configurado: `NotificationService.setRolUsuario()`
4. Verifica que los archivos de sonido existan en `assets/sounds/`

### Problema: "Error al exportar a Excel"

**Solución:**
1. Verifica que la librería `xlsx` esté instalada: `npm list xlsx`
2. Si falta, instala: `npm install xlsx`
3. Revisa que haya datos para exportar
4. Consulta la consola del navegador por errores

---

## 🛠 Mantenimiento

### Actualizar Dependencias

```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar dependencias menores
npm update

# Actualizar Angular (incluye todas sus dependencias)
ng update @angular/core @angular/cli

# Actualizar Angular Material
ng update @angular/material
```

### Backup de Base de Datos

En Supabase:
1. Ve a **Database** → **Backups**
2. Los backups automáticos están disponibles en planes de pago
3. Para backup manual, usa SQL Editor:

```sql
-- Exportar datos de una tabla
COPY tickets TO '/tmp/tickets_backup.csv' DELIMITER ',' CSV HEADER;
```

### Monitoreo

#### Logs de Supabase
- **API Logs**: Ve a **API** → **Logs**
- **Database Logs**: Ve a **Database** → **Logs**

#### Performance de Frontend
- Usa Angular DevTools (extensión de Chrome)
- Monitorea tiempos de carga en Network tab
- Revisa bundle size: `ng build --stats-json` y analiza con [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)

### Limpieza de Datos

Para limpiar tickets antiguos (ejemplo):

```sql
-- Archivar tickets de hace más de 6 meses
-- CUIDADO: Asegúrate de tener backup antes de ejecutar
DELETE FROM tickets 
WHERE estado_actual = 'Libre' 
AND fecha_creacion < NOW() - INTERVAL '6 months';
```

---

## 📞 Soporte

### Recursos Útiles

- **Documentación de Angular**: [angular.io/docs](https://angular.io/docs)
- **Documentación de Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Angular Material**: [material.angular.io](https://material.angular.io/)
- **RxJS**: [rxjs.dev](https://rxjs.dev/)

### Contacto

Para consultas sobre el proyecto, contacta al equipo de TI de la empresa.

---

## 📝 Notas Finales

### ⚠️ Configuraciones Pendientes

**IMPORTANTE**: Antes de usar en producción, revisa el archivo `CONFIGURACION_PENDIENTE.txt` que contiene:
- APIs personales que deben ser reemplazadas
- Configuraciones específicas del entorno
- Elementos que requieren atención

### 🔒 Seguridad

- **Nunca expongas tus credenciales de Supabase en el código fuente**
- Usa variables de entorno en producción (Vercel, Netlify, etc.)
- Configura correctamente las políticas RLS en Supabase
- Revisa y actualiza las políticas de CORS según tus dominios

### 🚀 Próximos Pasos Recomendados

1. ✅ Configurar políticas RLS más específicas por rol
2. ✅ Implementar pruebas unitarias y e2e
3. ✅ Configurar CI/CD automático
4. ✅ Implementar sistema de caché para mejorar performance
5. ✅ Añadir más reportes y dashboards analíticos
6. ✅ Implementar notificaciones push móviles
7. ✅ Crear app móvil con Ionic o React Native

---

## 📄 Licencia

Este proyecto es propiedad de [Nombre de la Empresa]. Todos los derechos reservados.

---

## 🙏 Agradecimientos

Desarrollado por Felipe Rosales Bravo.

Sistema creado para optimizar la gestión logística de ramplas y mejorar la eficiencia operacional.

---

**Versión**: 1.0.0  
**Última actualización**: 11 de diciembre de 2025  
**Estado**: MVP Funcional - Listo para uso en producción con configuraciones pendientes

---

## 🆘 Inicio Rápido (Quick Start)

Si solo quieres ver el sistema funcionando rápidamente:

```bash
# 1. Clonar e instalar
git clone <url-del-repo>
cd ramplas-system
npm install

# 2. Configurar environment.ts con tus credenciales de Supabase
# (Ver sección "Configuración Inicial")

# 3. Ejecutar DB schema en Supabase SQL Editor
# (Copia database/database-schema.sql)

# 4. Crear usuario de prueba en Supabase Auth
# y agregarlo a tabla usuarios

# 5. Iniciar aplicación
npm start

# 6. Abrir http://localhost:4200 e iniciar sesión
```

¡Eso es todo! 🎉

