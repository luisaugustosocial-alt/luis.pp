-- Luis.pp — esquema seguro do banco de dados e armazenamento privado
create extension if not exists pgcrypto;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  name text not null,
  subject text not null default 'Sem matéria',
  description text not null default '',
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.subjects add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.documents add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.subjects drop constraint if exists subjects_name_key;
create unique index if not exists subjects_user_name_unique on public.subjects(user_id, name);
create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists documents_user_created_idx on public.documents(user_id, created_at desc);

alter table public.subjects enable row level security;
alter table public.documents enable row level security;
drop policy if exists "Users can read their own subjects" on public.subjects;
drop policy if exists "Users can create their own subjects" on public.subjects;
drop policy if exists "Users can update their own subjects" on public.subjects;
drop policy if exists "Users can delete their own subjects" on public.subjects;
create policy "Users can read their own subjects" on public.subjects for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own subjects" on public.subjects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own subjects" on public.subjects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own subjects" on public.subjects for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can read their own documents" on public.documents;
drop policy if exists "Users can create their own documents" on public.documents;
drop policy if exists "Users can update their own documents" on public.documents;
drop policy if exists "Users can delete their own documents" on public.documents;
create policy "Users can read their own documents" on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own documents" on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own documents" on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own documents" on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('academic-files', 'academic-files', false, 52428800, null)
on conflict (id) do update set public = false, file_size_limit = 52428800;
drop policy if exists "Users can read their own academic files" on storage.objects;
drop policy if exists "Users can upload their own academic files" on storage.objects;
drop policy if exists "Users can delete their own academic files" on storage.objects;
drop policy if exists "Users can update their own academic files" on storage.objects;
create policy "Users can read their own academic files" on storage.objects for select to authenticated using (bucket_id = 'academic-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can upload their own academic files" on storage.objects for insert to authenticated with check (bucket_id = 'academic-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can delete their own academic files" on storage.objects for delete to authenticated using (bucket_id = 'academic-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can update their own academic files" on storage.objects for update to authenticated using (bucket_id = 'academic-files' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'academic-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.documents to authenticated;