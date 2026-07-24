/* ═══════════════════════════════════════════════════════
   SUPABASE CLIENT CONFIGURATION
   Bhawantha Lakshan Portfolio
   ═══════════════════════════════════════════════════════

   SETUP INSTRUCTIONS:
   1. Go to https://supabase.com and create a free project
   2. Go to Settings → API in your project
   3. Replace the two values below with YOUR project's values:
      - SUPABASE_URL  → "Project URL"
      - SUPABASE_ANON_KEY → "anon public" key (safe to expose)

   ⚠️  NEVER put your "service_role" key here — anon key only!
   ═══════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://qrqsmwmasjbyhxfgdxpd.supabase.co';       // e.g. https://xyzabcdef.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_Pk63OhWC4T2LA_lxNDKSbQ_wrThGeG1';  // Starts with "eyJ..."

/* ── Initialize the Supabase client (uses the global from CDN) ── */
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,    // Keeps admin logged in across page refreshes
    autoRefreshToken: true,    // Silently refreshes JWT tokens
    detectSessionInUrl: true,   // Required for magic link / OAuth flows
  },
});

/* Export as a named constant so both admin.js and main.js use the same instance */
window.db = _supabase;
