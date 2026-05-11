alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

update public.profiles
set username = split_part(email, '@', 1)
where username is null;

drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

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

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile-avatars' and owner = auth.uid())
  with check (bucket_id = 'profile-avatars' and owner = auth.uid());
