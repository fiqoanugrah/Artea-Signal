export type ReportType = "bug" | "feature" | "audit";
export type ReportStatus =
  | "new"
  | "need-info"
  | "accepted"
  | "in-progress"
  | "shipped"
  | "rejected";
export type ReportPriority = "low" | "medium" | "high" | "urgent";

export type Comment = {
  id: string;
  author: string;
  avatarUrl?: string | null;
  role: string;
  body: string;
  createdAt: string;
};

export type ReportMedia = {
  id: string;
  mediaType: "image" | "video";
  url: string;
};

export type Report = {
  id: string;
  title: string;
  summary: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  priority: ReportPriority;
  area: string;
  reporter: string;
  owner: string;
  createdAt: string;
  impact: string;
  evidenceUrl: string;
  evidence: ReportMedia[];
  steps?: string[];
  comments: Comment[];
};

export const reports: Report[] = [
  {
    id: "AS-104",
    title: "CTA onboarding kurang kebaca di mobile",
    summary:
      "Button utama di onboarding tertutup area bawah pada iPhone ukuran kecil sehingga user sulit lanjut ke step berikutnya.",
    description:
      "Saat onboarding dibuka dari layar mobile yang lebih pendek, CTA utama terlalu dekat dengan bottom navigation browser. Marketing melihat drop-off meningkat di step pertama, jadi ini perlu diprioritaskan untuk investigasi UX.",
    type: "bug",
    status: "in-progress",
    priority: "urgent",
    area: "Onboarding",
    reporter: "Marketing",
    owner: "Frontend",
    createdAt: "2026-05-09",
    impact: "Potential conversion loss on first-run activation.",
    evidenceUrl: "/sample-onboarding.svg",
    evidence: [{ id: "e1", mediaType: "image", url: "/sample-onboarding.svg" }],
    steps: [
      "Open onboarding from mobile viewport under 700px height.",
      "Complete the first question.",
      "Observe the main CTA near the browser bottom area."
    ],
    comments: [
      {
        id: "c1",
        author: "Product Lead",
        role: "Reviewer",
        body: "Accepted. Please check safe-area spacing and sticky CTA behavior.",
        createdAt: "2026-05-10"
      },
      {
        id: "c2",
        author: "Frontend",
        role: "Developer",
        body: "Replicated locally. Fix is being tested across small mobile viewports.",
        createdAt: "2026-05-10"
      }
    ]
  },
  {
    id: "AS-103",
    title: "Tambahkan template campaign untuk tim growth",
    summary:
      "Tim growth butuh template prompt campaign supaya output Artea AI lebih konsisten untuk launch mingguan.",
    description:
      "Feature ini akan membantu non-technical marketer memulai dari struktur campaign yang sudah baku. Template bisa berisi goal, audience, channel, tone, dan CTA.",
    type: "feature",
    status: "accepted",
    priority: "high",
    area: "Prompt workflow",
    reporter: "Product",
    owner: "Product",
    createdAt: "2026-05-08",
    impact: "Faster campaign setup and less repeated prompt writing.",
    evidenceUrl: "/sample-template.svg",
    evidence: [{ id: "e2", mediaType: "image", url: "/sample-template.svg" }],
    comments: [
      {
        id: "c3",
        author: "Dev Lead",
        role: "Reviewer",
        body: "Accepted for planning. Need field structure and first 5 template examples.",
        createdAt: "2026-05-09"
      }
    ]
  },
  {
    id: "AS-102",
    title: "Audit empty state dashboard belum memberi next action",
    summary:
      "Dashboard kosong hanya menampilkan pesan singkat, belum mengarahkan user untuk membuat project pertama.",
    description:
      "Audit menemukan bahwa empty state terasa berhenti di informasi. Perlu ada next action yang jelas agar user baru tidak bingung setelah login.",
    type: "audit",
    status: "new",
    priority: "medium",
    area: "Dashboard",
    reporter: "UX Audit",
    owner: "Unassigned",
    createdAt: "2026-05-07",
    impact: "Better first-session clarity for new users.",
    evidenceUrl: "/sample-dashboard.svg",
    evidence: [{ id: "e3", mediaType: "image", url: "/sample-dashboard.svg" }],
    comments: []
  },
  {
    id: "AS-101",
    title: "Export result ke Google Docs",
    summary:
      "Beberapa user meminta hasil generated content bisa langsung diexport untuk proses review internal.",
    description:
      "Feedback dari user interview: workflow mereka biasanya lanjut ke Google Docs untuk approval. Integrasi export bisa mengurangi manual copy-paste.",
    type: "feature",
    status: "need-info",
    priority: "medium",
    area: "Export",
    reporter: "Customer Success",
    owner: "Product",
    createdAt: "2026-05-05",
    impact: "Reduce friction after content generation.",
    evidenceUrl: "/sample-export.svg",
    evidence: [{ id: "e4", mediaType: "image", url: "/sample-export.svg" }],
    comments: [
      {
        id: "c4",
        author: "Product Lead",
        role: "Reviewer",
        body: "Need more examples from customers before deciding API scope.",
        createdAt: "2026-05-06"
      }
    ]
  }
];

export const typeLabels: Record<ReportType, string> = {
  bug: "Bug",
  feature: "Feature",
  audit: "Audit"
};

export const statusLabels: Record<ReportStatus, string> = {
  new: "New",
  "need-info": "Need Info",
  accepted: "Accepted",
  "in-progress": "In Progress",
  shipped: "Shipped",
  rejected: "Rejected"
};

export const priorityLabels: Record<ReportPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent"
};

export function getReport(id: string) {
  return reports.find((report) => report.id === id);
}

export function getMetrics() {
  return {
    total: reports.length,
    bugs: reports.filter((report) => report.type === "bug").length,
    accepted: reports.filter((report) =>
      ["accepted", "in-progress", "shipped"].includes(report.status)
    ).length,
    waiting: reports.filter((report) => report.status === "need-info").length
  };
}

export function getReportCode(id: string) {
  return id.startsWith("AS-") ? id : `AS-${id.slice(0, 4).toUpperCase()}`;
}
