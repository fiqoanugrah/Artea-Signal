import Link from "next/link";
import { LockKeyhole, Send, Shield, UserPlus } from "lucide-react";
import { inviteUser } from "@/app/auth/actions";
import { Topbar } from "@/components/topbar";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

type AdminUsersPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  const isAdmin = profile?.role === "admin";

  return (
    <main className="page-shell">
      <Topbar />

      <section className="auth-stage auth-stage-compact">
        <div className="auth-copy">
          <span className="eyebrow">
            <Shield size={14} />
            Admin console
          </span>
          <h1>User access</h1>
          <p>
            Public signup dimatikan. User baru dibuat lewat invite dari admin,
            supaya akses submit, komentar, dan approval tetap terkontrol.
          </p>
        </div>

        <div className="form-panel auth-card">
          <div className="auth-card-head">
            <span className="auth-card-icon">
              <UserPlus size={18} />
            </span>
            <div>
              <h2>Invite teammate</h2>
              <p>Choose access level before sending the invite.</p>
            </div>
          </div>

          {!isSupabaseConfigured() ? (
            <p className="auth-note auth-note-warning">
              Supabase belum dikonfigurasi. Isi `.env.local` dulu.
            </p>
          ) : null}

          {!isSupabaseAdminConfigured() ? (
            <p className="auth-note auth-note-warning">
              `SUPABASE_SERVICE_ROLE_KEY` belum diisi. Invite user perlu service
              role key server-side.
            </p>
          ) : null}

          {params.error ? <p className="auth-note auth-note-error">{params.error}</p> : null}
          {params.message ? <p className="auth-note">{params.message}</p> : null}

          {!user ? (
            <>
              <p className="auth-note">Login sebagai admin untuk invite user.</p>
              <Link className="button button-primary" href="/login?next=/admin/users">
                <LockKeyhole size={16} />
                Login
              </Link>
            </>
          ) : null}

          {user && !isAdmin ? (
            <p className="auth-note auth-note-error">
              Akun kamu belum punya role admin. Minta admin existing untuk mengubah
              role kamu di Supabase.
            </p>
          ) : null}

          {isAdmin ? (
            <form action={inviteUser} className="form-grid" style={{ marginTop: 0 }}>
              <span className="filter-pill">
                <Shield size={14} />
                Admin only
              </span>

              <div className="field">
                <label htmlFor="email">User email</label>
                <input id="email" name="email" placeholder="teammate@artea.ai" required type="email" />
              </div>

              <div className="field">
                <label htmlFor="full_name">Name</label>
                <input id="full_name" name="full_name" placeholder="Nama user" />
              </div>

              <div className="field">
                <label htmlFor="role">Role</label>
                <select id="role" name="role">
                  <option value="member">Member</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button className="button button-primary" type="submit">
                <Send size={16} />
                Send invite
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
