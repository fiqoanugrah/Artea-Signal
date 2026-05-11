import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MessageSquare, UserRound } from "lucide-react";
import { moveReportToTrash } from "@/app/reports/actions";
import { ConfirmTrashButton } from "@/components/confirm-trash-button";
import { getReportCode, priorityLabels, Report } from "@/lib/reports";
import { StatusPill } from "@/components/status-pill";

type ReportCardProps = {
  canManage?: boolean;
  report: Report;
};

export function ReportCard({ canManage = false, report }: ReportCardProps) {
  const coverMedia = report.evidence.find((item) => item.url === report.evidenceUrl) || report.evidence[0];

  return (
    <article className="report-card">
      <Link className="report-thumb" href={`/reports/${report.id}`}>
        {coverMedia?.mediaType === "video" ? (
          <video muted playsInline preload="metadata" src={coverMedia.url} />
        ) : (
          <Image alt={`Evidence preview for ${report.title}`} height={220} src={report.evidenceUrl} width={220} />
        )}
      </Link>
      <div className="report-content">
        <div className="report-meta">
          <span>{getReportCode(report.id)}</span>
          <span>|</span>
          <CalendarDays size={14} />
          <span>{report.createdAt}</span>
        </div>
        <Link href={`/reports/${report.id}`}>
          <h3>{report.title}</h3>
        </Link>
        <p>{report.summary}</p>
        <div className="badge-row">
          <StatusPill type={report.type} />
          <StatusPill status={report.status} />
          <span className={`pill pill-priority-${report.priority}`}>
            {priorityLabels[report.priority]}
          </span>
        </div>
        <div className="report-footer">
          <UserRound size={14} />
          <span>{report.owner}</span>
          <MessageSquare size={14} />
          <span>{report.comments.length}</span>
        </div>
        {canManage ? (
          <form action={moveReportToTrash} className="report-action-row">
            <input name="report_id" type="hidden" value={report.id} />
            <input name="delete_reason" type="hidden" value="Removed from board by admin" />
            <ConfirmTrashButton />
          </form>
        ) : null}
      </div>
    </article>
  );
}
