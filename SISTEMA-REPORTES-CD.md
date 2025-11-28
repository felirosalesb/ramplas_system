# 📊 Sistema de Reportes CD - Funcionalidad Crítica

## 🎯 Visión General

Sistema completo de generación de reportes analíticos para el rol CD, permitiendo análisis detallado de:
1. **Viajes de Ramplas**: Seguimiento cronológico de todas las asignaciones
2. **Pallets por Planta**: Análisis de cantidad enviada por cada planta

> **Nota**: Esta funcionalidad es **exclusiva del rol CD** y representa un componente crítico para el éxito del negocio.

---

## 🏗️ Arquitectura

### Componente Principal
**Ubicación**: `src/app/components/reportes-cd/`

**Archivos**:
- `reportes-cd.component.ts` - Lógica del componente (346 líneas)
- `reportes-cd.component.html` - Template (280 líneas)
- `reportes-cd.component.css` - Estilos (430 líneas)
- `reportes-cd.component.spec.ts` - Tests

### Navegación
**Ruta**: `/reportes-cd`
**Acceso**: Navbar → Botón "Reportes" (solo visible para rol CD)
**Guard**: AuthGuard

---

## 📋 Funcionalidades

### 1. Filtros de Búsqueda

**Parámetros Disponibles**:
- **Fecha Inicio**: DatePicker para seleccionar día inicial
- **Hora Inicio**: Input time (00:00 - 23:59)
- **Fecha Fin**: DatePicker para seleccionar día final
- **Hora Fin**: Input time (00:00 - 23:59)

**Validaciones**:
✅ Fecha inicio requerida
✅ Fecha fin requerida
✅ Fecha inicio ≤ Fecha fin
✅ Rango de horas configurable

**Valores por Defecto**:
- Fecha Inicio: Día actual
- Fecha Fin: Día actual
- Hora Inicio: 00:00
- Hora Fin: 23:59

---

### 2. Tabla 1: Viajes de Ramplas

**Descripción**: Registro cronológico de todas las asignaciones de ramplas a plantas

**Estructura**:

| Columna | Descripción | Origen |
|---------|-------------|--------|
| **Rampla** | Nombre de la rampla | `ramplas.nombre` |
| **Viajes** | Lista cronológica de asignaciones | `tickets` ordenados por fecha |

**Información de Cada Viaje**:
- Número correlativo (1, 2, 3...)
- Nombre de la planta
- Número de muelle en planta
- Fecha y hora del viaje (dd/MM HH:mm)
- ID del ticket asociado

**Ordenamiento**:
- Ramplas: Alfabético por nombre
- Viajes: Cronológico ascendente (más antiguo primero)

**Ejemplo Visual**:
```
┌─────────────┬────────────────────────────────────────────────────────┐
│ Rampla      │ Viajes (Planta - Muelle) - Cronológico                │
├─────────────┼────────────────────────────────────────────────────────┤
│ Rampla 01   │ 1. Planta Norte → Muelle 1 │ 28/11 08:30 │ Ticket #45 │
│ 3 viajes    │ 2. Planta Sur → Muelle 2   │ 28/11 14:15 │ Ticket #52 │
│             │ 3. Planta Norte → Muelle 3 │ 28/11 18:45 │ Ticket #61 │
├─────────────┼────────────────────────────────────────────────────────┤
│ Rampla 02   │ 1. Planta Centro → Muelle 1│ 28/11 09:00 │ Ticket #48 │
│ 2 viajes    │ 2. Planta Centro → Muelle 1│ 28/11 16:20 │ Ticket #58 │
└─────────────┴────────────────────────────────────────────────────────┘
```

**Código de Procesamiento**:
```typescript
private procesarViajesRamplas(tickets: any[]): void {
    const viajesPorRampla = new Map<string, any[]>();

    tickets.forEach(ticket => {
        if (ticket.rampla_asignada) {
            const nombreRampla = ticket.rampla_asignada.nombre;
            
            if (!viajesPorRampla.has(nombreRampla)) {
                viajesPorRampla.set(nombreRampla, []);
            }

            viajesPorRampla.get(nombreRampla)!.push({
                planta: ticket.nombre_planta || 'Sin nombre',
                muelle: ticket.muelle_planta,
                fecha: new Date(ticket.fecha_creacion),
                ticketId: ticket.id
            });
        }
    });

    // Ordenar viajes cronológicamente
    this.viajesRamplas = Array.from(viajesPorRampla.entries())
        .map(([rampla, viajes]) => ({
            rampla,
            viajes: viajes.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
        }))
        .sort((a, b) => a.rampla.localeCompare(b.rampla));
}
```

---

### 3. Tabla 2: Cantidad de Pallets por Planta

**Descripción**: Análisis cuantitativo de pallets enviados por cada planta

**Estructura**:

| Columna | Descripción | Cálculo |
|---------|-------------|---------|
| **Planta** | Nombre de la planta | `usuarios.nombre_planta` |
| **Cantidad Enviada** | Total de pallets | SUM(`tickets.cantidad_pallets`) |
| **N° Tickets** | Cantidad de tickets | COUNT(tickets) |
| **Promedio por Ticket** | Promedio de pallets | Cantidad Enviada / N° Tickets |

**Características**:
- ✅ Solo incluye tickets con `cantidad_pallets` registrada
- ✅ Ordenamiento descendente por cantidad enviada
- ✅ Cálculo de promedio con 2 decimales
- ✅ Fila de totales al final

**Ejemplo Visual**:
```
┌────────────────┬──────────────────┬────────────┬──────────────────────┐
│ Planta         │ Cantidad Enviada │ N° Tickets │ Promedio por Ticket  │
├────────────────┼──────────────────┼────────────┼──────────────────────┤
│ Planta Norte   │ 🎁 165          │ 5          │ 33.00 pallets        │
│ Planta Sur     │ 🎁 132          │ 4          │ 33.00 pallets        │
│ Planta Centro  │ 🎁 99           │ 3          │ 33.00 pallets        │
└────────────────┴──────────────────┴────────────┴──────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Total General: 396 pallets │ Total Tickets: 12 │ Promedio: 33.00     │
└────────────────────────────────────────────────────────────────────────┘
```

**Código de Procesamiento**:
```typescript
private procesarPalletsPorPlanta(tickets: any[]): void {
    const palletsPorPlanta = new Map<string, { cantidad: number; tickets: number }>();

    tickets.forEach(ticket => {
        if (ticket.nombre_planta && ticket.cantidad_pallets) {
            const planta = ticket.nombre_planta;
            
            if (!palletsPorPlanta.has(planta)) {
                palletsPorPlanta.set(planta, { cantidad: 0, tickets: 0 });
            }

            const data = palletsPorPlanta.get(planta)!;
            data.cantidad += ticket.cantidad_pallets;
            data.tickets += 1;
        }
    });

    this.palletsPorPlanta = Array.from(palletsPorPlanta.entries())
        .map(([planta, data]) => ({
            planta,
            cantidadEnviada: data.cantidad,
            numeroTickets: data.tickets,
            promedio: Math.round((data.cantidad / data.tickets) * 100) / 100
        }))
        .sort((a, b) => b.cantidadEnviada - a.cantidadEnviada);
}
```

---

### 4. Estadísticas Generales

**4 Cards con Métricas Clave**:

1. **Pallets Totales** 📦
   - Color: Morado (Primary)
   - Cálculo: SUM de todos los pallets
   
2. **Tickets Finalizados** 🎫
   - Color: Verde (Success)
   - Cálculo: COUNT de tickets procesados
   
3. **Viajes Realizados** 🚚
   - Color: Azul (Info)
   - Cálculo: COUNT total de asignaciones
   
4. **Promedio por Ticket** 📊
   - Color: Naranja (Warning)
   - Cálculo: Pallets Totales / Tickets Finalizados

---

## 🔍 Consulta a Base de Datos

### Método del Service

```typescript
async getTicketsFinalizadosRango(
    fechaInicio: string, 
    fechaFin: string
): Promise<Ticket[]> {
    const { data, error } = await this.supabase
        .from('tickets')
        .select(`
            *,
            rampla_asignada:ramplas!rampla_asignada_id(*)
        `)
        .gte('fecha_creacion', fechaInicio)
        .lte('fecha_creacion', fechaFin)
        .in('estado_actual', [
            'Fin Descarga',
            'Libre',
            'Cargado - Espera Chofer',
            'Asignada a Muelle CD',
            'Inicio Descarga'
        ])
        .not('cantidad_pallets', 'is', null) // CRÍTICO: Solo con pallets registrados
        .order('fecha_creacion', { ascending: true });

    return data || [];
}
```

**Estados Considerados "Finalizados"**:
- `Fin Descarga` ✅
- `Libre` ✅
- `Cargado - Espera Chofer` ✅
- `Asignada a Muelle CD` ✅
- `Inicio Descarga` ✅

**Filtro Crítico**:
```typescript
.not('cantidad_pallets', 'is', null)
```
> Solo incluye tickets que tienen cantidad de pallets registrada (cuando Planta finalizó la carga)

---

## 🎨 Diseño UI/UX

### Colores y Temas

**Card de Estadísticas**:
- Primary (Morado): `#667eea` → `#764ba2`
- Success (Verde): `#4CAF50` → `#45a049`
- Info (Azul): `#2196F3` → `#1976d2`
- Warning (Naranja): `#FF9800` → `#f57c00`

**Tabla de Viajes**:
- Border izquierdo verde: `#4CAF50`
- Background items: `#f9f9f9`
- Hover: Elevación sutil

**Tabla de Pallets**:
- Icono factory (Planta): Naranja `#FF9800`
- Icono inventory (Pallets): Verde `#4CAF50`
- Números grandes y destacados

**Totales**:
- Background gradiente morado: `#667eea` → `#764ba2`
- Texto blanco con opacidad 0.9
- Números grandes y bold

---

## 📱 Responsive Design

### Desktop (> 768px)
- Grid de 4 columnas para stats
- Tabla completa con scroll horizontal
- Filtros en grid de 4 columnas

### Mobile (≤ 768px)
- Grid de 1 columna para stats
- Filtros en columna
- Viajes wrappean
- Totales en columna

---

## 🚀 Flujo de Uso

### Paso a Paso

1. **Usuario CD accede** a "Reportes" desde navbar
2. **Selecciona rango** de fechas y horas (por defecto: hoy completo)
3. **Click en "Generar Reporte"**
4. **Sistema consulta** tickets finalizados en el rango
5. **Procesa datos** para ambas tablas
6. **Muestra resultados**:
   - 4 cards de estadísticas
   - Tabla de viajes de ramplas
   - Tabla de pallets por planta
7. **Usuario puede**:
   - Exportar a Excel (próximamente)
   - Exportar a PDF (próximamente)
   - Limpiar reporte
   - Generar nuevo reporte

---

## ⚙️ Validaciones y Errores

### Validaciones Frontend

```typescript
// Fechas requeridas
if (!this.fechaInicio || !this.fechaFin) {
    notificación: 'Debes seleccionar las fechas'
}

// Fecha inicio ≤ Fecha fin
if (this.fechaInicio > this.fechaFin) {
    notificación: 'Fecha inicio no puede ser mayor'
}
```

### Manejo de Datos Vacíos

```typescript
if (tickets.length === 0) {
    // Muestra mensaje informativo
    // Limpia tablas
    // No muestra error
}
```

### Estados de UI

- **Inicial**: Mensaje "Generar Reporte"
- **Cargando**: Spinner con mensaje "Generando reporte..."
- **Con Datos**: Muestra tablas y stats
- **Sin Datos**: "No se encontraron tickets"

---

## 📊 Interfaces TypeScript

```typescript
interface ViajeRampla {
    rampla: string;
    viajes: {
        planta: string;
        muelle: number;
        fecha: Date;
        ticketId: number;
    }[];
}

interface PalletsPorPlanta {
    planta: string;
    cantidadEnviada: number;
    numeroTickets: number;
    promedio: number;
}
```

---

## 🔮 Funcionalidades Futuras

### 1. Exportación a Excel
```typescript
exportarExcel(): void {
    // Usar librería como xlsx o exceljs
    // Generar archivo con ambas tablas
    // Incluir gráficos
    // Formato profesional
}
```

### 2. Exportación a PDF
```typescript
exportarPDF(): void {
    // Usar jsPDF o pdfmake
    // Incluir logo y header
    // Tablas formateadas
    // Gráficos estadísticos
}
```

### 3. Gráficos Visuales
- Gráfico de barras: Pallets por planta
- Gráfico de líneas: Evolución temporal
- Gráfico circular: Distribución de viajes

### 4. Filtros Adicionales
- Por tipo de ticket
- Por rampla específica
- Por planta específica
- Por rango de pallets

### 5. Comparación de Períodos
- Mes actual vs mes anterior
- Semana actual vs semana anterior
- Análisis de tendencias

---

## 🎓 Mejores Prácticas

### Para Usuarios CD

1. **Genera reportes diarios** al final del turno
2. **Revisa estadísticas** para identificar patrones
3. **Compara plantas** para optimizar recursos
4. **Identifica ramplas** más utilizadas
5. **Exporta datos** para análisis externos

### Para Desarrolladores

1. **Optimiza queries** con índices apropiados
2. **Cachea datos** si el rango es grande
3. **Pagina resultados** si hay muchos tickets
4. **Valida datos** antes de procesar
5. **Maneja errores** gracefully

---

## 📈 Valor de Negocio

### KPIs Medibles

1. **Eficiencia Operacional**
   - Viajes por rampla
   - Promedio de pallets por ticket
   - Tiempo entre viajes

2. **Productividad por Planta**
   - Pallets enviados
   - Frecuencia de envíos
   - Cumplimiento de solicitudes

3. **Utilización de Recursos**
   - Ramplas más/menos usadas
   - Balance de carga entre plantas
   - Identificación de cuellos de botella

4. **Toma de Decisiones**
   - Inversión en ramplas adicionales
   - Reasignación de recursos
   - Planificación de mantenimiento

---

## ✅ Checklist de Implementación

- [x] Componente ReportesCdComponent creado
- [x] Template HTML con 2 tablas
- [x] Estilos CSS responsive
- [x] Método getTicketsFinalizadosRango en service
- [x] Procesamiento de viajes de ramplas
- [x] Procesamiento de pallets por planta
- [x] Cálculo de estadísticas
- [x] Validaciones de filtros
- [x] Ruta agregada a app.routes.ts
- [x] Link en navbar (solo rol CD)
- [x] Estados de carga y vacío
- [x] Cards de estadísticas
- [x] Totales en tabla de pallets
- [x] Ordenamiento cronológico
- [x] Responsive design
- [x] Sin errores de compilación

**¡Sistema de Reportes Completado!** ✅

---

## 🎯 Impacto en el Negocio

> "Este sistema de reportes permite al CD tomar decisiones basadas en datos reales, optimizar recursos y demostrar el valor del sistema a la organización. Es la diferencia entre operar reactivamente y estratégicamente."

**Capacidades Clave**:
- ✅ Visibilidad completa de operaciones
- ✅ Análisis histórico con rango personalizable
- ✅ Métricas de rendimiento en tiempo real
- ✅ Base para expansión y escalabilidad
- ✅ Justificación de inversiones

**Este módulo convierte datos operacionales en inteligencia de negocio.** 📊🚀
