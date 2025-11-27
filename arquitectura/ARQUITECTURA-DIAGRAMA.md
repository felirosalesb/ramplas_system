# Diagrama de Arquitectura - Sistema de Gestión de Ramplas y Muelles

## Diagrama Mermaid

```mermaid
graph TB
    subgraph "Capa de Presentación - Frontend Angular 17+"
        subgraph "Componentes de Autenticación"
            LOGIN[LoginComponent]
        end
        
        subgraph "Componentes de Administración"
            ADMIN[DashboardAdminComponent<br/>Gestión Ramplas]
            GESTION_M[GestionMuellesComponent<br/>Gestión Muelles]
        end
        
        subgraph "Componentes Rol Planta"
            PLANTA[DashboardPlantaComponent<br/>Solicitudes Retiro]
        end
        
        subgraph "Componentes Rol CD"
            CD[DashboardCdComponent<br/>Asignar Ramplas]
        end
        
        subgraph "Componentes Rol Galpón"
            GALPON[DashboardGalponComponent<br/>Solicitudes Envío]
        end
        
        subgraph "Componentes de Monitoreo"
            MON_R[MonitorRamplasComponent<br/>Vista Ramplas]
            MON_M[MonitorMuellesComponent<br/>Vista Muelles]
            DETALLE[DetalleTicketComponent<br/>Vista Detallada]
        end
        
        subgraph "Componentes Compartidos"
            NAVBAR[NavbarComponent<br/>Navegación]
            NOTIF[NotificacionesComponent<br/>Alertas]
        end
    end
    
    subgraph "Capa de Lógica de Negocio - Services"
        SUPABASE[SupabaseService<br/>- Autenticación<br/>- CRUD Tickets<br/>- CRUD Ramplas<br/>- CRUD Muelles<br/>- Realtime Subscriptions]
        NOTIFICATION[NotificationService<br/>- Gestión Alertas<br/>- Notificaciones UI]
        ALERT[AlertService<br/>- SweetAlert2<br/>- Confirmaciones]
    end
    
    subgraph "Capa de Seguridad"
        AUTH_GUARD[AuthGuard<br/>- Protección Rutas<br/>- Verificación Usuario]
    end
    
    subgraph "Capa de Modelos"
        MODELS[models.ts<br/>- Rampla<br/>- Muelle<br/>- Ticket<br/>- Usuario<br/>- RegistroTiempo<br/>- DTOs]
    end
    
    subgraph "Capa de Configuración"
        ROUTES[app.routes.ts<br/>Definición Rutas]
        ENV[environment.ts<br/>Variables Entorno]
        CONFIG[app.config.ts<br/>Configuración App]
    end
    
    subgraph "Backend - Supabase"
        subgraph "Base de Datos PostgreSQL"
            DB_USUARIOS[(Tabla: usuarios<br/>- id (UUID)<br/>- email<br/>- rol<br/>- nombre<br/>- nombre_planta)]
            DB_TICKETS[(Tabla: tickets<br/>- id<br/>- tipo_ticket<br/>- estado_actual<br/>- cantidad_pallet<br/>- muelle_planta<br/>- rampla_asignada_id<br/>- muelle_asignado_id<br/>- observaciones<br/>- motivo_bloqueo)]
            DB_RAMPLAS[(Tabla: ramplas<br/>- id<br/>- nombre<br/>- tipo_rampla<br/>- estado<br/>- activo<br/>- motivo_bloqueo<br/>- ticket_actual_id)]
            DB_MUELLES[(Tabla: muelles<br/>- id<br/>- nombre<br/>- estado<br/>- activo<br/>- motivo_bloqueo<br/>- ticket_actual_id)]
            DB_REGISTRO[(Tabla: registro_tiempos<br/>- id<br/>- ticket_id<br/>- estado_registrado<br/>- fecha_hora<br/>- usuario_id)]
        end
        
        subgraph "Funcionalidades Supabase"
            AUTH[Supabase Auth<br/>- Login/Logout<br/>- Session Management]
            RLS[Row Level Security<br/>- Políticas Acceso<br/>- Seguridad Datos]
            REALTIME[Realtime<br/>- Subscripciones<br/>- Actualizaciones Live]
            TRIGGERS[DB Triggers<br/>- limpiar_motivo_rampla<br/>- limpiar_motivo_muelle]
        end
    end
    
    %% Conexiones Frontend -> Services
    LOGIN --> SUPABASE
    ADMIN --> SUPABASE
    ADMIN --> NOTIFICATION
    ADMIN --> ALERT
    GESTION_M --> SUPABASE
    GESTION_M --> NOTIFICATION
    GESTION_M --> ALERT
    PLANTA --> SUPABASE
    PLANTA --> NOTIFICATION
    PLANTA --> ALERT
    CD --> SUPABASE
    CD --> NOTIFICATION
    CD --> ALERT
    GALPON --> SUPABASE
    GALPON --> NOTIFICATION
    MON_R --> SUPABASE
    MON_M --> SUPABASE
    DETALLE --> SUPABASE
    NAVBAR --> SUPABASE
    NOTIF --> NOTIFICATION
    
    %% Conexiones Services -> Models
    SUPABASE -.-> MODELS
    NOTIFICATION -.-> MODELS
    
    %% Conexiones Guards
    AUTH_GUARD --> SUPABASE
    ROUTES --> AUTH_GUARD
    
    %% Conexiones Config
    SUPABASE --> ENV
    CONFIG --> ROUTES
    
    %% Conexiones Backend
    SUPABASE --> AUTH
    SUPABASE --> DB_TICKETS
    SUPABASE --> DB_RAMPLAS
    SUPABASE --> DB_MUELLES
    SUPABASE --> DB_USUARIOS
    SUPABASE --> DB_REGISTRO
    SUPABASE --> REALTIME
    
    %% Seguridad
    DB_TICKETS -.-> RLS
    DB_RAMPLAS -.-> RLS
    DB_MUELLES -.-> RLS
    DB_USUARIOS -.-> RLS
    DB_REGISTRO -.-> RLS
    
    %% Triggers
    DB_RAMPLAS --> TRIGGERS
    DB_MUELLES --> TRIGGERS
    
    %% Realtime Connections
    REALTIME -.->|Updates| MON_R
    REALTIME -.->|Updates| MON_M
    REALTIME -.->|Updates| ADMIN
    REALTIME -.->|Updates| GESTION_M
    REALTIME -.->|Updates| CD
    REALTIME -.->|Updates| PLANTA
    REALTIME -.->|Updates| GALPON
    
    classDef frontend fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef service fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef security fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef config fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    
    class LOGIN,ADMIN,GESTION_M,PLANTA,CD,GALPON,MON_R,MON_M,DETALLE,NAVBAR,NOTIF frontend
    class SUPABASE,NOTIFICATION,ALERT service
    class DB_USUARIOS,DB_TICKETS,DB_RAMPLAS,DB_MUELLES,DB_REGISTRO,AUTH,RLS,REALTIME,TRIGGERS backend
    class AUTH_GUARD security
    class ROUTES,ENV,CONFIG,MODELS config
```

## Vista Simplificada de Flujos Principales

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend Angular
    participant S as SupabaseService
    participant DB as Supabase DB
    participant RT as Realtime
    
    %% Flujo de Autenticación
    rect rgb(230, 245, 255)
        Note over U,DB: Flujo de Autenticación
        U->>F: Ingresa credenciales
        F->>S: signIn(email, password)
        S->>DB: auth.signInWithPassword()
        DB-->>S: session + user
        S-->>F: Usuario autenticado
        F->>S: obtenerUsuarioPorId(userId)
        S->>DB: SELECT * FROM usuarios
        DB-->>S: Datos usuario (rol, nombre)
        S-->>F: Usuario completo
        F->>F: Redirección según rol
    end
    
    %% Flujo de Creación de Ticket
    rect rgb(255, 243, 224)
        Note over U,RT: Flujo de Creación de Ticket
        U->>F: Crear solicitud (Planta)
        F->>S: crearTicketPlanta(dto)
        S->>DB: INSERT INTO tickets
        DB-->>S: Ticket creado
        S->>DB: INSERT registro_tiempos (x2)
        S-->>F: Ticket confirmado
        DB->>RT: Cambio detectado
        RT-->>F: Actualización en tiempo real
        F->>F: Actualizar vista CD
    end
    
    %% Flujo de Asignación de Rampla
    rect rgb(243, 229, 245)
        Note over U,RT: Flujo de Asignación de Rampla
        U->>F: Asignar rampla (CD)
        F->>S: asignarRampla(dto)
        S->>DB: UPDATE tickets (rampla_id, estado)
        S->>DB: UPDATE ramplas (estado='En Servicio')
        S->>DB: INSERT registro_tiempos
        DB-->>S: Actualizado
        S-->>F: Asignación exitosa
        DB->>RT: Cambio detectado
        RT-->>F: Actualización monitores
    end
    
    %% Flujo de Bloqueo de Recurso
    rect rgb(255, 235, 238)
        Note over U,RT: Flujo de Bloqueo de Recurso
        U->>F: Desactivar rampla/muelle (Admin)
        F->>F: Mostrar modal motivo
        U->>F: Seleccionar motivo bloqueo
        F->>S: cambiarEstadoActivo(id, false, motivo)
        S->>DB: UPDATE ramplas/muelles (activo=false, motivo_bloqueo)
        DB-->>S: Actualizado
        S-->>F: Recurso bloqueado
        DB->>RT: Cambio detectado
        RT-->>F: Actualizar monitores
        Note over F: Mostrar estado "Inactivo" con motivo
    end
```

## Arquitectura de Estados de Tickets

```mermaid
stateDiagram-v2
    [*] --> SolicitudCreada: Usuario crea solicitud
    
    SolicitudCreada --> PendienteAsignacion: Sistema registra
    
    PendienteAsignacion --> RamplaEnTransito: CD asigna rampla
    
    state tipo_ticket <<choice>>
    RamplaEnTransito --> tipo_ticket
    
    tipo_ticket --> RamplaEnPlanta: Retiro pallets
    tipo_ticket --> RamplaEnGalpon: Solicitar pallets
    
    %% Flujo RETIRO
    RamplaEnPlanta --> CargaIniciada: Iniciar carga
    CargaIniciada --> FinDeCarga: Fin carga
    FinDeCarga --> CargadoEsperaChofer: Espera chofer
    CargadoEsperaChofer --> AsignadaMuelleCD: Llega a CD
    
    %% Flujo ENVÍO
    RamplaEnGalpon --> CargaIniciadaGalpon: Iniciar carga
    CargaIniciadaGalpon --> RamplaCargadaTransitoCD: Fin carga + tránsito
    RamplaCargadaTransitoCD --> AsignadaMuelleCD: Llega a CD
    
    %% Flujo común en CD
    AsignadaMuelleCD --> InicioDescarga: CD inicia descarga
    InicioDescarga --> FinDescarga: CD finaliza descarga
    FinDescarga --> Libre: Liberar recursos
    
    %% Estados de cancelación
    PendienteAsignacion --> CanceladoPorCD: CD cancela
    RamplaEnTransito --> CanceladoPorCD: CD cancela
    
    Libre --> [*]
    CanceladoPorCD --> [*]
    
    note right of PendienteAsignacion
        Usuario Planta crea solicitud
        Sistema genera alerta para CD
    end note
    
    note right of RamplaEnTransito
        CD asigna rampla disponible
        Rampla cambia a "En Servicio"
    end note
    
    note right of AsignadaMuelleCD
        Sistema asigna muelle libre
        automáticamente o manualmente
    end note
    
    note right of CanceladoPorCD
        CD puede cancelar con motivo
        Se guarda en observaciones
        Libera rampla y muelle
    end note
```
