export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function isSupabaseConfigured() {
  if (process.env.HINGA_FORCE_DEMO === "1") return false;
  const env = getSupabaseEnv();
  return Boolean(env.url && env.publishableKey);
}
