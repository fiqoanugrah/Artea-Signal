alter table public.reports
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id),
  add column if not exists delete_reason text;

create index if not exists reports_deleted_at_idx on public.reports (deleted_at);
create index if not exists reports_created_at_idx on public.reports (created_at desc);

drop policy if exists "Public reports are readable by everyone" on public.reports;

create policy "Public active reports are readable by everyone"
  on public.reports for select
  using (is_public = true and deleted_at is null);

create policy "Admins can read every report"
  on public.reports for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update reports"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can permanently delete reports"
  on public.reports for delete
  to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-evidence',
  'report-evidence',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read report evidence"
  on storage.objects for select
  using (bucket_id = 'report-evidence');

create policy "Authenticated users can upload report evidence"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'report-evidence' and owner = auth.uid());

create policy "Admins can delete report evidence"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'report-evidence' and public.is_admin());
