# 📦 Nueva Funcionalidad: Registro de Cantidad de Pallets

## 📋 Resumen

Se ha agregado un sistema de registro obligatorio de cantidad de pallets cargados al finalizar la carga en Planta.

---

## 🎯 Objetivo

Permitir al usuario con rol **PLANTA** registrar la cantidad exacta de pallets que fueron cargados en la rampla al momento de finalizar la carga, mejorando la trazabilidad y control de inventario.

---

## 🗄️ Cambios en Base de Datos

### Script SQL: `database/agregar-cantidad-pallets.sql`

```sql
-- Agregar columna cantidad_pallets a tabla tickets
ALTER TABLE tickets 
ADD COLUMN cantidad_pallets INTEGER;

-- Constraint para validar que sea positivo
ALTER TABLE tickets
ADD CONSTRAINT check_cantidad_pallets_positivo 
CHECK (cantidad_pallets IS NULL OR cantidad_pallets > 0);

-- Índice para consultas
CREATE INDEX idx_tickets_cantidad_pallets ON tickets(cantidad_pallets);
```

### Características:
- **Tipo**: `INTEGER`
- **Nullable**: `SI` (inicialmente para permitir migración)
- **Constraint**: Debe ser mayor a 0 cuando tenga valor
- **Índice**: Para optimizar consultas por cantidad de pallets

---

## 💻 Cambios en el Código

### 1. Modelo TypeScript (`models.ts`)

```typescript
export interface Ticket {
    // ... campos existentes
    cantidad_pallets: number | null; // ⭐ NUEVO
    // ... resto de campos
}
```

### 2. Service (`supabase.service.ts`)

**Método Actualizado:**
```typescript
async finalizarCarga(ticketId: number, cantidadPallets: number): Promise<void> {
    // Validación obligatoria
    if (!cantidadPallets || cantidadPallets <= 0) {
        throw new Error('La cantidad de pallets debe ser mayor a 0');
    }

    // Registrar cantidad en la base de datos
    await this.supabase
        .from('tickets')
        .update({
            estado_actual: 'Cargado - Espera Chofer',
            fecha_alerta_cd: new Date().toISOString(),
            cantidad_pallets: cantidadPallets // ⭐ Registro de cantidad
        })
        .eq('id', ticketId);
}
```

### 3. Dashboard Planta (`dashboard-planta.component.ts`)

**Nuevas Propiedades:**
```typescript
// Para modal de finalizar carga
mostrarModalFinalizarCarga = false;
ticketFinalizarCarga: Ticket | null = null;
cantidadPallets: number | null = null;
```

**Nuevos Métodos:**
```typescript
abrirModalFinalizarCarga(ticket: Ticket): void
cerrarModalFinalizarCarga(): void
async confirmarFinalizarCarga(): Promise<void>
```

**Flujo Actualizado:**
```typescript
// Al hacer click en "Finalizar Carga"
async cambiarEstado(ticket: Ticket, nuevoEstado: any): Promise<void> {
    if (nuevoEstado === 'Fin de Carga') {
        // ⭐ Ya no finaliza directamente, abre modal
        this.abrirModalFinalizarCarga(ticket);
        return;
    }
    // ... resto del código
}
```

---

## 🎨 Interfaz de Usuario

### Modal de Finalizar Carga

**Características:**
1. **Campo obligatorio**: Input numérico para cantidad de pallets
2. **Validación en tiempo real**: Solo acepta números mayores a 0
3. **Información contextual**: Muestra rampla, tipo y muelle
4. **Diseño claro**: Header verde, iconos descriptivos
5. **Alertas visuales**: Mensaje de advertencia sobre el cambio de estado

**Componentes UI:**
```html
<mat-form-field>
  <mat-label>Cantidad de Pallets Cargados</mat-label>
  <input 
    matInput 
    type="number" 
    [(ngModel)]="cantidadPallets"
    min="1"
    required
    autofocus
  >
</mat-form-field>
```

**Botón de Confirmación:**
- Deshabilitado si no hay valor o es ≤ 0
- Muestra spinner durante el proceso
- Icono de check al confirmar

---

## 🔄 Flujo Completo

### Proceso Paso a Paso

1. **Usuario en Planta** tiene un ticket en estado `"Carga iniciada"`

2. **Click en "Finalizar Carga"**
   - Se abre modal emergente
   - Campo de cantidad tiene foco automático

3. **Ingreso de Cantidad**
   - Usuario escribe número de pallets (ej: 33)
   - Validación en tiempo real
   - Botón "Finalizar Carga" se habilita

4. **Confirmación**
   - Click en "Finalizar Carga"
   - Validación final en backend
   - Registro en base de datos

5. **Resultado**
   - Ticket pasa a `"Cargado - Espera Chofer"`
   - Se registra `cantidad_pallets` en BD
   - Se notifica al CD
   - Modal se cierra automáticamente

---

## ✅ Validaciones

### Frontend (TypeScript)
```typescript
if (!cantidadPallets || cantidadPallets <= 0) {
    this.notificationService.agregarNotificacion(
        'Debe ingresar una cantidad válida de pallets',
        ticketId,
        'warning'
    );
    return;
}
```

### Backend (Supabase Service)
```typescript
if (!cantidadPallets || cantidadPallets <= 0) {
    throw new Error('La cantidad de pallets debe ser mayor a 0');
}
```

### Base de Datos (SQL Constraint)
```sql
CHECK (cantidad_pallets IS NULL OR cantidad_pallets > 0)
```

---

## 📊 Casos de Uso

### 1. Finalizar Carga Normal
```
Usuario: Operador Planta
Estado Inicial: "Carga iniciada"
Acción: Ingresar 33 pallets
Estado Final: "Cargado - Espera Chofer"
BD: cantidad_pallets = 33
```

### 2. Intento sin Ingresar Cantidad
```
Usuario: Operador Planta
Acción: Click en "Finalizar Carga" sin ingresar número
Resultado: Botón deshabilitado, no puede continuar
```

### 3. Ingreso de Valor Inválido
```
Usuario: Operador Planta
Acción: Ingresar 0 o número negativo
Resultado: Error visual, botón deshabilitado
```

---

## 🎓 Mejores Prácticas

### Para Usuarios
1. **Contar bien los pallets** antes de finalizar
2. **Verificar el número** antes de confirmar
3. **No dejar el campo vacío** (obligatorio)
4. **Revisar la rampla** en la información del modal

### Para Desarrolladores
1. **Validar siempre** en frontend y backend
2. **Mensajes claros** de error
3. **UI intuitiva** con campo destacado
4. **Logging** para auditoría

---

## 📈 Consultas SQL Útiles

### Ver tickets con cantidad registrada
```sql
SELECT 
    id, 
    tipo_ticket, 
    estado_actual, 
    cantidad_pallets,
    fecha_creacion
FROM tickets 
WHERE cantidad_pallets IS NOT NULL
ORDER BY created_at DESC;
```

### Estadísticas por período
```sql
SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as total_tickets,
    SUM(cantidad_pallets) as total_pallets,
    AVG(cantidad_pallets) as promedio_pallets
FROM tickets
WHERE cantidad_pallets IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

### Top 10 cargas más grandes
```sql
SELECT 
    id,
    tipo_ticket,
    cantidad_pallets,
    nombre_planta,
    fecha_creacion
FROM tickets
WHERE cantidad_pallets IS NOT NULL
ORDER BY cantidad_pallets DESC
LIMIT 10;
```

---

## 🚀 Próximos Pasos (Futuras Mejoras)

- [ ] Hacer campo `cantidad_pallets` NOT NULL después de migración
- [ ] Reportes de cantidad de pallets por planta
- [ ] Gráficos de estadísticas de carga
- [ ] Validación contra capacidad de rampla
- [ ] Historial de cantidades por rampla
- [ ] Alertas si cantidad es muy baja/alta
- [ ] Comparación cantidad solicitada vs cargada

---

## 📞 Soporte

Para problemas o preguntas:
1. Verificar que el script SQL se haya ejecutado correctamente
2. Verificar que el campo aparece en la tabla `tickets`
3. Revisar la consola del navegador para errores
4. Verificar que el usuario tenga rol `planta`

---

## ✅ Checklist de Implementación

- [x] Script SQL creado y documentado
- [x] Columna agregada a tabla `tickets`
- [x] Constraint de validación agregado
- [x] Índice creado para performance
- [x] Interface `Ticket` actualizada en models.ts
- [x] Método `finalizarCarga()` actualizado con parámetro
- [x] Validaciones en service agregadas
- [x] Propiedades del componente agregadas
- [x] Métodos del modal implementados
- [x] HTML del modal creado
- [x] CSS del modal estilizado
- [x] Flujo de cambio de estado actualizado
- [x] Notificaciones con cantidad implementadas
- [x] Documentación completa creada

**¡Funcionalidad Completada!** ✅
