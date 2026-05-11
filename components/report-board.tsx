"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bug, Filter, Lightbulb, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { Report } from "@/lib/reports";

type ReportBoardProps = {
  canManage: boolean;
  reports: Report[];
};

function matches(report: Report, q: string, type: string, status: string) {
  const query = q.trim().toLowerCase();
  const matchesQuery = query
    ? [report.title, report.summary, report.area, report.description].some((value) =>
        value.toLowerCase().includes(query)
      )
    : true;

  return matchesQuery && (type ? report.type === type : true) && (status ? report.status === status : true);
}

export function ReportBoard({ canManage, reports }: ReportBoardProps) {
  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const filteredReports = useMemo(
    () =>
      reports.filter((report) => {
        const matchesView =
          view === "bug-audit"
            ? report.type === "bug" || report.type === "audit"
            : view === "feature"
              ? report.type === "feature"
              : true;

        return matchesView && matches(report, q, type, status);
      }),
    [q, reports, status, type, view]
  );
  const bugAuditCount = reports.filter((report) => report.type === "bug" || report.type === "audit").length;
  const featureCount = reports.filter((report) => report.type === "feature").length;

  return (
    <>
      <section className="section-heading">
        <div>
          <h2>Incoming reports</h2>
          <p>Instant filter untuk semua report yang masuk. Pilih queue tanpa layout pecah.</p>
        </div>
      </section>

      <div className="view-tabs" aria-label="Board views">
        <button
          className={view === "all" ? "view-tab active" : "view-tab"}
          onClick={() => setView("all")}
          type="button"
        >
          <Sparkles size={16} />
          All signals
          <span>{reports.length}</span>
        </button>
        <button
          className={view === "bug-audit" ? "view-tab active" : "view-tab"}
          onClick={() => setView("bug-audit")}
          type="button"
        >
          <Bug size={16} />
          Bug & audit
          <span>{bugAuditCount}</span>
        </button>
        <button
          className={view === "feature" ? "view-tab active" : "view-tab"}
          onClick={() => setView("feature")}
          type="button"
        >
          <Lightbulb size={16} />
          Feature ideas
          <span>{featureCount}</span>
        </button>
      </div>

      <div className="filter-row filter-form async-filter" aria-label="Report filters">
        <label className="filter-control">
          <Filter size={16} />
          <select aria-label="Filter by type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All types</option>
            <option value="bug">Bug</option>
            <option value="audit">Audit</option>
            <option value="feature">Feature</option>
          </select>
        </label>
        <label className="filter-control">
          <ShieldCheck size={16} />
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All status</option>
            <option value="new">New</option>
            <option value="need-info">Need info</option>
            <option value="accepted">Accepted</option>
            <option value="in-progress">In progress</option>
            <option value="shipped">Shipped</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="filter-control search-control">
          <Search size={16} />
          <input
            aria-label="Search reports"
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search title, area, summary"
            value={q}
          />
        </label>
        <button
          className="button button-secondary"
          onClick={() => {
            setQ("");
            setType("");
            setStatus("");
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      <section className="reports-grid">
        {filteredReports.length ? (
          filteredReports.map((report) => <ReportCard canManage={canManage} key={report.id} report={report} />)
        ) : (
          <div className="empty-state">
            <h3>No matching signals</h3>
            <p>Try clearing the filter or submit a new signal.</p>
            <Link className="button button-primary" href="/submit">
              <Sparkles size={16} />
              Submit signal
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
