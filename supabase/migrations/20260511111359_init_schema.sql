create type report_type as enum ('bug', 'feature', 'audit');
create type report_status as enum ('new', 'need-info', 'accepted', 'in-progress', 'shipped', 'rejected');
create type report_priority as enum ('low', 'medium', 'high', 'urgent');
create type profile_role as enum ('admin', 'reviewer', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
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

alter table public.reports enable row level security;
alter table public.report_comments enable row level security;
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

create policy "Public reports are readable by everyone"
  on public.reports for select
  using (is_public = true);

create policy "Authenticated users can create reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "Authenticated users can read comments on public reports"
  on public.report_comments for select
  using (
    exists (
      select 1
      from public.reports
      where reports.id = report_comments.report_id
      and reports.is_public = true
    )
  );

create policy "Authenticated users can comment"
  on public.report_comments for insert
  to authenticated
  with check (auth.uid() = author_id);
