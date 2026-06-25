import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yootmdmuypdjhskartsf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvb3RtZG11eXBkamhza2FydHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxODQ2NTUsImV4cCI6MjA5Nzc2MDY1NX0.w-_5QFxqKE_YYVcIOT13g3C5_FZGAxknGhS6R30Jymo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const ADMIN_EMAIL = "tonistark370140@gmail.com";
export const STORAGE_BUCKET = "study-materials";
