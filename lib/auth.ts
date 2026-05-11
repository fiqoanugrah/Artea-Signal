import { unstable_rethrow } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "admin" | "reviewer" | "member";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to read current user", error);
    return null;
  }
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id,email,full_name,username,avatar_url,role,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    return data;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to read current profile", error);
    return null;
  }
}

export async function isCurrentUserAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}

export async function canCurrentUserTriage() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" || profile?.role === "reviewer";
}
