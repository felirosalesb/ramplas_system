# Sistema de Gestión de Ramplas - Documentación Técnica para Junta Directiva

**Versión:** MVP 1.0  
**Fecha:** Diciembre 2025  
**Estado:** Producción - Validación de Concepto

---

## 📋 Resumen Ejecutivo

El **Sistema de Gestión de Ramplas** es una aplicación web moderna diseñada para optimizar y digitalizar el flujo de transporte de pallets entre el Centro de Distribución (CD), plantas de producción y galpones de almacenamiento. Este MVP ha sido desarrollado con tecnologías de vanguardia para validar el modelo de negocio antes de realizar una inversión mayor en infraestructura empresarial.

### Objetivos del MVP
1. ✅ Validar la viabilidad operacional del sistema de gestión de ramplas
2. ✅ Demostrar valor agregado en tiempo real y visibilidad de operaciones
3. ✅ Obtener métricas de uso y feedback de usuarios finales
4. ✅ Minimizar inversión inicial mientras se valida el concepto de negocio

---

## 🏗️ Arquitectura del Sistema

### Tipo de Arquitectura: Cliente-Servidor con Backend as a Service (BaaS)

El sistema implementa una **arquitectura de tres capas moderna** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│              (Angular 19 - Single Page Application)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Dashboard │  │Dashboard │  │Historial │   │
│  │   CD     │  │  Planta  │  │  Galpón  │  │ Reportes │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/TLS 1.3
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE LÓGICA DE NEGOCIO                   │
│                    (Supabase - BaaS Layer)                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  REST API      │  │  Auth Service  │  │  Realtime    │  │
│  │  Auto-generada │  │  JWT + RLS     │  │  WebSockets  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL Queries
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                             │
│                  (PostgreSQL 15 - Cloud)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Tickets  │  │ Usuarios │  │ Ramplas  │  │Registros │   │
│  │  Table   │  │  Table   │  │  Table   │  │  Tiempo  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│              Row-Level Security (RLS) Policies               │
└─────────────────────────────────────────────────────────────┘
```

### Características de la Arquitectura

**Arquitectura Cliente-Servidor Ligera:**
- ✅ **Desacoplamiento:** Frontend y Backend completamente independientes
- ✅ **Stateless:** Cada request es independiente (JWT para estado de sesión)
- ✅ **RESTful:** API siguiendo estándares REST para máxima compatibilidad
- ✅ **Event-Driven:** Realtime con WebSockets para sincronización instantánea

**Patrones de Diseño Implementados:**
- **MVC en Frontend:** Model-View-Controller con Angular Components
- **Repository Pattern:** Servicios Angular abstraen acceso a datos
- **Observer Pattern:** RxJS Observables para programación reactiva
- **Singleton Services:** Gestión centralizada de estado y autenticación

**Ventajas de BaaS (Backend as a Service):**
1. **Desarrollo acelerado:** No hay que construir infraestructura de servidor
2. **Escalabilidad automática:** Supabase gestiona carga y performance
3. **Seguridad integrada:** RLS y Auth incluidos por defecto
4. **APIs estándar:** Compatible con cualquier cliente (web, móvil, desktop)

### Stack Tecnológico

#### **Frontend: Angular 19**
- **Framework:** Angular 19.2 (última versión estable)
- **UI/UX:** Angular Material 19 (componentes enterprise-grade)
- **Lenguaje:** TypeScript 5.7
- **Estado:** RxJS para gestión reactiva de datos

**Justificación de Elección:**
- ✅ Framework empresarial con soporte a largo plazo de Google
- ✅ TypeScript proporciona seguridad de tipos y reduce errores en producción
- ✅ Angular Material ofrece componentes accesibles y responsive out-of-the-box
- ✅ Arquitectura modular facilita mantenimiento y escalabilidad
- ✅ Compatible con Azure Static Web Apps para migración futura

#### **Backend: Supabase (PostgreSQL + API REST)**
- **Base de Datos:** PostgreSQL 15 (Cloud-managed)
- **Autenticación:** Supabase Auth con JWT
- **API:** Auto-generada REST/GraphQL
- **Realtime:** WebSockets para actualizaciones en vivo
- **Storage:** Supabase Storage (si se requiere en futuro)

**Justificación de Elección para MVP:**
- ✅ **Velocidad de desarrollo:** Backend completo sin escribir código de servidor
- ✅ **Costo-efectivo:** Plan gratuito incluye 500MB DB + 50K usuarios
- ✅ **PostgreSQL:** Base de datos enterprise-grade, compatible con Azure Database
- ✅ **Realtime incorporado:** Sincronización instantánea entre usuarios
- ✅ **Migración simplificada:** Schema SQL estándar, compatible con cualquier PostgreSQL

---

## 🔐 Seguridad de Datos

### Capas de Seguridad Implementadas

#### 1. **Autenticación y Autorización**
```
Usuario → Supabase Auth (JWT) → Verificación de Rol → Acceso a Datos
```

- **JWT (JSON Web Tokens):** Tokens firmados y encriptados para cada sesión
- **Roles definidos:** `planta`, `cd`, `galpon`, `admin`
- **Guard de rutas:** Protección a nivel de navegación en Angular
- **Expiración automática:** Sesiones con timeout de seguridad

#### 2. **Row-Level Security (RLS) en Base de Datos**

Cada tabla tiene políticas de seguridad que filtran datos por usuario:

```sql
-- Ejemplo: Solo usuarios de CD ven todos los tickets
CREATE POLICY "cd_view_all_tickets" ON tickets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM usuarios WHERE rol = 'cd'
    )
  );

-- Plantas solo ven sus propios tickets
CREATE POLICY "planta_view_own_tickets" ON tickets
  FOR SELECT USING (
    nombre_planta = (
      SELECT nombre_planta FROM usuarios WHERE id = auth.uid()
    )
  );
```

**Beneficios:**
- ✅ Seguridad a nivel de base de datos (no solo frontend)
- ✅ Imposible acceder a datos de otras plantas sin permisos
- ✅ Políticas validadas por PostgreSQL antes de retornar datos

#### 3. **Cifrado de Datos**

| Capa | Método | Descripción |
|------|--------|-------------|
| **Tránsito** | TLS 1.3 | Todo el tráfico HTTP está cifrado |
| **Reposo** | AES-256 | Datos en disco cifrados por Supabase |
| **Contraseñas** | bcrypt | Hashing con salt, nunca almacenadas en texto plano |
| **Tokens** | HS256 | JWT firmados con clave secreta del servidor |

#### 4. **Auditoría y Trazabilidad**

- **Tabla `registros_tiempo`:** Rastrea cada cambio de estado con usuario y timestamp
- **Logs de acceso:** Supabase mantiene logs de todas las operaciones
- **Historial completo:** Timeline de cada ticket desde creación hasta liberación

---

## 📊 Escalabilidad y Rendimiento

### Capacidad Actual (MVP)

| Métrica | Límite Actual | Proyección 1 Año |
|---------|---------------|------------------|
| **Usuarios concurrentes** | 50,000 | 20-50 usuarios |
| **Almacenamiento DB** | 500 MB gratuitos | ~200 MB (500 tickets/día) |
| **Consultas/mes** | 50,000 | 15,000-25,000 |
| **Tráfico de red** | 2 GB/mes | < 1 GB/mes |

### Consumo de Almacenamiento Detallado

**Por Ticket:**
- 1 ticket = 554 bytes (0.54 KB)
- 1 ticket completo (con historial de 10 estados) = 1 KB

**Proyecciones:**
- 100 tickets/día = 20 MB/año
- 500 tickets/día = 100 MB/año ✅ *Escenario actual*
- 1,000 tickets/día = 200 MB/año

**Conclusión:** El sistema puede operar 2+ años sin costo adicional de almacenamiento.

### Optimizaciones Implementadas

#### Frontend
- ✅ **Lazy Loading:** Componentes cargados bajo demanda
- ✅ **Change Detection:** OnPush strategy para reducir re-renders
- ✅ **RxJS Subscriptions:** Gestión eficiente de memoria
- ✅ **Caching local:** Datos en memoria para reducir queries

#### Backend
- ✅ **Índices de base de datos:** En campos clave (estado_actual, fecha_creacion, nombre_planta)
- ✅ **Consultas optimizadas:** JOINs eficientes con relaciones definidas
- ✅ **Realtime selectivo:** Solo suscripciones a tablas relevantes por rol
- ✅ **Polling inteligente:** Backup cada 30s para actualizaciones críticas

---

## 🚀 Plan de Migración a Azure

### Ruta de Migración Propuesta

```
MVP (Supabase)  →  Híbrido  →  Azure Full Stack
    3-6 meses       6-12 meses    12+ meses
```

#### **Fase 1: Validación (Actual - 3-6 meses)**
- ✅ Supabase como backend completo
- ✅ Validar modelo de negocio y ROI
- ✅ Recopilar métricas de uso real
- ✅ Refinar funcionalidades según feedback

#### **Fase 2: Migración Gradual (6-12 meses)**
**Frontend:**
- Migrar Angular a **Azure Static Web Apps**
- Integrar **Azure CDN** para distribución global
- Configurar **Azure DevOps** para CI/CD

**Backend:**
- Exportar schema SQL a **Azure Database for PostgreSQL**
- Migrar datos con herramientas nativas de PostgreSQL
- Implementar **Azure Functions** para lógica de negocio personalizada
- Configurar **Azure API Management** para gateway centralizado

**Autenticación:**
- Migrar a **Azure Active Directory B2C**
- Integrar SSO corporativo si es requerido

#### **Fase 3: Azure Full Stack (12+ meses)**
- **Azure Kubernetes Service (AKS):** Para microservicios si se requiere
- **Azure Application Insights:** Monitoreo avanzado y analytics
- **Azure Backup:** Respaldos automáticos y disaster recovery
- **Azure Monitor:** Alertas proactivas y dashboards operacionales

### Compatibilidad de Migración

| Componente Actual | Equivalente Azure | Compatibilidad |
|-------------------|-------------------|----------------|
| Supabase PostgreSQL | Azure Database for PostgreSQL | ✅ 100% compatible |
| Supabase Auth | Azure AD B2C | ⚠️ Requiere adaptación de JWT |
| Supabase Realtime | Azure SignalR Service | ⚠️ Requiere reimplementación |
| Angular App | Azure Static Web Apps | ✅ 100% compatible |
| REST API | Azure API Management | ✅ Compatible, mejora con gateway |

**Ventajas de la Migración:**
- 🔒 Cumplimiento empresarial (ISO 27001, SOC 2, GDPR)
- 🌐 Integración con ecosistema Microsoft 365
- 📈 SLA de 99.99% con soporte enterprise
- 🛡️ Azure Security Center para protección avanzada
- 💼 Facturación consolidada con otros servicios Azure

**Costos Estimados Azure (Producción):**
- Static Web App: ~$10-25/mes
- PostgreSQL Flexible Server: ~$80-150/mes
- Azure Functions: ~$20-50/mes
- CDN + Ancho de banda: ~$30-60/mes
- **Total estimado:** $140-285/mes (vs. $0 actual en MVP)

---

## 📱 Funcionalidades Clave Implementadas

### Módulos Operacionales

#### **1. Dashboard Centro de Distribución (CD)**
- Gestión de solicitudes pendientes de asignación de rampla
- Monitor en tiempo real de ramplas en planta
- Seguimiento de ramplas en tránsito de retorno
- Alertas automáticas para solicitudes con +2 horas sin asignar
- Asignación inteligente de muelles en CD

#### **2. Dashboard Planta**
- Creación de solicitudes (retiro de producción / pallets vacíos)
- Confirmación de llegada de ramplas
- Gestión de carga con conteo de pallets
- Historial de solicitudes propias
- Notificaciones de estados

#### **3. Dashboard Galpón**
- Aprobación de solicitudes de pallets vacíos
- Gestión de carga de pallets vacíos a ramplas
- Confirmación de llegadas desde CD
- Seguimiento de envíos a plantas

#### **4. Historial y Reportes**
- Vista completa de tickets completados
- Filtros por fecha, planta, tipo de solicitud
- Timeline detallada con tiempos entre estados
- Cálculo de KPIs (tiempo de ciclo, demoras)

#### **5. Sistema de Notificaciones**
- Notificaciones en tiempo real con priorización
- Toast animados con códigos de color por tipo
- Panel deslizante con historial de notificaciones
- Vibración y sonido según prioridad (móvil)

### Experiencia de Usuario

- ✅ **Responsive Design:** Optimizado para móvil, tablet y desktop
- ✅ **Modo Compacto:** Densidad ajustable para preferencias de usuario
- ✅ **Navegación táctil:** Swipe en tabs, gestos para cerrar modales
- ✅ **Accesibilidad:** ARIA labels, contraste, navegación por teclado
- ✅ **Offline-first considerations:** Preparado para PWA en futuro

---

## 🔍 Monitoreo y Métricas Actuales

### Métricas de Negocio Rastreadas

1. **Tiempo promedio de ciclo por ticket**
   - Desde creación hasta rampla libre
   - Desglose por tipo de solicitud

2. **Tiempo por estado**
   - Pendiente asignación
   - En tránsito
   - En carga/descarga
   - Identificación de cuellos de botella

3. **Tasa de rechazo**
   - Ramplas rechazadas por condición
   - Razones de cancelación

4. **Utilización de recursos**
   - Disponibilidad de ramplas
   - Ocupación de muelles
   - Distribución de carga por planta

### Herramientas de Monitoreo

- **Supabase Dashboard:** Queries, performance, usuarios activos
- **Angular DevTools:** Debugging y profiling en desarrollo
- **Browser DevTools:** Performance y Network en producción
- **Logs de aplicación:** Console logs en cliente para debugging

**Post-migración Azure:**
- Azure Application Insights para telemetría completa
- Azure Monitor para alertas proactivas
- Custom dashboards con Power BI

---

## ⚖️ Análisis de Riesgos y Mitigación

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Límites de Supabase** | Baja | Medio | Migración planificada a Azure antes de límites |
| **Pérdida de datos** | Muy Baja | Alto | Backups automáticos de Supabase + exports regulares |
| **Seguridad de acceso** | Baja | Alto | RLS + JWT + Auth guards + auditoría completa |
| **Performance con carga** | Media | Medio | Índices DB + lazy loading + caching |
| **Dependencia de proveedor** | Media | Medio | PostgreSQL estándar, fácil migración |

### Estrategia de Continuidad

1. **Backups automáticos:** Supabase realiza snapshots diarios
2. **Export manual:** Exports SQL mensuales a repositorio seguro
3. **Documentación completa:** Schema SQL y políticas documentadas
4. **Plan de rollback:** Capacidad de restaurar a versión anterior
5. **Monitoreo de límites:** Alertas cuando se alcanza 70% de capacidad

---

## 💡 Ventajas Competitivas de la Solución

### Comparación con Alternativas

| Característica | Esta Solución | Hojas de Cálculo | Sistema Custom | ERP Pesado |
|----------------|---------------|------------------|----------------|------------|
| **Tiempo de desarrollo** | ✅ 2-3 meses | ⚠️ Inmediato | ❌ 6-12 meses | ❌ 12-24 meses |
| **Costo inicial** | ✅ $0 | ✅ $0 | ❌ $50K-200K | ❌ $200K+ |
| **Realtime** | ✅ Sí | ❌ No | ⚠️ Si se implementa | ✅ Sí |
| **Personalización** | ✅ Alta | ⚠️ Limitada | ✅ Total | ⚠️ Media |
| **Escalabilidad** | ✅ Alta | ❌ Baja | ✅ Alta | ✅ Alta |
| **Mantenimiento** | ✅ Bajo | ⚠️ Manual | ❌ Alto | ❌ Alto |
| **Móvil-friendly** | ✅ Nativo | ❌ No | ⚠️ Si se desarrolla | ⚠️ Variable |

### Retorno de Inversión Esperado

**Costos evitados:**
- ❌ Sin licencias de software ($5K-20K/año)
- ❌ Sin servidores dedicados ($100-500/mes)
- ❌ Sin equipo de infraestructura inicial

**Beneficios operacionales:**
- ✅ Reducción de errores de comunicación
- ✅ Visibilidad en tiempo real de operaciones
- ✅ Trazabilidad completa para auditorías
- ✅ Datos para optimización de procesos

---

## 📈 Roadmap Post-Aprobación

### Corto Plazo (0-3 meses)
- [ ] Refinamiento de funcionalidades según feedback
- [ ] Implementación de reportes avanzados
- [ ] PWA para instalación en móviles
- [ ] Exportación de datos a Excel

### Mediano Plazo (3-6 meses)
- [ ] Integración con Microsoft Teams (notificaciones)
- [ ] Dashboard de analytics con Power BI
- [ ] API pública para integraciones
- [ ] Módulo de reportes personalizables

### Largo Plazo (6-12 meses)
- [ ] Migración completa a Azure
- [ ] Módulo de predicción con Machine Learning
- [ ] Integración con ERP corporativo
- [ ] App móvil nativa (iOS/Android)

---

## 🎯 Conclusiones y Recomendaciones

### Fortalezas del MVP Actual

1. ✅ **Arquitectura moderna y escalable** preparada para crecimiento
2. ✅ **Seguridad robusta** con múltiples capas de protección
3. ✅ **Costo cero** durante validación de concepto
4. ✅ **Migración clara** a Azure cuando sea necesario
5. ✅ **Experiencia de usuario** optimizada para operaciones en campo

**Riesgos mínimos, retorno alto.** El costo actual es prácticamente nulo, y el sistema demuestra viabilidad técnica y operacional para escalar a una solución enterprise cuando el negocio lo justifique.

