-- Luis.pp — esquema inicial do banco de dados
create extension if not exists pgcrypto;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
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

alter table public.subjects enable row level security;
alter table public.documents enable row level security;

-- Antes de usar com documentos reais, configure autenticação segura,
-- limite de tentativas, políticas RLS e acesso privado ao bucket.
insert into storage.buckets (id, name, public, file_size_limit)
values ('academic-files', 'academic-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;