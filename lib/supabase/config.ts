function normalizeEnv(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseServiceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

export function isSupabaseConfigured() {
  return Boolean(isValidUrl(supabaseUrl) && supabaseAnonKey);
}

export function isSupabaseAdminConfigured() {
  return Boolean(isValidUrl(supabaseUrl) && supabaseServiceRoleKey);
}
