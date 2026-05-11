import { Camera, LockKeyhole, Send } from "lucide-react";
import { createReport } from "@/app/reports/actions";
import { EvidencePicker } from "@/components/evidence-picker";
import { Topbar } from "@/components/topbar";
import { getCurrentUser } from "@/lib/auth";

type SubmitPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  return (
    <main className="page-shell">
      <Topbar />

      {params.error ? <p className="auth-note auth-note-error">{params.error}</p> : null}

      <form action={createReport} className="submit-composer">
        <section className="submit-main-card">
          <div className="report-meta">
            <span>New signal</span>
            <span>|</span>
            <Camera size={14} />
            <span>Evidence ready</span>
          </div>
          <h1>Submit signal</h1>
          <p>
            Masukkan bug, audit finding, atau feature request yang perlu dilihat
            product dan developer.
          </p>

          {user ? (
            <p className="auth-note">
              Kamu login sebagai {user.email}. Report akan langsung masuk board publik.
            </p>
          ) : (
            <p className="auth-note">
              Login dulu untuk submit signal. Viewer publik tetap bisa membaca board tanpa akun.
            </p>
          )}

          <div className="form-columns">
            <div className="field">
              <label htmlFor="type">Type</label>
              <select id="type" name="type">
                <option value="bug">Bug</option>
                <option value="audit">Audit finding</option>
                <option value="feature">Feature request</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority">
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" placeholder="Contoh: CTA onboarding tertutup di mobile" />
          </div>

          <div className="field">
            <label htmlFor="area">Product area</label>
            <input id="area" name="area" placeholder="Onboarding, Dashboard, Export, Pricing" />
          </div>

          <div className="field">
            <label htmlFor="description">Issue or opportunity</label>
            <textarea
              id="description"
              name="description"
              placeholder="Jelaskan konteks, dampak, dan apa yang kamu harapkan terjadi."
            />
          </div>

          <div className="nav-actions" style={{ justifyContent: "flex-start" }}>
            {user ? (
              <button className="button button-primary" type="submit">
                <Send size={16} />
                Submit report
              </button>
            ) : (
              <a className="button button-primary" href="/login?next=/submit">
                <LockKeyhole size={16} />
                Login to submit
              </a>
            )}
            <span className="filter-pill">
              <Camera size={14} />
              Multi media
            </span>
          </div>
        </section>
        <EvidencePicker />
      </form>
    </main>
  );
}
