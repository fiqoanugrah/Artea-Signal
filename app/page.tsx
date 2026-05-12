import Image from "next/image";
import Link from "next/link";
import { Eye, LockKeyhole, Sparkles } from "lucide-react";
import { ReportBoard } from "@/components/report-board";
import { Topbar } from "@/components/topbar";
import { isCurrentUserAdmin } from "@/lib/auth";
import { getActiveReports, getMetricsFromReports } from "@/lib/report-store";
import { getDisplayReportCode, priorityLabels, Report, statusLabels, typeLabels } from "@/lib/reports";

const priorityScore: Record<Report["priority"], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

const statusScore: Record<Report["status"], number> = {
  "in-progress": 6,
  accepted: 5,
  new: 4,
  "need-info": 3,
  shipped: 2,
  rejected: 1
};

function getLiveQueue(reports: Report[]) {
  return [...reports].sort((a, b) => {
    const aScore = priorityScore[a.priority] * 10 + statusScore[a.status];
    const bScore = priorityScore[b.priority] * 10 + statusScore[b.status];
    return bScore - aScore;
  });
}

export default async function Home() {
  const [reports, canManage] = await Promise.all([getActiveReports(), isCurrentUserAdmin()]);
  const metrics = getMetricsFromReports(reports);
  const liveQueue = getLiveQueue(reports);
  const featuredSignal = liveQueue[0];
  const featuredMedia =
    featuredSignal?.evidence.find((item) => item.url === featuredSignal.evidenceUrl) || featuredSignal?.evidence[0];
  const nextSignals = liveQueue.slice(1, 6);

  return (
    <main className="page-shell">
      <Topbar />

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} />
            Artea AI product command center
          </span>
          <h1>Signal board untuk product decisions.</h1>
          <p>
            Public board untuk membaca bug, audit finding, dan feature request
            yang masuk ke Artea AI. Semua orang bisa memantau progress, sementara
            submit, komentar, approval, dan status update tetap gated by login.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/submit">
              <Sparkles size={16} />
              Submit signal
            </Link>
            <span className="filter-pill">
              <Eye size={14} />
              Public read-only
            </span>
            <span className="filter-pill">
              <LockKeyhole size={14} />
              Login for actions
            </span>
          </div>
        </div>
        <div className="hero-visual signal-console" aria-label="Artea Signal board preview">
          <div className="console-header">
            <span>Live signal queue</span>
            <span className="pulse-dot" />
          </div>
          {featuredSignal ? (
            <>
              <Link className="console-feature" href={`/reports/${featuredSignal.id}`}>
                {featuredMedia?.mediaType === "video" ? (
                  <video muted playsInline preload="metadata" src={featuredMedia.url} />
                ) : (
                  <Image alt="" height={240} priority src={featuredSignal.evidenceUrl} width={420} />
                )}
                <div>
                  <span className={`pill pill-${featuredSignal.type}`}>
                    {typeLabels[featuredSignal.type]}
                  </span>
                  <h2>{featuredSignal.title}</h2>
                  <p>
                    {priorityLabels[featuredSignal.priority]} priority signal in {featuredSignal.area}.
                  </p>
                </div>
              </Link>
              <div className="console-list">
                {nextSignals.length ? (
                  nextSignals.map((report) => (
                    <Link href={`/reports/${report.id}`} key={report.id}>
                      <span>
                        {getDisplayReportCode(report)} {report.title}
                      </span>
                      <strong>{statusLabels[report.status]}</strong>
                    </Link>
                  ))
                ) : (
                  <span>No other active signals</span>
                )}
              </div>
            </>
          ) : (
            <div className="empty-preview">
              <Sparkles size={26} />
              <p>No active signals yet. Submit report pertama untuk mengisi live queue.</p>
            </div>
          )}
        </div>
      </section>

      <section className="metrics-grid" aria-label="Report metrics">
        <div className="metric">
          <div className="metric-value">{metrics.total}</div>
          <div className="metric-label">Total signals</div>
        </div>
        <div className="metric">
          <div className="metric-value">{metrics.bugs}</div>
          <div className="metric-label">Bug reports</div>
        </div>
        <div className="metric">
          <div className="metric-value">{metrics.accepted}</div>
          <div className="metric-label">Accepted or shipped</div>
        </div>
        <div className="metric">
          <div className="metric-value">{metrics.waiting}</div>
          <div className="metric-label">Need more input</div>
        </div>
      </section>

      <ReportBoard canManage={canManage} reports={reports} />
    </main>
  );
}
