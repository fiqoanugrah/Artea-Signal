import Image from "next/image";
import Link from "next/link";
import { KeyRound, LockKeyhole, Save, Shield, Sparkles, UserCircle } from "lucide-react";
import { updatePassword, updateProfile } from "@/app/auth/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Topbar } from "@/components/topbar";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;

  return (
    <main className="page-shell">
      <Topbar />

      <section className="auth-stage">
        <div className="auth-copy">
          <span className="eyebrow">
            <UserCircle size={14} />
            Account settings
          </span>
          <h1>Profile</h1>
          <p>
            Tempat user melihat identitas akun, role, dan akses mereka di Artea
            Signal.
          </p>
        </div>

        <div className="form-panel auth-card">
          {params.error ? <p className="auth-note auth-note-error">{params.error}</p> : null}
          {params.message ? <p className="auth-note">{params.message}</p> : null}

          {!isSupabaseConfigured() ? (
            <p className="auth-note auth-note-warning">
              Supabase belum dikonfigurasi, jadi profile belum bisa dibaca dari
              database.
            </p>
          ) : null}

          {!user ? (
            <>
              <p className="auth-note">Login dulu untuk melihat profile.</p>
              <Link className="button button-primary" href="/login?next=/profile">
                <LockKeyhole size={16} />
                Login
              </Link>
            </>
          ) : (
            <>
              <div className="profile-hero">
                <div className="profile-avatar">
                  {profile?.avatar_url ? (
                    <Image alt="" height={72} src={profile.avatar_url} width={72} />
                  ) : (
                    <UserCircle size={36} />
                  )}
                </div>
                <div>
                  <span className="filter-pill">
                    <Sparkles size={14} />
                    {profile?.role || "member"}
                  </span>
                  <h2>{profile?.full_name || profile?.username || user.email}</h2>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="info-list">
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{user.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Username</div>
                  <div className="info-value">{profile?.username || "Not set"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Role</div>
                  <div className="info-value">{profile?.role || "member"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Account ID</div>
                  <div className="info-value compact-value">{user.id}</div>
                </div>
              </div>

              <form action={updateProfile} className="form-grid" encType="multipart/form-data">
                <div className="form-columns">
                  <div className="field">
                    <label htmlFor="username">Username</label>
                    <input id="username" name="username" defaultValue={profile?.username || ""} placeholder="fiqo" />
                  </div>
                  <div className="field">
                    <label htmlFor="full_name">Display name</label>
                    <input id="full_name" name="full_name" defaultValue={profile?.full_name || ""} placeholder="Fico" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="avatar">Profile picture</label>
                  <input id="avatar" name="avatar" accept="image/*" type="file" />
                </div>
                <PendingSubmitButton pendingText="Saving profile...">
                  <Save size={16} />
                  Save profile
                </PendingSubmitButton>
              </form>

              <form action={updatePassword} className="form-grid">
                <div className="form-columns">
                  <div className="field">
                    <label htmlFor="password">New password</label>
                    <input id="password" minLength={6} name="password" type="password" />
                  </div>
                  <div className="field">
                    <label htmlFor="confirm_password">Confirm password</label>
                    <input id="confirm_password" minLength={6} name="confirm_password" type="password" />
                  </div>
                </div>
                <PendingSubmitButton className="button button-secondary" pendingText="Changing password...">
                  <KeyRound size={16} />
                  Change password
                </PendingSubmitButton>
              </form>

              {profile?.role === "admin" ? (
                <Link className="button button-secondary" href="/admin/users">
                  <Shield size={16} />
                  Manage users
                </Link>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
