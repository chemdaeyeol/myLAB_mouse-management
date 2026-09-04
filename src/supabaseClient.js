import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// 편집 권한용 계정 이메일 (Supabase Authentication에서 만든 계정)
export const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL || "";
export const hasConfig = Boolean(url && key);
export const supabase = hasConfig ? createClient(url, key) : null;
