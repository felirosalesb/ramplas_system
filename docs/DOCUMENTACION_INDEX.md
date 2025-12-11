# Sistema de Gestión de Ramplas - Documentación

## Bienvenido

Este repositorio contiene la documentación completa del **Sistema de Gestión de Ramplas**, una solución web para coordinar el transporte de pallets entre plantas de producción, galpón de almacenamiento y Centro de Distribución.

---

## 📚 Documentación Disponible

### 1. [Documentación Técnica](./DOCUMENTACION_TECNICA.md)
**Audiencia:** Desarrolladores, Equipo Técnico, DevOps

Contiene información técnica detallada sobre:
- 🏗️ Arquitectura del sistema
- 🗄️ Modelo de datos y relaciones
- 🔄 Flujos de negocio con pseudocódigo
- 🛠️ Servicios y componentes principales
- ⚙️ Configuración y despliegue
- 🐛 Troubleshooting técnico

**¿Cuándo usar este documento?**
- Para entender la arquitectura del sistema
- Al desarrollar nuevas funcionalidades
- Para debugging de problemas técnicos
- Al configurar ambientes de desarrollo o producción

### 2. [Manual de Usuario](./MANUAL_USUARIO.md)
**Audiencia:** Usuarios Finales (Planta, CD, Galpón)

Guías paso a paso para cada rol:
- 👤 **Usuario Planta**: Crear solicitudes, confirmar llegadas, gestionar cargas
- 🏭 **Usuario CD**: Asignar ramplas, gestionar muelles, controlar descarga
- 📦 **Usuario Galpón**: Aprobar solicitudes, cargar pallets vacíos
- 📊 **Monitor de Ramplas**: Visualización del estado de la flota
- 🔔 **Sistema de Notificaciones**: Cómo funcionan las alertas
- ❓ **FAQ**: Preguntas frecuentes y soluciones

**¿Cuándo usar este documento?**
- Para capacitación de nuevos usuarios
- Como referencia rápida de funciones
- Para resolver dudas operativas
- Al reportar problemas a soporte

---

## 🚀 Inicio Rápido

### Para Usuarios

1. Acceda al sistema: `https://[tu-dominio].vercel.app`
2. Inicie sesión con sus credenciales
3. Consulte el [Manual de Usuario](./MANUAL_USUARIO.md) según su rol

### Para Desarrolladores

1. Clone el repositorio
2. Instale dependencias: `npm install`
3. Configure variables de entorno (ver [Documentación Técnica](./DOCUMENTACION_TECNICA.md))
4. Ejecute en desarrollo: `npm start`
5. Consulte la documentación técnica para entender la arquitectura

---

## 📋 Tabla de Contenidos Rápida

### Documentación Técnica

| Sección | Descripción |
|---------|-------------|
| [Arquitectura](./DOCUMENTACION_TECNICA.md#arquitectura-del-sistema) | Stack tecnológico y estructura de carpetas |
| [Modelo de Datos](./DOCUMENTACION_TECNICA.md#modelo-de-datos) | Entidades, relaciones y constraints |
| [Flujos de Negocio](./DOCUMENTACION_TECNICA.md#flujos-de-negocio) | Pseudocódigo de procesos principales |
| [Servicios](./DOCUMENTACION_TECNICA.md#servicios-y-componentes) | SupabaseService, NotificationService, etc. |
| [Configuración](./DOCUMENTACION_TECNICA.md#configuración-y-despliegue) | Setup de Supabase, build y deploy |

### Manual de Usuario

| Sección | Descripción |
|---------|-------------|
| [Acceso al Sistema](./MANUAL_USUARIO.md#acceso-al-sistema) | Login, recuperar contraseña |
| [Usuario Planta](./MANUAL_USUARIO.md#manual---usuario-planta) | Crear solicitudes, gestionar cargas |
| [Usuario CD](./MANUAL_USUARIO.md#manual---usuario-centro-de-distribución-cd) | Asignar ramplas, gestionar descarga |
| [Usuario Galpón](./MANUAL_USUARIO.md#manual---usuario-galpónbodega) | Aprobar solicitudes, cargar pallets |
| [FAQ](./MANUAL_USUARIO.md#preguntas-frecuentes-faq) | Preguntas frecuentes |
| [Soporte](./MANUAL_USUARIO.md#soporte-técnico) | Contacto y escalamiento |

---

## 🔑 Conceptos Clave

### Tipos de Solicitud

**Retiro de Pallets Producción**
- Planta → CD
- Retiro de pallets llenos desde producción
- Flujo: Solicitud → Asignación → Tránsito → Planta → Carga → CD → Descarga

**Solicitar Pallets Vacíos**
- Planta → Galpón → CD
- Obtención de pallets vacíos para producción
- Flujo: Solicitud → Aprobación Galpón → Asignación → Tránsito → Galpón → Carga → CD

### Estados Principales

| Estado | Rol Responsable | Descripción |
|--------|-----------------|-------------|
| Pendiente Asignación | CD | Esperando asignación de rampla |
| Rampla en Tránsito | CD/Sistema | Rampla en camino a destino |
| Rampla en Planta/Galpón | Planta/Galpón | Confirmada llegada, lista para carga |
| Carga iniciada | Planta/Galpón | En proceso de carga |
| Cargado - Espera Chofer | Sistema | Carga completada, esperando transporte |
| Asignada a Muelle CD | CD | Llegó a CD, muelle asignado |
| Inicio/Fin Descarga | CD | Proceso de descarga en CD |
| Libre | Sistema | Ciclo completado |

### Alertas Automáticas

- ⏰ **2 horas sin asignación**: Alerta a CD
- ⚠️ **15 minutos en tránsito**: Seguimiento de rampla
- 🚨 **30 minutos esperando chofer**: Alerta urgente

---

## 🛠️ Stack Tecnológico

- **Frontend**: Angular 19 + TypeScript 5.7
- **UI**: Angular Material 19
- **Backend**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime (WebSockets)
- **Notificaciones**: Microsoft Teams Webhooks (opcional)
- **Deployment**: Vercel

---

## 📞 Contacto y Soporte

### Soporte Técnico
- 📧 **Email**: soporte-ramplas@empresa.com
- 📞 **Teléfono**: +56 X XXXX XXXX (opción 2)
- 💬 **Teams**: Canal "Soporte Sistema Ramplas"

### Desarrollo
- 📧 **Email**: desarrollo-ramplas@empresa.com
- 🐛 **Issues**: Repositorio GitHub
- 📝 **Pull Requests**: Bienvenidos

---

## 📄 Licencia y Versiones

**Versión del Sistema:** 1.0  
**Última actualización de documentación:** Diciembre 2025  
**Estado:** Producción

---

## 🔄 Actualizaciones de Documentación

Esta documentación se actualiza continuamente. Versiones históricas disponibles en:
- Git tags del repositorio
- Carpeta `/docs/archive/` (si aplica)

### Changelog

**v1.0 - Diciembre 2025**
- ✅ Documentación técnica inicial completa
- ✅ Manual de usuario por roles
- ✅ Pseudocódigo de flujos principales
- ✅ Guías de configuración y despliegue

---

## 📖 Cómo Contribuir a la Documentación

Si detecta errores o mejoras en la documentación:

1. Reporte en Issues del repositorio
2. Proponga cambios vía Pull Request
3. Contacte al equipo de desarrollo

**Formato:**
- Markdown estándar
- Capturas de pantalla en `/assets/images/`
- Diagramas generados con herramientas estándar (Mermaid, Draw.io)

---

## 🎯 Roadmap de Documentación

### En desarrollo
- [ ] Videos tutoriales por rol
- [ ] Diagramas de flujo visuales (Mermaid)
- [ ] Guía de migración de datos
- [ ] API documentation (si se expone API pública)

### Planeado
- [ ] Casos de uso avanzados
- [ ] Guía de personalización
- [ ] Documentación de integraciones externas
- [ ] Glosario ilustrado

---

¡Gracias por utilizar el Sistema de Gestión de Ramplas!

Para cualquier consulta, no dude en contactar al equipo de soporte o desarrollo.
