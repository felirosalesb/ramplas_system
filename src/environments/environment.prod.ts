// src/environments/environment.prod.ts
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE ENTORNO - PRODUCCIÓN
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ CRÍTICO: Estas credenciales se usan en producción.
 * 
 * RECOMENDACIÓN:
 * - Usa un proyecto de Supabase DIFERENTE para producción
 * - Configura variables de entorno en tu plataforma de hosting (Vercel, Netlify, etc.)
 * - NO subas credenciales reales a repositorios públicos
 * 
 * Para Vercel:
 *   Settings → Environment Variables → Add:
 *   - SUPABASE_URL
 *   - SUPABASE_KEY
 *   - TEAMS_WEBHOOK_URL
 * 
 * Ver: README.md sección "Variables de Entorno en Producción"
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const environment = {
    production: true,

    // ⚠️ REEMPLAZAR con credenciales de PRODUCCIÓN de Supabase
    supabaseUrl: 'https://TU-PROYECTO-PRODUCCION.supabase.co',
    supabaseKey: 'TU_SUPABASE_ANON_KEY_PRODUCCION_AQUI',

    // Opcional: Webhook de Microsoft Teams para notificaciones en producción
    teamsWebhookUrl: ''
};