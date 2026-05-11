import { ReportStatus, ReportType, statusLabels, typeLabels } from "@/lib/reports";

type StatusPillProps = {
  status?: ReportStatus;
  type?: ReportType;
};

export function StatusPill({ status, type }: StatusPillProps) {
  if (status) {
    return <span className={`pill pill-${status}`}>{statusLabels[status]}</span>;
  }

  if (type) {
    return <span className={`pill pill-${type}`}>{typeLabels[type]}</span>;
  }

  return null;
}
