"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentProfile, type ProfileRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function encoded(value: string) {
  return encodeURIComponent(value);
}

async function getOrigin() {
  const headerStore = await headers();
  return (
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=Supabase%20belum%20dikonfigurasi");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/submit");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encoded(error.message)}`);
  }

  redirect(next);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  redirect(`/login?message=${encoded(`Public signup disabled. Ask an admin to invite ${email || "the user"}.`)}`);
}

export async function inviteUser(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/users?error=Supabase%20belum%20dikonfigurasi");
  }

  if (!isSupabaseAdminConfigured()) {
    redirect("/admin/users?error=Service%20role%20key%20belum%20dikonfigurasi");
  }

  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    redirect("/login?next=/admin/users&error=Admin%20access%20required");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "member") as ProfileRole;
  const safeRoles: ProfileRole[] = ["member", "reviewer", "admin"];
  const userRole = safeRoles.includes(role) ? role : "member";
  const origin = await getOrigin();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: userRole
    },
    redirectTo: `${origin}/auth/callback?next=/profile`
  });

  if (error) {
    redirect(`/admin/users?error=${encoded(error.message)}`);
  }

  if (data.user) {
    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName || null,
      role: userRole
    });
  }

  redirect(`/admin/users?message=${encoded(`Invite sent to ${email}`)}`);
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function updateProfile(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/profile?error=Supabase%20belum%20dikonfigurasi");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile&error=Login%20required");
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const avatar = formData.get("avatar");
  let avatarUrl: string | undefined;

  if (avatar instanceof File && avatar.size > 0) {
    const extension = avatar.name.split(".").pop() || "png";
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, avatar, {
      contentType: avatar.type || "image/png",
      upsert: true
    });

    if (uploadError) {
      redirect(`/profile?error=${encoded(uploadError.message)}`);
    }

    const { data } = supabase.storage.from("profile-avatars").getPublicUrl(path);
    avatarUrl = data.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      username: username || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/profile?error=${encoded(error.message)}`);
  }

  redirect("/profile?message=Profile%20updated");
}

export async function updatePassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/profile?error=Supabase%20belum%20dikonfigurasi");
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 6) {
    redirect("/profile?error=Password%20minimal%206%20characters");
  }

  if (password !== confirmPassword) {
    redirect("/profile?error=Password%20confirmation%20does%20not%20match");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/profile?error=${encoded(error.message)}`);
  }

  redirect("/profile?message=Password%20updated");
}
