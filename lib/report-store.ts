import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  priorityLabels,
  Report,
  ReportMedia,
  ReportPriority,
  reports as mockReports,
  ReportStatus,
  ReportType
} from "@/lib/reports";

type ReportRow = {
  id: string;
  title: string;
  summary: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  priority: ReportPriority;
  area: string;
  reporter_id: string | null;
  owner_id: string | null;
  evidence_url: string | null;
  is_public: boolean;
  deleted_at: string | null;
  delete_reason: string | null;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  report_id?: string;
};

type EvidenceRow = {
  id: string;
  media_type: "image" | "video";
  url: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function makeSequentialCode(index: number) {
  return `AS-${String(index + 1).padStart(4, "0")}`;
}

type CommentAuthor = {
  avatar_url: string | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
  username: string | null;
};

function mapRowToReport(
  row: ReportRow,
  comments: CommentRow[] = [],
  evidence: EvidenceRow[] = [],
  authors: Record<string, CommentAuthor> = {},
  code?: string
): Report {
  const media: ReportMedia[] = evidence.length
    ? evidence.map((item) => ({
        id: item.id,
        mediaType: item.media_type,
        url: item.url
      }))
    : [
        {
          id: `${row.id}-cover`,
          mediaType: row.evidence_url?.match(/\.(mp4|webm|mov)(\?|$)/i) ? "video" : "image",
          url: row.evidence_url || "/board-preview.svg"
        }
      ];
  const cover = media.find((item) => item.mediaType === "image")?.url || row.evidence_url || "/board-preview.svg";

  return {
    id: row.id,
    code,
    title: row.title,
    summary: row.summary,
    description: row.description,
    type: row.type,
    status: row.status,
    priority: row.priority,
    area: row.area,
    reporter: row.reporter_id ? "Authenticated user" : "Unknown",
    owner: row.owner_id ? "Assigned" : "Unassigned",
    createdAt: formatDate(row.created_at),
    impact: `${priorityLabels[row.priority]} priority signal for ${row.area}.`,
    evidenceUrl: cover,
    evidence: media,
    comments: comments.map((comment) => ({
      id: comment.id,
      author:
        authors[comment.author_id]?.username ||
        authors[comment.author_id]?.full_name ||
        authors[comment.author_id]?.email ||
        "User",
      avatarUrl: authors[comment.author_id]?.avatar_url || null,
      role: authors[comment.author_id]?.role || "member",
      body: comment.body,
      createdAt: formatDate(comment.created_at)
    }))
  };
}

export type ReportFilters = {
  q?: string;
  status?: string;
  type?: string;
};

export const getActiveReports = cache(async (filters: ReportFilters = {}) => {
  if (!isSupabaseConfigured()) {
    return applyLocalFilters(mockReports, filters);
  }

  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select("*, report_evidence(id,media_type,url)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    const safeQuery = filters.q.replace(/[,%]/g, " ").trim();
    query = query.or(`title.ilike.%${safeQuery}%,summary.ilike.%${safeQuery}%,area.ilike.%${safeQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch reports", error.message);
    return mockReports;
  }

  const rows = (data || []) as (ReportRow & { report_evidence?: EvidenceRow[] })[];
  const reportIds = rows.map((row) => row.id);
  const { commentsByReport, authors } = await getCommentsForReports(reportIds);
  const codeByReportId = await getReportCodeMap(reportIds);

  return rows.map((row) =>
    mapRowToReport(row, commentsByReport[row.id] || [], row.report_evidence || [], authors, codeByReportId[row.id])
  );
});

async function getReportCodeMap(reportIds: string[]) {
  const codes: Record<string, string> = {};

  if (!reportIds.length) {
    return codes;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("reports").select("id").order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to map report codes", error.message);
    return codes;
  }

  for (const [index, row] of ((data || []) as Array<{ id: string }>).entries()) {
    if (reportIds.includes(row.id)) {
      codes[row.id] = makeSequentialCode(index);
    }
  }

  return codes;
}

async function getCommentsForReports(reportIds: string[]) {
  const commentsByReport: Record<string, CommentRow[]> = {};
  const authors: Record<string, CommentAuthor> = {};

  if (!reportIds.length) {
    return { commentsByReport, authors };
  }

  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("report_comments")
    .select("id,report_id,author_id,body,created_at")
    .in("report_id", reportIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch report comments", error.message);
    return { commentsByReport, authors };
  }

  const commentRows = (comments || []) as CommentRow[];

  for (const comment of commentRows) {
    if (!comment.report_id) {
      continue;
    }

    commentsByReport[comment.report_id] = commentsByReport[comment.report_id] || [];
    commentsByReport[comment.report_id].push(comment);
  }

  const authorIds = Array.from(new Set(commentRows.map((comment) => comment.author_id)));

  if (authorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name,username,avatar_url,role")
      .in("id", authorIds);

    for (const profile of (profiles || []) as Array<CommentAuthor & { id: string }>) {
      authors[profile.id] = profile;
    }
  }

  return { commentsByReport, authors };
}

function applyLocalFilters(reports: Report[], filters: ReportFilters) {
  return reports.filter((report) => {
    const matchesType = filters.type ? report.type === filters.type : true;
    const matchesStatus = filters.status ? report.status === filters.status : true;
    const q = filters.q?.toLowerCase().trim();
    const matchesQuery = q
      ? [report.title, report.summary, report.area].some((value) => value.toLowerCase().includes(q))
      : true;

    return matchesType && matchesStatus && matchesQuery;
  });
}

export const getDeletedReports = cache(async () => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*, report_evidence(id,media_type,url)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch deleted reports", error.message);
    return [];
  }

  const rows = (data || []) as (ReportRow & { report_evidence?: EvidenceRow[] })[];
  const codeByReportId = await getReportCodeMap(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...mapRowToReport(row, [], row.report_evidence || [], {}, codeByReportId[row.id]),
    deletedAt: row.deleted_at ? formatDate(row.deleted_at) : "",
    deleteReason: row.delete_reason || ""
  }));
});

export const getReportById = cache(async (id: string) => {
  const mockReport = mockReports.find((report) => report.id === id);

  if (!isSupabaseConfigured()) {
    return mockReport;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*, report_evidence(id,media_type,url)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch report", error.message);
    return mockReport;
  }

  if (!data) {
    return mockReport;
  }

  const { data: comments } = await supabase
    .from("report_comments")
    .select("id,author_id,body,created_at")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  const authorIds = Array.from(new Set(((comments as CommentRow[]) || []).map((comment) => comment.author_id)));
  const authors: Record<string, CommentAuthor> = {};

  if (authorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name,username,avatar_url,role")
      .in("id", authorIds);

    for (const profile of (profiles || []) as Array<CommentAuthor & { id: string }>) {
      authors[profile.id] = profile;
    }
  }

  const row = data as ReportRow & { report_evidence?: EvidenceRow[] };
  const codeByReportId = await getReportCodeMap([row.id]);
  return mapRowToReport(
    row,
    (comments as CommentRow[]) || [],
    row.report_evidence || [],
    authors,
    codeByReportId[row.id]
  );
});

export function getMetricsFromReports(reports: Report[]) {
  return {
    total: reports.length,
    bugs: reports.filter((report) => report.type === "bug").length,
    accepted: reports.filter((report) =>
      ["accepted", "in-progress", "shipped"].includes(report.status)
    ).length,
    waiting: reports.filter((report) => report.status === "need-info").length
  };
}

export { getDisplayReportCode, getReportCode } from "@/lib/reports";
