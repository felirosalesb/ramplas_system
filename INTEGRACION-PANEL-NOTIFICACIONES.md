# 🚀 Guía Rápida: Integrar Panel de Notificaciones

## 📋 Checklist Rápido

Para integrar el panel de notificaciones en un dashboard:

### 1. Importar el Componente

```typescript
// dashboard-ejemplo.component.ts
import { NotificacionesPanelComponent } from '../notificaciones-panel/notificaciones-panel.component';

@Component({
  selector: 'app-dashboard-ejemplo',
  standalone: true,
  imports: [
    // ... otros imports
    NotificacionesPanelComponent  // ⭐ Agregar aquí
  ],
  // ...
})
```

### 2. Agregar en el HTML

```html
<!-- dashboard-ejemplo.component.html -->

<!-- Al inicio o al final del template -->
<app-notificaciones-panel></app-notificaciones-panel>

<!-- El resto del contenido -->
<div class="dashboard-content">
  <!-- Tu contenido aquí -->
</div>
```

### 3. Configurar Rol en ngOnInit (ya hecho ✅)

Ya está configurado en todos los dashboards:
- ✅ `dashboard-planta.component.ts` → rol: 'planta'
- ✅ `dashboard-cd.component.ts` → rol: 'cd'
- ✅ `dashboard-admin.component.ts` → rol: 'admin'
- ✅ `dashboard-galpon.component.ts` → rol: 'galpon'

---

## 🎯 Dashboards que Necesitan Integración

### Dashboard Planta
**Archivo:** `src/app/components/dashboard-planta/dashboard-planta.component.ts`

```typescript
import { NotificacionesPanelComponent } from '../notificaciones-panel/notificaciones-panel.component';

imports: [
  // ... otros imports
  NotificacionesPanelComponent
]
```

**HTML:** `dashboard-planta.component.html`
```html
<app-notificaciones-panel></app-notificaciones-panel>
<app-navbar></app-navbar>
<!-- resto del contenido -->
```

---

### Dashboard CD
**Archivo:** `src/app/components/dashboard-cd/dashboard-cd.component.ts`

```typescript
import { NotificacionesPanelComponent } from '../notificaciones-panel/notificaciones-panel.component';

imports: [
  // ... otros imports
  NotificacionesPanelComponent
]
```

**HTML:** `dashboard-cd.component.html`
```html
<app-notificaciones-panel></app-notificaciones-panel>
<app-navbar></app-navbar>
<!-- resto del contenido -->
```

---

### Dashboard Admin
**Archivo:** `src/app/components/dashboard-admin/dashboard-admin.component.ts`

```typescript
import { NotificacionesPanelComponent } from '../notificaciones-panel/notificaciones-panel.component';

imports: [
  // ... otros imports
  NotificacionesPanelComponent
]
```

**HTML:** `dashboard-admin.component.html`
```html
<app-notificaciones-panel></app-notificaciones-panel>
<app-navbar></app-navbar>
<!-- resto del contenido -->
```

---

### Dashboard Galpón
**Archivo:** `src/app/components/dashboard-galpon/dashboard-galpon.component.ts`

```typescript
import { NotificacionesPanelComponent } from '../notificaciones-panel/notificaciones-panel.component';

imports: [
  // ... otros imports
  NotificacionesPanelComponent
]
```

**HTML:** `dashboard-galpon.component.html`
```html
<app-notificaciones-panel></app-notificaciones-panel>
<app-navbar></app-navbar>
<!-- resto del contenido -->
```

---

## 💡 Notas Importantes

1. **Posición del Componente**
   - El componente se posiciona automáticamente (fixed)
   - No importa dónde lo pongas en el HTML
   - Recomendado: Al inicio del template para mejor visibilidad en el código

2. **Estilos**
   - No necesita estilos adicionales
   - Ya viene con todo incluido
   - Responsive automático

3. **No Interfiere**
   - El botón flotante no bloquea contenido
   - El panel se superpone temporalmente
   - El overlay permite cerrar haciendo clic fuera

4. **Funcionalidad**
   - ✅ Filtrado automático por rol
   - ✅ Badge con contador de no leídas
   - ✅ Animación de pulso cuando hay notificaciones
   - ✅ Auto-muestra para prioridades altas/críticas

---

## 🧪 Pruebas

Después de integrar, verificar:

1. **Aparece el botón flotante** (bottom-right, color morado)
2. **Click abre el panel** desde la derecha
3. **Badge muestra contador** si hay notificaciones no leídas
4. **Solo muestra notificaciones del rol** actual
5. **Acciones funcionan** (Ver Ticket, Marcar leída, Eliminar)

---

## 🎨 Opcional: Personalización

Si necesitas ajustar estilos específicos del dashboard:

```css
/* dashboard-ejemplo.component.css */

/* Ajustar posición del botón flotante solo en este dashboard */
::ng-deep .notif-fab {
  bottom: 80px; /* Si tienes otro botón flotante */
}

/* Cambiar ancho del panel solo en este dashboard */
::ng-deep .notif-panel {
  width: 500px;
}
```

> ⚠️ **Advertencia**: Usar `::ng-deep` con precaución, afecta estilos globales

---

## 📞 Soporte

Si algo no funciona:
1. Verificar que el import esté correcto
2. Verificar que el componente esté en el array de imports
3. Revisar la consola del navegador para errores
4. Verificar que el rol esté configurado en ngOnInit
