create table if not exists public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  url text not null,
  storage_path text,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  created_at timestamptz not null default now()
);

alter table public.report_evidence enable row level security;

create policy "Public can read evidence for active public reports"
  on public.report_evidence for select
  using (
    exists (
      select 1
      from public.reports
      where reports.id = report_evidence.report_id
      and reports.is_public = true
      and reports.deleted_at is null
    )
  );

create policy "Admins can read all evidence"
  on public.report_evidence for select
  to authenticated
  using (public.is_admin());

create policy "Authenticated users can create evidence"
  on public.report_evidence for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.reports
      where reports.id = report_evidence.report_id
      and reports.reporter_id = auth.uid()
    )
  );

create policy "Admins can delete evidence"
  on public.report_evidence for delete
  to authenticated
  using (public.is_admin());

create or replace function public.can_triage()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'reviewer')
  );
$$;

drop policy if exists "Admins can update reports" on public.reports;

create policy "Admins and reviewers can update reports"
  on public.reports for update
  to authenticated
  using (public.can_triage())
  with check (public.can_triage());

drop policy if exists "Authenticated users can read comments on public reports" on public.report_comments;

create policy "Public can read comments on active public reports"
  on public.report_comments for select
  using (
    exists (
      select 1
      from public.reports
      where reports.id = report_comments.report_id
      and reports.is_public = true
      and reports.deleted_at is null
    )
  );

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]
where id = 'report-evidence';

insert into public.reports (
  id,
  title,
  summary,
  description,
  type,
  status,
  priority,
  area,
  evidence_url,
  is_public,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111104',
    'CTA onboarding kurang kebaca di mobile',
    'Button utama di onboarding tertutup area bawah pada iPhone ukuran kecil sehingga user sulit lanjut ke step berikutnya.',
    'Saat onboarding dibuka dari layar mobile yang lebih pendek, CTA utama terlalu dekat dengan bottom navigation browser. Marketing melihat drop-off meningkat di step pertama, jadi ini perlu diprioritaskan untuk investigasi UX.',
    'bug',
    'in-progress',
    'urgent',
    'Onboarding',
    '/sample-onboarding.svg',
    true,
    '2026-05-09 08:00:00+00',
    '2026-05-10 08:00:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Tambahkan template campaign untuk tim growth',
    'Tim growth butuh template prompt campaign supaya output Artea AI lebih konsisten untuk launch mingguan.',
    'Feature ini akan membantu non-technical marketer memulai dari struktur campaign yang sudah baku. Template bisa berisi goal, audience, channel, tone, dan CTA.',
    'feature',
    'accepted',
    'high',
    'Prompt workflow',
    '/sample-template.svg',
    true,
    '2026-05-08 08:00:00+00',
    '2026-05-09 08:00:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Audit empty state dashboard belum memberi next action',
    'Dashboard kosong hanya menampilkan pesan singkat, belum mengarahkan user untuk membuat project pertama.',
    'Audit menemukan bahwa empty state terasa berhenti di informasi. Perlu ada next action yang jelas agar user baru tidak bingung setelah login.',
    'audit',
    'new',
    'medium',
    'Dashboard',
    '/sample-dashboard.svg',
    true,
    '2026-05-07 08:00:00+00',
    '2026-05-07 08:00:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111101',
    'Export result ke Google Docs',
    'Beberapa user meminta hasil generated content bisa langsung diexport untuk proses review internal.',
    'Feedback dari user interview: workflow mereka biasanya lanjut ke Google Docs untuk approval. Integrasi export bisa mengurangi manual copy-paste.',
    'feature',
    'need-info',
    'medium',
    'Export',
    '/sample-export.svg',
    true,
    '2026-05-05 08:00:00+00',
    '2026-05-06 08:00:00+00'
  )
on conflict (id) do nothing;

insert into public.report_evidence (report_id, url, media_type)
values
  ('11111111-1111-4111-8111-111111111104', '/sample-onboarding.svg', 'image'),
  ('11111111-1111-4111-8111-111111111103', '/sample-template.svg', 'image'),
  ('11111111-1111-4111-8111-111111111102', '/sample-dashboard.svg', 'image'),
  ('11111111-1111-4111-8111-111111111101', '/sample-export.svg', 'image')
on conflict do nothing;

insert into public.report_comments (report_id, author_id, body, created_at)
select '11111111-1111-4111-8111-111111111104', profiles.id, 'Accepted. Please check safe-area spacing and sticky CTA behavior.', '2026-05-10 08:00:00+00'
from public.profiles
order by created_at
limit 1
on conflict do nothing;
