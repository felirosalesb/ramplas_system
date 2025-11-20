Sistema de Coordinación de Ramplas
Sistema web para la coordinación y seguimiento de camiones (ramplas) entre fábrica y CD (centro de distribución).

🚀 Características Principales
Gestión de Solicitudes: Creación de tickets de retiro desde planta
Asignación de Ramplas: Control de 15 ramplas en tiempo real
Flujo Completo: Desde solicitud hasta descarga final
Notificaciones: Pop-ups y Microsoft Teams
Alertas Automáticas: Notificación si no se asigna rampla en 2 horas
Auditoría de Tiempos: Registro de cada cambio de estado
Dashboard en Tiempo Real: Actualizaciones instantáneas vía Supabase Realtime
📋 Flujo de Estados
Solicitud Creada → Planta crea ticket
Pendiente Asignación → Espera asignación de rampla (máx. 2 horas)
Rampla Asignada → CD asigna rampla
Rampla en Planta → Planta confirma llegada (Acepta/Observación/Rechaza)
Inicio de Carga → Planta inicia carga
Fin de Carga → Planta finaliza carga
Cargado - Espera Chofer → En tránsito al CD
Asignada a Muelle CD → CD asigna muelle
Inicio Descarga → CD inicia descarga
Fin Descarga → CD finaliza descarga
Libre → Ciclo completado, rampla disponible
🛠️ Tecnologías
Frontend: Angular 17+
UI Framework: Angular Material
Backend: Supabase (PostgreSQL)
Realtime: Supabase Realtime
Notificaciones: Microsoft Teams Webhook
📦 Instalación
1. Prerrequisitos
bash
node >= 18.x
npm >= 9.x
Angular CLI >= 17.x
2. Clonar e Instalar Dependencias
bash
# Clonar el repositorio
git clone <tu-repositorio>
cd ramplas-system

# Instalar dependencias
npm install

# Instalar Angular CLI globalmente (si no lo tienes)
npm install -g @angular/cli
3. Configurar Supabase
Crear un proyecto en Supabase
Ejecutar el script SQL proporcionado en la sección de SQL Editor
Configurar autenticación (Email/Password o tu método preferido)
Habilitar Realtime para las tablas tickets y ramplas
4. Configurar Variables de Entorno
Editar src/environments/environment.ts:

typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseKey: 'tu-anon-key-aqui',
  teamsWebhookUrl: 'https://outlook.office.com/webhook/...' // Opcional
};
5. Configurar Microsoft Teams (Opcional)
En Teams, ir a tu canal → Connectors → Incoming Webhook
Crear webhook y copiar la URL
Agregar la URL en environment.ts
6. Iniciar el Proyecto
bash
# Desarrollo
ng serve

# La app estará disponible en http://localhost:4200
🔐 Configuración de Usuarios
Crear Usuarios en Supabase
Ir a Authentication → Users en tu dashboard de Supabase
Crear usuarios con roles:
Usuario Planta: Agregar metadata { "role": "planta" }
Usuario CD: Agregar metadata { "role": "cd" }
Estructura de User Metadata
json
{
  "role": "planta" // o "cd"
}
📊 Base de Datos
Tablas Principales
ramplas: Maestra de camiones (15 ramplas)
tickets: Solicitudes y seguimiento
registros_tiempo: Auditoría de cambios de estado
Realtime Configuration
Habilitar Realtime en Supabase:

sql
-- Habilitar realtime para tickets
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- Habilitar realtime para ramplas
ALTER PUBLICATION supabase_realtime ADD TABLE ramplas;
🎨 Personalización
Colores y Tema
Editar src/styles.scss:

scss
@use '@angular/material' as mat;

$primary: mat.define-palette(mat.$indigo-palette);
$accent: mat.define-palette(mat.$pink-palette);
$warn: mat.define-palette(mat.$red-palette);

$theme: mat.define-light-theme((
  color: (
    primary: $primary,
    accent: $accent,
    warn: $warn,
  )
));
Sonidos de Notificación
Agregar archivo de sonido en src/assets/sounds/notification.mp3

📱 Componentes Principales
Dashboard Planta
Crear solicitudes de retiro
Confirmar llegada de ramplas
Gestionar carga (inicio/fin)
Ver historial de solicitudes
Dashboard CD
Ver solicitudes pendientes
Asignar ramplas disponibles
Gestionar descarga en CD
Monitorear todas las ramplas
Monitor de Ramplas
Vista en tiempo real de todas las ramplas
Estadísticas de utilización
Filtros y búsqueda
🔔 Sistema de Notificaciones
Tipos de Notificaciones
Pop-up (Snackbar): Notificaciones instantáneas en la UI
Microsoft Teams: Mensajes al canal configurado
Badge: Contador de notificaciones no leídas
Eventos que Generan Notificaciones
Nueva solicitud creada
Rampla asignada
Fin de carga
Alerta de 2 horas sin asignación
Rechazo de rampla
📈 Análisis de Tiempos
Todos los cambios de estado se registran en registros_tiempo con:

Timestamp exacto
Usuario que realizó el cambio
Estado registrado
Esto permite analizar:

Tiempo promedio de asignación
Tiempo de carga/descarga
Eficiencia operacional
Cuellos de botella
🚀 Despliegue
Build para Producción
bash
ng build --configuration production
Los archivos estarán en dist/ramplas-system/

Opciones de Hosting
Vercel: Conexión directa con Git
Netlify: Deploy automático
Firebase Hosting: Integración con Google
Azure Static Web Apps: Para entorno empresarial
🔒 Seguridad
Row Level Security (RLS) en Supabase
Ejemplo de políticas:

sql
-- Política para tickets: usuarios solo ven sus propios tickets
CREATE POLICY "Usuarios ven sus tickets"
ON tickets FOR SELECT
USING (
  auth.uid() = planta_user_id 
  OR auth.uid() = cd_user_id
);

-- Política para ramplas: todos pueden ver
CREATE POLICY "Todos ven ramplas"
ON ramplas FOR SELECT
TO authenticated
USING (true);
🐛 Troubleshooting
Problemas Comunes
Error de conexión a Supabase

Verificar URL y Key en environment.ts
Confirmar que el proyecto Supabase esté activo
Realtime no funciona

Verificar que Realtime esté habilitado en las tablas
Revisar límites del plan de Supabase
Notificaciones de Teams no llegan

Verificar webhook URL
Comprobar que el webhook esté activo en Teams
📝 Mejoras Futuras
 Reportes y analytics
 Exportación de datos a Excel
 Aplicación móvil
 Integración con GPS para tracking
 Dashboard de métricas ejecutivas
 Notificaciones push
 Chat integrado entre planta y CD
👥 Soporte
Para preguntas o problemas, contactar al equipo de desarrollo.

📄 Licencia
Uso interno - Todos los derechos reservados

