import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, LockKeyhole, MessageSquare, Send, Trash2 } from "lucide-react";
import { addComment, moveReportToTrash, updateReportPriority, updateReportStatus } from "@/app/reports/actions";
import { ConfirmTrashButton } from "@/components/confirm-trash-button";
import { EvidenceGalleryCarousel } from "@/components/evidence-gallery-carousel";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { StatusPill } from "@/components/status-pill";
import { Topbar } from "@/components/topbar";
import { canCurrentUserTriage, getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { getReportById } from "@/lib/report-store";
import { getReportCode, priorityLabels } from "@/lib/reports";

type ReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  const [report, user, canTriage, canTrash] = await Promise.all([
    getReportById(id),
    getCurrentUser(),
    canCurrentUserTriage(),
    isCurrentUserAdmin()
  ]);

  if (!report) {
    notFound();
  }

  return (
    <main className="page-shell">
      <Topbar />

      <Link className="button button-secondary" href="/">
        <ArrowLeft size={16} />
        Back to board
      </Link>

      <section className="detail-grid" style={{ marginTop: 18 }}>
        <article className="detail-main">
          <div className="report-meta">
            <span>{getReportCode(report.id)}</span>
            <span>|</span>
            <span>{report.createdAt}</span>
          </div>
          <h1>{report.title}</h1>
          <div className="badge-row">
            <StatusPill type={report.type} />
            <StatusPill status={report.status} />
            <span className={`pill pill-priority-${report.priority}`}>{priorityLabels[report.priority]}</span>
          </div>

          <EvidenceGalleryCarousel evidence={report.evidence} />

          <h2>Context</h2>
          <p>{report.description}</p>

          <h2>Impact</h2>
          <p>{report.impact}</p>

          {report.steps ? (
            <>
              <h2>Reproduction steps</h2>
              <ol>
                {report.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          ) : null}
        </article>

        <aside className="detail-side">
          <h2 style={{ marginTop: 0 }}>Triage</h2>
          <div className="info-list">
            <div className="info-item">
              <div className="info-label">Area</div>
              <div className="info-value">{report.area}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Priority</div>
              <div className="info-value">{priorityLabels[report.priority]}</div>
            </div>
          </div>

          <h2>Actions</h2>
          {user ? (
            <p className="auth-note">
              Kamu login sebagai {user.email}. Reviewer dan admin bisa mengubah status
              serta priority signal.
            </p>
          ) : (
            <p className="auth-note">
              Login diperlukan untuk approve, reject, ubah status, assign owner,
              tambah input, atau menulis komentar.
            </p>
          )}
          <div className="nav-actions" id="login">
            {user ? null : (
              <a className="button button-primary" href={`/login?next=/reports/${report.id}`}>
                <LockKeyhole size={16} />
                Log in to act
              </a>
            )}
            {canTriage ? (
              <>
                <form action={updateReportStatus} className="inline-form">
                  <input name="report_id" type="hidden" value={report.id} />
                  <div className="field compact-field">
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" defaultValue={report.status}>
                      <option value="new">New</option>
                      <option value="need-info">Need info</option>
                      <option value="accepted">Accepted</option>
                      <option value="in-progress">In progress</option>
                      <option value="shipped">Shipped</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <PendingSubmitButton className="button button-secondary" pendingText="Updating status...">
                    <CheckCircle2 size={16} />
                    Update status
                  </PendingSubmitButton>
                </form>
                <form action={updateReportPriority} className="inline-form">
                  <input name="report_id" type="hidden" value={report.id} />
                  <div className="field compact-field">
                    <label htmlFor="priority">Priority</label>
                    <select id="priority" name="priority" defaultValue={report.priority}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <PendingSubmitButton className="button button-secondary" pendingText="Updating priority...">
                    <CheckCircle2 size={16} />
                    Update priority
                  </PendingSubmitButton>
                </form>
              </>
            ) : null}
          </div>
          {canTrash ? (
            <details className="trash-disclosure">
              <summary>
                <Trash2 size={16} />
                Trash report
              </summary>
              <form action={moveReportToTrash} className="form-grid trash-disclosure-panel">
                <input name="report_id" type="hidden" value={report.id} />
                <div className="field">
                  <label htmlFor="delete_reason">Trash reason</label>
                  <input
                    id="delete_reason"
                    name="delete_reason"
                    placeholder="Contoh: duplicate / invalid / sudah tidak relevan"
                  />
                </div>
                <ConfirmTrashButton actionText="Move to trash" variant="text" />
              </form>
            </details>
          ) : null}

          <h2>
            <MessageSquare size={16} /> Comments
          </h2>
          {report.comments.length ? (
            report.comments.map((comment) => (
              <div className="comment" key={comment.id}>
                <div className="comment-avatar">
                  {comment.avatarUrl ? (
                    <Image alt="" height={42} src={comment.avatarUrl} width={42} />
                  ) : (
                    <span>{getInitials(comment.author) || "U"}</span>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-heading">
                    <strong>{comment.author}</strong>
                    <span>{comment.role}</span>
                  </div>
                  <p>{comment.body}</p>
                  <div className="report-meta">{comment.createdAt}</div>
                </div>
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
          {user ? (
            <form action={addComment} className="form-grid" style={{ marginTop: 0 }}>
              <input name="report_id" type="hidden" value={report.id} />
              <div className="field">
                <label htmlFor="body">Add comment</label>
                <textarea id="body" name="body" placeholder="Tambah input, konteks, atau follow-up." />
              </div>
              <PendingSubmitButton className="button button-secondary" pendingText="Adding comment...">
                <Send size={16} />
                Add comment
              </PendingSubmitButton>
            </form>
          ) : (
            <button className="button button-secondary" type="button" disabled>
              <Send size={16} />
              Add comment after login
            </button>
          )}
        </aside>
      </section>
    </main>
  );
}
