import { SubmitReportForm } from "@/components/submit-report-form";
import { Topbar } from "@/components/topbar";
import { getCurrentUser } from "@/lib/auth";

type SubmitPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  return (
    <main className="page-shell">
      <Topbar />

      {params.error ? <p className="auth-note auth-note-error">{params.error}</p> : null}

      <SubmitReportForm userEmail={user?.email ?? null} />
    </main>
  );
}
