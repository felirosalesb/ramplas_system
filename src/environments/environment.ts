// src/environments/environment.ts
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE ENTORNO - DESARROLLO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ IMPORTANTE: Las credenciales actuales son de EJEMPLO y deben ser reemplazadas.
 * 
 * Para obtener tus credenciales:
 * 1. Crea un proyecto en https://supabase.com/
 * 2. Ve a Project Settings → API
 * 3. Copia:
 *    - Project URL → supabaseUrl
 *    - anon/public key → supabaseKey
 * 
 * Ver: README.md y CONFIGURACION_PENDIENTE.txt para más detalles
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const environment = {
    production: false,

    // ⚠️ REEMPLAZAR con tus credenciales de Supabase
    supabaseUrl: 'https://TU-PROYECTO.supabase.co',
    supabaseKey: 'TU_SUPABASE_ANON_KEY_AQUI',

    // Opcional: Webhook de Microsoft Teams para notificaciones
    // Dejar vacío ('') si no se usa Teams
    teamsWebhookUrl: '' // Opcional
};

