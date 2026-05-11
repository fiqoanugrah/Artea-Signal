import { LogIn } from "lucide-react";
import { login } from "@/app/auth/actions";
import { Topbar } from "@/components/topbar";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next ?? "/submit";

  return (
    <main className="page-shell">
      <Topbar />

      <section className="auth-layout">
        <div className="auth-copy">
          <h1>Login</h1>
          <p>
            Masuk untuk submit report, komentar, approve, reject, assign owner,
            dan update status. Board tetap bisa dibaca publik tanpa akun.
          </p>
        </div>

        <form action={login} className="form-panel auth-card">
          {!isSupabaseConfigured() ? (
            <p className="auth-note auth-note-warning">
              Supabase belum dikonfigurasi. Isi `.env.local` dari `.env.example`
              dulu supaya login bisa dipakai.
            </p>
          ) : null}

          {params.error ? <p className="auth-note auth-note-error">{params.error}</p> : null}
          {params.message ? <p className="auth-note">{params.message}</p> : null}

          <input name="next" type="hidden" value={next} />

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="you@artea.ai" required type="email" />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" minLength={6} name="password" required type="password" />
          </div>

          <button className="button button-primary" type="submit">
            <LogIn size={16} />
            Login
          </button>

          <p className="auth-switch">
            Belum punya akun? Minta admin Artea Signal untuk invite kamu.
          </p>
        </form>
      </section>
    </main>
  );
}
