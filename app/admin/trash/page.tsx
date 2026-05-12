import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { permanentlyDeleteReport, restoreReport } from "@/app/reports/actions";
import { ConfirmTrashButton } from "@/components/confirm-trash-button";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Topbar } from "@/components/topbar";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { getDeletedReports } from "@/lib/report-store";
import { getReportCode, priorityLabels } from "@/lib/reports";

type TrashReport = Awaited<ReturnType<typeof getDeletedReports>>[number];

function TrashCard({ report }: { report: TrashReport }) {
  return (
    <article className="report-card trash-card">
      <div>
        <div className="report-meta">
          <span>{getReportCode(report.id)}</span>
          <span>|</span>
          <span>Deleted {report.deletedAt}</span>
        </div>
        <h3>{report.title}</h3>
        <p>{report.summary}</p>
        {report.deleteReason ? <p className="trash-reason">{report.deleteReason}</p> : null}
        <div className="badge-row">
          <StatusPill type={report.type} />
          <StatusPill status={report.status} />
          <span className={`pill pill-priority-${report.priority}`}>
            {priorityLabels[report.priority]}
          </span>
        </div>
        <div className="trash-actions">
          <form action={restoreReport}>
            <input name="report_id" type="hidden" value={report.id} />
            <PendingSubmitButton pendingText="Restoring...">
              <RotateCcw size={16} />
              Restore
            </PendingSubmitButton>
          </form>
          <form action={permanentlyDeleteReport}>
            <input name="report_id" type="hidden" value={report.id} />
            <ConfirmTrashButton
              actionText="Delete forever"
              label="Delete forever"
              message="Are you sure mau delete permanen? Ini tidak bisa undo."
              variant="text"
            />
          </form>
        </div>
      </div>
    </article>
  );
}

export default async function TrashPage() {
  const [user, isAdmin] = await Promise.all([getCurrentUser(), isCurrentUserAdmin()]);
  const reports = isAdmin ? await getDeletedReports() : [];

  return (
    <main className="page-shell">
      <Topbar />

      <Link className="button button-secondary" href="/">
        <ArrowLeft size={16} />
        Back to board
      </Link>

      <section className="section-heading">
        <div>
          <h2>Report trash</h2>
          <p>Admin-only soft-deleted reports. Restore kalau salah hapus dari board.</p>
        </div>
      </section>

      {!user ? (
        <div className="empty-state">
          <h3>Login required</h3>
          <p>Trash hanya bisa dibuka oleh admin.</p>
          <Link className="button button-primary" href="/login?next=/admin/trash">
            Login
          </Link>
        </div>
      ) : null}

      {user && !isAdmin ? (
        <div className="empty-state">
          <h3>Admin only</h3>
          <p>Akun kamu belum punya role admin.</p>
        </div>
      ) : null}

      {isAdmin ? (
        <section className="reports-grid">
          {reports.length ? (
            reports.map((report) => <TrashCard key={report.id} report={report} />)
          ) : (
            <div className="empty-state">
              <h3>Trash kosong</h3>
              <p>Report yang dihapus dari board akan muncul di sini.</p>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
