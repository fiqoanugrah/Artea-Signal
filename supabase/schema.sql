create type report_type as enum ('bug', 'feature', 'audit');
create type report_status as enum ('new', 'need-info', 'accepted', 'in-progress', 'shipped', 'rejected');
create type report_priority as enum ('low', 'medium', 'high', 'urgent');
create type profile_role as enum ('admin', 'reviewer', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  username text,
  avatar_url text,
  role profile_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::profile_role, 'member'::profile_role)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
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
    and profiles.role = 'admin'
  );
$$;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  description text not null,
  type report_type not null,
  status report_status not null default 'new',
  priority report_priority not null default 'medium',
  area text not null,
  reporter_id uuid references auth.users(id),
  owner_id uuid references auth.users(id),
  evidence_url text,
  is_public boolean not null default true,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  url text not null,
  storage_path text,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;
alter table public.report_comments enable row level security;
alter table public.report_evidence enable row level security;
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public reports are readable by everyone"
  on public.reports for select
  using (is_public = true and deleted_at is null);

create policy "Admins can read every report"
  on public.reports for select
  to authenticated
  using (public.is_admin());

create policy "Authenticated users can create reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

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

create policy "Admins can update reports"
  on public.reports for update
  to authenticated
  using (public.can_triage())
  with check (public.can_triage());

create policy "Admins can permanently delete reports"
  on public.reports for delete
  to authenticated
  using (public.is_admin());

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

create policy "Authenticated users can comment"
  on public.report_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-evidence',
  'report-evidence',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read profile avatars"
  on storage.objects for select
  using (bucket_id = 'profile-avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-avatars' and owner = auth.uid());
