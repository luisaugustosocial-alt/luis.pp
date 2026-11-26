-- Luís.pp: armazenamento persistente das avaliações por disciplina e semestre.
-- Execute este arquivo no SQL Editor do projeto Supabase conectado ao Luís.pp.
alter table public.subjects
  add column if not exists grade_data jsonb not null
  default '{"columns":[]}'::jsonb;

comment on column public.subjects.grade_data is
  'Avaliações e notas da disciplina, em JSON, isoladas por semestre.';
