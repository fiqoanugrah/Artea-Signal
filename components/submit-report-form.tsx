"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, LockKeyhole, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { EvidencePicker } from "@/components/evidence-picker";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ReportPriority, ReportType } from "@/lib/reports";

type SubmitReportFormProps = {
  userEmail?: string | null;
};

type UploadedEvidence = {
  media_type: "image" | "video";
  storage_path: string;
  url: string;
};

const maxEvidenceFileSize = 10 * 1024 * 1024;

function makeSummary(description: string) {
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean || "No summary provided.";
}

function mediaTypeFromMime(mime: string): "image" | "video" {
  return mime.startsWith("video/") ? "video" : "image";
}

export function SubmitReportForm({ userEmail }: SubmitReportFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoggedIn = Boolean(userEmail);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isLoggedIn || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const title = String(formData.get("title") || "").trim();
      const area = String(formData.get("area") || "").trim();
      const description = String(formData.get("description") || "").trim();
      const type = String(formData.get("type") || "bug") as ReportType;
      const priority = String(formData.get("priority") || "medium") as ReportPriority;

      if (!title || !area || !description) {
        throw new Error("Title, product area, dan description wajib diisi.");
      }

      const oversizedFile = files.find((file) => file.size > maxEvidenceFileSize);

      if (oversizedFile) {
        throw new Error(`${oversizedFile.name} terlalu besar. Maksimum 10MB per file.`);
      }

      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Session login tidak terbaca. Login ulang dulu ya.");
      }

      const uploadedEvidence: UploadedEvidence[] = [];

      for (const file of files) {
        const extension = file.name.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "png");
        const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("report-evidence").upload(path, file, {
          contentType: file.type || "application/octet-stream"
        });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data } = supabase.storage.from("report-evidence").getPublicUrl(path);
        uploadedEvidence.push({
          media_type: mediaTypeFromMime(file.type),
          storage_path: path,
          url: data.publicUrl
        });
      }

      const coverUrl =
        uploadedEvidence.find((item) => item.media_type === "image")?.url || uploadedEvidence[0]?.url || null;

      const { data: report, error: reportError } = await supabase
        .from("reports")
        .insert({
          title,
          area,
          description,
          summary: makeSummary(description),
          type,
          priority,
          status: "new",
          reporter_id: user.id,
          evidence_url: coverUrl,
          is_public: true
        })
        .select("id")
        .single();

      if (reportError) {
        throw new Error(reportError.message);
      }

      if (uploadedEvidence.length) {
        const { error: evidenceError } = await supabase.from("report_evidence").insert(
          uploadedEvidence.map((item) => ({
            report_id: report.id,
            ...item
          }))
        );

        if (evidenceError) {
          throw new Error(evidenceError.message);
        }
      }

      router.push(`/reports/${report.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Submit report gagal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="submit-composer" onSubmit={handleSubmit}>
      <section className="submit-main-card">
        <div className="report-meta">
          <span>New signal</span>
          <span>|</span>
          <Camera size={14} />
          <span>Evidence ready</span>
        </div>
        <h1>Submit signal</h1>
        <p>
          Masukkan bug, audit finding, atau feature request yang perlu dilihat product
          dan developer.
        </p>

        {error ? <p className="auth-note auth-note-error">{error}</p> : null}

        {isLoggedIn ? (
          <p className="auth-note">
            Kamu login sebagai {userEmail}. Report akan langsung masuk board publik.
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
          {isLoggedIn ? (
            <button className="button button-primary" disabled={isSubmitting} type="submit">
              <Send size={16} />
              {isSubmitting ? "Submitting..." : "Submit report"}
            </button>
          ) : (
            <Link className="button button-primary" href="/login?next=/submit">
              <LockKeyhole size={16} />
              Log in to submit
            </Link>
          )}
          <span className="filter-pill">
            <Camera size={14} />
            Direct media upload
          </span>
        </div>
      </section>
      <EvidencePicker files={files} inputName="" onFilesChange={setFiles} />
    </form>
  );
}
