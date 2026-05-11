"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canCurrentUserTriage, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReportPriority, ReportStatus, ReportType } from "@/lib/reports";

const reportTypes: ReportType[] = ["bug", "audit", "feature"];
const priorities: ReportPriority[] = ["low", "medium", "high", "urgent"];
const statuses: ReportStatus[] = ["new", "need-info", "accepted", "in-progress", "shipped", "rejected"];

function coerceType(value: FormDataEntryValue | null): ReportType {
  const type = String(value || "bug") as ReportType;
  return reportTypes.includes(type) ? type : "bug";
}

function coercePriority(value: FormDataEntryValue | null): ReportPriority {
  const priority = String(value || "medium") as ReportPriority;
  return priorities.includes(priority) ? priority : "medium";
}

function makeSummary(description: string) {
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean || "No summary provided.";
}

function mediaTypeFromMime(mime: string): "image" | "video" {
  return mime.startsWith("video/") ? "video" : "image";
}

export async function createReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/submit&error=Login%20required");
  }

  const title = String(formData.get("title") || "").trim();
  const area = String(formData.get("area") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const type = coerceType(formData.get("type"));
  const priority = coercePriority(formData.get("priority"));

  if (!title || !area || !description) {
    redirect("/submit?error=Title%2C%20area%2C%20dan%20description%20wajib%20diisi");
  }

  const files = formData
    .getAll("evidence")
    .filter((item): item is File => item instanceof File && item.size > 0);
  const uploadedEvidence: Array<{
    media_type: "image" | "video";
    storage_path: string;
    url: string;
  }> = [];

  for (const file of files) {
    const extension = file.name.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "png");
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("report-evidence").upload(path, file, {
      contentType: file.type || "application/octet-stream"
    });

    if (uploadError) {
      redirect(`/submit?error=${encodeURIComponent(uploadError.message)}`);
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

  const { data, error } = await supabase
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

  if (error) {
    redirect(`/submit?error=${encodeURIComponent(error.message)}`);
  }

  if (uploadedEvidence.length) {
    const { error: evidenceError } = await supabase.from("report_evidence").insert(
      uploadedEvidence.map((item) => ({
        report_id: data.id,
        ...item
      }))
    );

    if (evidenceError) {
      redirect(`/reports/${data.id}?error=${encodeURIComponent(evidenceError.message)}`);
    }
  }

  revalidatePath("/");
  redirect(`/reports/${data.id}`);
}

export async function addComment(formData: FormData) {
  const reportId = String(formData.get("report_id") || "");
  const body = String(formData.get("body") || "").trim();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/reports/${reportId}&error=Login%20required`);
  }

  if (!body) {
    redirect(`/reports/${reportId}?error=Comment%20cannot%20be%20empty`);
  }

  const { error } = await supabase.from("report_comments").insert({
    report_id: reportId,
    author_id: user.id,
    body
  });

  if (error) {
    redirect(`/reports/${reportId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/reports/${reportId}`);
  redirect(`/reports/${reportId}`);
}

export async function updateReportStatus(formData: FormData) {
  const canTriage = await canCurrentUserTriage();

  if (!canTriage) {
    redirect("/login?error=Reviewer%20or%20admin%20access%20required");
  }

  const reportId = String(formData.get("report_id") || "");
  const status = String(formData.get("status") || "new") as ReportStatus;
  const safeStatus = statuses.includes(status) ? status : "new";
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      status: safeStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", reportId);

  if (error) {
    redirect(`/reports/${reportId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath(`/reports/${reportId}`);
  redirect(`/reports/${reportId}`);
}

export async function updateReportPriority(formData: FormData) {
  const canTriage = await canCurrentUserTriage();

  if (!canTriage) {
    redirect("/login?error=Reviewer%20or%20admin%20access%20required");
  }

  const reportId = String(formData.get("report_id") || "");
  const priority = coercePriority(formData.get("priority"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      priority,
      updated_at: new Date().toISOString()
    })
    .eq("id", reportId);

  if (error) {
    redirect(`/reports/${reportId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath(`/reports/${reportId}`);
  redirect(`/reports/${reportId}`);
}

export async function moveReportToTrash(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/login?error=Admin%20access%20required");
  }

  const reportId = String(formData.get("report_id") || "");
  const reason = String(formData.get("delete_reason") || "").trim();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reports")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id,
      delete_reason: reason || null
    })
    .eq("id", reportId);

  if (error) {
    redirect(`/reports/${reportId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/trash");
  redirect("/admin/trash");
}

export async function restoreReport(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/login?error=Admin%20access%20required");
  }

  const reportId = String(formData.get("report_id") || "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      deleted_at: null,
      deleted_by: null,
      delete_reason: null
    })
    .eq("id", reportId);

  if (error) {
    redirect(`/admin/trash?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/trash");
  redirect(`/reports/${reportId}`);
}

export async function permanentlyDeleteReport(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/login?error=Admin%20access%20required");
  }

  const reportId = String(formData.get("report_id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("reports").delete().eq("id", reportId);

  if (error) {
    redirect(`/admin/trash?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/trash");
  redirect("/admin/trash");
}
