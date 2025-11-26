# 🔧 Instrucciones para Aplicar la Migración

## Problema Detectado
El error `new row for relation "tickets" violates check constraint "check_tipo_ticket"` ocurre porque:

- **Base de datos actual**: Tiene el constraint con valores `'retiro'` y `'envio'`
- **Código frontend**: Está enviando valores `'Retiro pallets producción'` y `'Solicitar Pallets vacíos'`

## Solución: Ejecutar la Migración

### Pasos:

1. **Abrir Supabase Dashboard**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto `ramplas_system`

2. **Ir al SQL Editor**
   - En el menú lateral, haz clic en **SQL Editor**
   - O usa el atajo: `Ctrl + K` → busca "SQL Editor"

3. **Ejecutar el Script de Migración**
   - Abre el archivo `migration-add-tipo-ticket.sql`
   - Copia **TODO** el contenido del archivo (líneas 1-106)
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **Run** o presiona `Ctrl + Enter`

4. **Verificar que se ejecutó correctamente**
   - Deberías ver el mensaje: `✅ Migración de tipo_ticket completada exitosamente`
   - También verás los resultados de las consultas de verificación

### ¿Qué hace esta migración?

1. ✅ Agrega la columna `tipo_ticket` (si no existe)
2. ✅ Actualiza el CHECK constraint con los nuevos valores oficiales
3. ✅ Actualiza el constraint de `usuarios.rol` para incluir `'galpon'`
4. ✅ Actualiza los estados permitidos en `tickets.estado_actual`
5. ✅ Actualiza las políticas RLS para incluir el rol `'galpon'`

### Después de la Migración

Una vez ejecutada la migración, el error desaparecerá y podrás:
- ✅ Crear tickets de tipo "Retiro pallets producción"
- ✅ Crear tickets de tipo "Solicitar Pallets vacíos"
- ✅ Crear usuarios con rol "galpon"

---

## 📝 Notas Importantes

- **No necesitas detener la aplicación** para ejecutar la migración
- La migración es **idempotente**: puedes ejecutarla múltiples veces sin problemas
- Todos los tickets existentes automáticamente tendrán `tipo_ticket = 'Retiro pallets producción'` (el valor por defecto)
